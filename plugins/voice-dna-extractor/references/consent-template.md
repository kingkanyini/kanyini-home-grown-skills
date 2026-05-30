# Consent Template — Voice Cloning Authorization

**Mandatory for all client work. Cannot be skipped.**

This template is legal-counsel-aligned (Erika Kullberg / Devin Stone / Jordan Couch) and references the standard frameworks emerging in 2025-2026: Tennessee ELVIS Act, EU AI Act Article 50, California AB 942, FCC TCPA rules.

---

## The Two Components

A defensible consent record needs **both**:

1. **Recorded statement** (audio or video) — the client's voice, on the record, granting permission
2. **Written agreement** (signed PDF or e-sig) — the legal contract specifying scope and terms

Either one alone is risky. Both = bulletproof.

---

## 1. Recorded Statement Script

Send this to the client and ask them to record themselves saying it. Native phone video is fine — don't over-engineer. They should look at the camera and speak clearly.

> "My name is [Full Name]. Today is [Date]. I am the owner of my voice and I authorize [<your-name> / Agency Name] to use my published [podcast / video / Instagram] content to create a synthetic voice model of my voice.
>
> I understand this voice model can generate new audio in my voice based on text scripts I approve. I authorize use of this voice model for: [specific use cases — read the list].
>
> I understand I can revoke this consent at any time by sending written notice, and that no new content will be generated using my voice after revocation."

Save the recording to `~/.claude/voice-dna/[client-slug]/consent/recorded-statement.[mp4 or m4a]`.

---

## 2. Written Agreement Template

Send this as a PDF or via e-signature platform (HelloSign, DocuSign, etc.). The client signs and returns. Save to `~/.claude/voice-dna/[client-slug]/consent/written-agreement.pdf`.

---

### VOICE CLONING AUTHORIZATION AGREEMENT

**Effective Date:** [Date]

**Voice Owner:** [Full Legal Name], [Address]
**Authorized Party:** [<your-name> / Legal Entity Name], [Address]

#### 1. Grant of Authorization

Voice Owner authorizes Authorized Party to:

(a) Process Voice Owner's published audio and video content (specifically: [list source URLs or content identifiers]) to extract training data;

(b) Create a synthetic voice model ("Voice Clone") using the extracted training data;

(c) Generate new audio content using the Voice Clone for the use cases specified in Section 2.

#### 2. Permitted Use Cases

The Voice Clone may be used to generate audio for the following purposes only:

- [ ] Internal coaching and training content for current clients
- [ ] Public-facing podcast episodes
- [ ] Email marketing and promotional audio
- [ ] Website chatbot or voice agent
- [ ] Social media content (specify platforms): _____________
- [ ] Paid advertising on platforms (specify): _____________
- [ ] Other (specify): _____________

**Use cases not checked above are NOT permitted** and require separate written authorization.

#### 3. Term and Revocation

This authorization is effective from the Effective Date and continues until revoked.

Voice Owner may revoke this authorization at any time by providing written notice (email is acceptable) to Authorized Party. Upon revocation:

- Authorized Party will cease generating new audio content using the Voice Clone within 7 days;
- Existing published content using the Voice Clone will be removed from platforms controlled by Authorized Party within 30 days, OR remain published if Voice Owner provides written agreement to allow it (e.g., past episodes that audiences have already engaged with).

#### 4. Compensation

[ ] No compensation (relationship-based)
[ ] One-time fee: $______
[ ] Monthly retainer: $______ for [duration]
[ ] Revenue share: ______% of revenue from Voice-Clone-generated products
[ ] Other: _____________

#### 5. Data Protection

Authorized Party will:
- Store voice training data using AES-256 encryption at rest;
- Transmit voice data using TLS 1.2 or higher;
- Restrict access to the Voice Clone to authorized personnel only;
- Delete raw voice training data within 90 days of model creation, retaining only the trained Voice Clone model;
- Provide Voice Owner with access to inspect or request deletion of stored data within 30 days of written request.

#### 6. Disclosure

Authorized Party will disclose the use of synthetic voice generation in:
- Content distributed via YouTube (per YouTube AI policy)
- Content distributed via Spotify (per Spotify Anti-Impersonation policy)
- Outbound calls (per FCC TCPA rules)
- Any jurisdiction requiring disclosure (EU AI Act Article 50, California AB 942, etc.)

Standard disclosure language: *"This audio uses AI-generated voice based on [Voice Owner Name]'s published content."*

#### 7. Approval Workflow (optional, recommended for high-stakes deployments)

[ ] Voice Owner retains right to review and approve specific generated audio outputs before public deployment.
[ ] Approval is not required for routine outputs (specify routine: ______________).

#### 8. Liability

Authorized Party assumes full liability for:
- Use of the Voice Clone outside the permitted use cases (Section 2)
- Failure to disclose AI generation per Section 6
- Failure to honor revocation per Section 3

Voice Owner remains liable for the content of any scripts they personally approve and submit for generation.

#### 9. Governing Law

This agreement is governed by the laws of [State / Country].

---

**Voice Owner Signature:** _______________________ Date: _______

**Authorized Party Signature:** _______________________ Date: _______

---

## Lawyer Review Note

This template is a **starting point**, not finished legal advice. For high-value deals (>$10K annual contract, public-figure voices, voices that will appear in paid advertising) — pay a lawyer to review. The Legal Allstar Counsel members can flag the issues but cannot replace a real attorney for a real contract.

For low-stakes coaching relationships ($<$5K, internal use only), this template + recorded statement is generally sufficient.

---

## Storage and Retention

After both components are received:

```
~/.claude/voice-dna/[client-slug]/consent/
├── recorded-statement.mp4    # or .m4a
├── written-agreement.pdf
└── consent-metadata.json
```

`consent-metadata.json`:
```json
{
  "client_name": "Full Name",
  "consent_date": "YYYY-MM-DD",
  "recorded_path": "recorded-statement.mp4",
  "agreement_path": "written-agreement.pdf",
  "scope": ["use case 1", "use case 2"],
  "compensation_type": "monthly_retainer",
  "term": "until_revoked",
  "revocation_notice_period_days": 7
}
```

This metadata is read by the registry and surfaced in the profile card so future runs know what scope is approved.
