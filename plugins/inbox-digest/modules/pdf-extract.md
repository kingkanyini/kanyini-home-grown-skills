# PDF Extract Module

Thin wrapper around `scripts/extract-pdf.py` (Python + pdfplumber) for use by Phase 2.

## Operation: `extract(input_path, output_path)`

**Inputs:**
- `input_path` — absolute path to a downloaded attachment (typically a `.pdf`; other types short-circuit)
- `output_path` — absolute path where the `.extracted.md` should be written

**Behavior:**

1. **Non-PDF short-circuit.** If `input_path` does NOT end in `.pdf` (case-insensitive), Phase 2 should write `output_path` with this stub content and return success:
   ```
   # Extracted text

   **NOT SUPPORTED:** only .pdf is auto-extracted in v1. Filename: <basename of input_path>
   ```
   (DOCX, .pptx, .xlsx support deferred to v2 / Sprint 2.)

2. **PDF path.** Execute the helper via Bash/PowerShell:
   ```powershell
   python "$env:USERPROFILE\.claude\plugins\local\inbox-digest\scripts\extract-pdf.py" "<input_path>" --out "<output_path>" --write-failure
   ```
   (or the equivalent bash form: `python ~/.claude/plugins/local/inbox-digest/scripts/extract-pdf.py "<input_path>" --out "<output_path>" --write-failure`)

3. The `--write-failure` flag means the script ALWAYS produces a markdown file at `<output_path>` — successful extraction OR failure stub. Phase 2 must NOT block brief generation on extraction failures (CIPHER-resilient: a corrupt PDF should not prevent the brief from rendering).

4. **Return contract:**
   - Non-PDF short-circuit → `{ok: true, path: <output_path>, mode: "not_supported"}`
   - Exit code 0 → `{ok: true, path: <output_path>, mode: "extracted"}`
   - Exit code 1 (missing input) → `{ok: false, path: <output_path>, mode: "missing_input", error: "input file not found"}` (with `<output_path>` written by `--write-failure`)
   - Exit code 2 (extraction exception) → `{ok: false, path: <output_path>, mode: "extraction_failed", error: <stderr_last_line>}` (with `<output_path>` written by `--write-failure`)

5. **Operational log line** (Phase 2 writes after this call):
   ```
   <iso> module=pdf-extract input=<basename> output=<basename> exit_code=<n> ms=<duration> mode=<extracted|missing_input|extraction_failed|not_supported>
   ```
   No file content in the log — metadata only.

## Phase 2 invocation pattern

Phase 2 calls this once per attachment that ends in `.pdf`. Sequential loop is fine for v1 — profile and parallelize only if observed slow. Most clients have ≤5 PDFs per scan.

## v2 Considerations

When DOCX support is added: short-circuit branch becomes "delegate to docx-extract.md" rather than writing a NOT-SUPPORTED stub. The interface (`extract(input_path, output_path)`) stays stable.
