# Interview Flow

Per-section interview loop for Phase 2.

## Setup per section

1. Read section entry from playbook/interview-bank.json[chapter_key][section_key]
2. Tell user to check companion site: print `Check companion at #<short>.<sec>`
3. Fallback text: take teaching_slides[0].caption as a one-liner if companion closed.

## Question framing

Use section master_lens + master_emphasis as intro. RPG framing ABOVE AskUserQuestion call.

Example scaffold:

    *{MASTER} leans in.*

    {master_lens}

    Key things to push on:
    - {emphasis_1}
    - {emphasis_2}

    *QUEST: {section_title}*

    [AskUserQuestion call]

## AskUserQuestion batching

- Up to 4 related questions per AskUserQuestion call
- 2-4 clickable options + auto "Other" for every question
- Translate open-ended workbook Qs into 3-4 categorical options + Other

## Recording answers

After each AskUserQuestion, call scripts/registry.py update_section_status:

    update_section_status(
        path=registry_path,
        code=project_code,
        chapter_key="ch3_content",
        section_key="sec2_belief_shift_1",
        status="complete",
        answers={"q1": "<answer>", "q2": "<answer>"}
    )

## Chapter-end trigger

When final section completes:
1. Run Counsel Review Choreography
2. Synthesize chapter-outline-N.md
3. AskUserQuestion: approve / revise / re-interview
4. On approval: mark chapter_review.status = complete
