"""Pydantic schemas for the Ad Recon Engine.

Two jobs:
  1. Validate every LLM response (deconstruction cards, counsel reviews).
  2. Define the resumable run-state machine + the scraped-ad / scored-ad shapes.

All deconstruction fields use CONTROLLED-VOCAB Literals so the commonality
table is computable by counting (Copy Forensics requirement). Where a field
maps to a Ship skill slot, the enum reuses that skill's existing codes so the
card IS the input contract.
"""

from __future__ import annotations

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field, field_validator


# ===========================================================================
# Controlled vocabularies (enums)
# ===========================================================================

# Hook codes — REUSED from ss-ad-generator hook_structure_code.
HookCode = Literal["Q", "S", "C", "M", "SO", "D", "P"]
# Q=question  S=statement/shock  C=curiosity  M=mechanism  SO=story-open
# D=direct/callout  P=pattern-interrupt

Pacing = Literal["slow", "medium", "rapid"]
AudioChoice = Literal["music-only", "voiceover", "ugc-talking-head", "mixed"]

# Narrative structure — the dominant skeleton shape (maps to ad-copy-forge).
NarrativeStructure = Literal[
    "problem-agitate-solve", "aida", "story-led", "demonstration",
    "listicle", "testimonial-led", "before-after", "founder-confession",
]

CtaPlacement = Literal[
    "end-card", "mid-roll", "persistent-overlay", "text-only", "verbal-only"
]
# CTA variant type — REUSED from ss-ad-generator cta_variants.
CtaVariant = Literal[
    "proof-bridge", "pattern-recognition", "curiosity", "direct-quiz",
    "risk-reversal", "direct",
]

AwarenessLevel = Literal["unaware", "problem", "solution", "product", "most-aware"]

ProofType = Literal[
    "demonstration", "testimonial", "authority", "social-count",
    "before-after", "specific-number", "guarantee", "none",
]
ProofStrength = Literal["strong", "weak"]

# Subtext belief-shift — maps to the canonical 6 Core Beliefs (Prop Machine).
BeliefShift = Literal[
    "vehicle-works",        # the method/vehicle is the right one
    "i-can-do-it",          # internal belief — I'm capable
    "worth-the-cost",       # external/value belief
    "not-my-fault",         # absolution / reframe of past failure
    "now-is-the-time",      # urgency / timing
    "safe-to-trust",        # risk reversal / authority trust
]

OfferType = Literal[
    "low-ticket-dtc", "high-ticket-coaching", "service", "lead-magnet",
    "webinar", "application", "unknown",
]

RunStatus = Literal[
    "fetched", "scored", "awaiting_pick", "deconstructing", "done", "blocked"
]
SearchMode = Literal["advertiser", "keyword"]


def _strip_injection(v: Optional[str]) -> Optional[str]:
    """Strip zero-width chars + BiDi overrides (injection defense)."""
    if v is None:
        return None
    for c in ("​", "‌", "‍", "‮", "‭", "﻿"):
        v = v.replace(c, "")
    return v


# ===========================================================================
# Scout — scraped + scored ads
# ===========================================================================

class ScrapedAd(BaseModel):
    """One ad as scraped from the public Meta Ad Library web UI."""
    ad_id: str = Field(..., min_length=1, max_length=64)
    advertiser: str
    advertiser_id: Optional[str] = None
    destination_url: Optional[str] = None
    primary_text: Optional[str] = None
    headline: Optional[str] = None
    cta_text: Optional[str] = None
    start_date: Optional[datetime] = None
    days_active: int = Field(0, ge=0)
    platforms: list[str] = Field(default_factory=list)   # facebook, instagram, ...
    regions: list[str] = Field(default_factory=list)     # country codes
    is_video: bool = False
    creative_url: Optional[str] = None
    snapshot_url: Optional[str] = None
    first_frame_path: Optional[str] = None

    @field_validator("primary_text", "headline", "advertiser", "cta_text")
    @classmethod
    def _clean(cls, v):
        return _strip_injection(v)


class ScrollStop(BaseModel):
    """Cheap first-frame / first-3s scroll-stop rubric (scan-all tier)."""
    motion: int = Field(0, ge=0, le=3)
    face: int = Field(0, ge=0, le=2)
    text_hook: int = Field(0, ge=0, le=3)
    pattern_interrupt: int = Field(0, ge=0, le=2)

    @property
    def total(self) -> int:
        return self.motion + self.face + self.text_hook + self.pattern_interrupt

    @property
    def max_total(self) -> int:
        return 10


class OutlierScore(BaseModel):
    """Composite Outlier Score. Longevity-dominant; scroll-stop soft-floor veto."""
    longevity: float = Field(0.0, ge=0, le=1)
    variant: float = Field(0.0, ge=0, le=1)
    scroll_stop: float = Field(0.0, ge=0, le=1)
    region: float = Field(0.0, ge=0, le=1)
    composite: float = Field(0.0, ge=0, le=1)
    floor_vetoed: bool = False  # bottom-quartile scroll-stop capped the composite


class ScoredAd(BaseModel):
    ad: ScrapedAd
    cluster_id: str
    variant_count_in_cluster: int = Field(1, ge=1)
    scroll_stop: ScrollStop
    score: OutlierScore
    fit_ok: bool = True               # passes the client-fit gate
    fit_note: Optional[str] = None    # why flagged, if not


class ConceptCluster(BaseModel):
    cluster_id: str
    cluster_key: str                  # normalized destination URL or offer-hash
    advertiser: str
    member_ad_ids: list[str] = Field(default_factory=list)


# ===========================================================================
# Study — the 9-dimension deconstruction card
# ===========================================================================

class ProofItem(BaseModel):
    proof_type: ProofType
    strength: ProofStrength = "weak"
    specific_number_present: bool = False
    verbatim_claim: str = Field("", max_length=400)


class DeconstructionCard(BaseModel):
    """Per-ad deconstruction. Frontmatter-grade machine fields + evidence."""
    ad_id: str
    advertiser: str

    # --- 5 descriptive (the skeleton) ---
    hook_type: HookCode
    hook_evidence: str = Field(..., max_length=400)      # the opening line/text
    pacing: Pacing
    audio_choice: AudioChoice
    narrative_structure: NarrativeStructure
    cta_placement: CtaPlacement
    cta_variant: CtaVariant

    # --- 4 mechanism-grade (the engine) ---
    unique_mechanism: str = Field(..., min_length=12, max_length=400)
    awareness_level: AwarenessLevel
    awareness_evidence: str = Field(..., max_length=400)
    proof: list[ProofItem] = Field(default_factory=list)
    skepticism_neutralized: str = Field("", max_length=400)
    avatar: str = Field(..., min_length=3, max_length=300)
    emotional_turning_point: str = Field("", max_length=300)
    wallet_line: str = Field("", max_length=300)
    nesb_new: bool = False
    nesb_easy: bool = False
    nesb_safe: bool = False
    nesb_big: bool = False
    subtext_belief_shift: BeliefShift
    subtext_evidence: str = Field("", max_length=300)

    # --- on-screen text (OCR ∪ whisper, merged) ---
    onscreen_text: str = Field("", max_length=2000)

    # --- gate disposition ---
    fidelity: Literal["pass", "low-fidelity"] = "pass"
    gate_notes: Optional[str] = None


class CommonalityRow(BaseModel):
    dimension: str
    modal_value: str
    pct: float = Field(..., ge=0, le=100)
    low_confidence: bool = False   # modal value below the confidence floor


class WinningFormula(BaseModel):
    sample_size: int = Field(..., ge=0)
    rejected_count: int = Field(0, ge=0)
    rows: list[CommonalityRow] = Field(default_factory=list)


# ===========================================================================
# Counsel review (persona-in-Python gates)
# ===========================================================================

class CounselNPCReview(BaseModel):
    npc_slug: str
    npc_name: str
    score: int = Field(..., ge=1, le=10)
    lands: str = Field(..., max_length=600)
    weak: str = Field(..., max_length=600)
    edit_suggestion: str = Field(..., max_length=900)

    @field_validator("lands", "weak", "edit_suggestion", mode="before")
    @classmethod
    def _truncate_review(cls, v, info):
        # The model writes good critique but sometimes overruns the cap. The
        # content is fine — truncate rather than reject (a too-long review must
        # not kill the whole ad's deconstruction).
        caps = {"lands": 600, "weak": 600, "edit_suggestion": 900}
        if isinstance(v, str):
            return v[: caps.get(info.field_name, 600)]
        return v

    @field_validator("score", mode="before")
    @classmethod
    def _clamp_score(cls, v):
        try:
            return max(1, min(10, int(round(float(v)))))
        except (TypeError, ValueError):
            return v


# ===========================================================================
# Run-state machine
# ===========================================================================

class ReconRun(BaseModel):
    schema_version: int = 1
    run_id: str
    status: RunStatus = "fetched"
    search_mode: SearchMode
    query: str                         # advertiser name or keyword
    brand_preset: str                  # which preset's fit-gate applies
    created_at: datetime
    updated_at: datetime
    shortlist_ad_ids: list[str] = Field(default_factory=list)
    picked_ad_ids: list[str] = Field(default_factory=list)
    deconstructed_ad_ids: list[str] = Field(default_factory=list)
    report_path: Optional[str] = None
    total_cost_usd: float = Field(0.0, ge=0)
    note: Optional[str] = None          # e.g. "blocked, retry later"


class SeenLedger(BaseModel):
    schema_version: int = 1
    advertiser_slug: str
    seen_ad_ids: list[str] = Field(default_factory=list)
    last_run_at: Optional[datetime] = None
