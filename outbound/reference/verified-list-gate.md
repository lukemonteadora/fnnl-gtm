# Verified-List Gate (R1 + R2)

Canonical definition of the gate that enforces the two hard rules of the cold-outbound flow. This file is the **single source of truth** — skills reference it; they never re-derive the conditions.

- **R1 — The lead list drives the message.** Copy and campaign angles are built FROM the real, verified data in the slice. Campaigns are developed around signals that actually exist in the list — never invented first and then forced onto a list afterward.
- **R2 — No copy, no finalized campaign, before a verified lead-list slice + a locked strategy exist.**

## The Gate

A skill that does any of the following MUST NOT proceed past its first generative output until **all three** conditions below hold for **this campaign slice**:

- (a) emits sendable copy — subject lines, email bodies, sequences, spintax, lifecycle / follow-up copy; or
- (b) finalizes or packages a campaign object for upload; or
- (c) renders finalized campaign copy into a client-facing deliverable.

**Conditions (all three required):**

1. **VERIFIED SLICE.** `profiles/<business-slug>/campaigns/<campaign-slug>/leads.verified.csv` exists and is non-empty, produced by `/email-waterfall` (100% verification-checked; every non-deliverable row moved to `leads.review.csv`). "Verification-checked" means the row's email was checked by the **email-verification capability** (`lead_data.email_verification` in `stack-contract.yaml`), and that check both confirmed the address will accept mail **and** returned catch-all status as a separate signal from valid/invalid, per the `/email-waterfall` Verification Doctrine. Whatever tool fills that slot is the **verifier of record for every email regardless of what surfaced it**: an email the row already carried, or one found by any contact-enrichment or waterfall tool, current or future. **No surfacing source is exempt, including a waterfall tool that runs its own internal verification.** A finder's own check is a provider signal about its confidence, not the send-gate, so it never substitutes for the verifier of record. The condition also requires a **real first and last name** on every row; index/pattern-derived emails and fabricated-name rows never satisfy it. (A finder or waterfall run is not required for a row whose existing email the verifier already returns `valid` for. Verify-first stands on its own.)

   If `lead_data.email_verification` is still `not_chosen` or `held`, this condition cannot be satisfied at all: there is no verifier of record, so no slice is verified. Route to `/stack-setup` rather than accepting a finder's internal check in its place.
2. **LIST GRADE.** That slice has passed `/list-quality-scorecard` with grade **B or better**.
3. **LOCKED STRATEGY.** The campaign is a selected row in the client's `campaign-strategy.md`; its `lead-source-plan.md` exists; `client-profile.yaml` `offer.lead_magnet` and CTA direction are locked (not only `offer.client_suggested_*` hypotheses), or, for a validation-arm cell or a per-segment cell, the cell's offer is a locked entry in `offer.validation_arms` or in its segment's set in `offer.segments`, with `lead_magnet_client_ok` `not_needed` or `yes`; and `run_state.sending_platform` is locked.

## On failure

STOP. Name the specific condition that failed and route to its producer — do not generate copy anyway, and do not treat a DRAFT/PAUSED upload as a substitute:

- No verified slice → `/email-waterfall`, then `/list-quality-scorecard`.
- Grade below B → fix the source/list (do not send a thin list).
- Strategy not locked → `/campaign-strategy` (with `/lead-source-strategy` Lead Source Plan Mode and `/offer-intelligence` / `/lead-magnet-brainstorm`).

Autonomy never relaxes this gate. Under `/autonomous-execution-policy` `auto_execute`, this is a **hard stop** — the same class as spend-over-ceiling, live send, and credentials.

## Exceptions (inherit the gate; do not re-check)

- **Post-reply / list-agnostic copy**, e.g. `interested-reply` and `pre-call` nurture in `/lifecycle-copy`. They are written before Start (Gate D, reply readiness; Aaron process alignment, operator directive 2026-09-22) but only ever sent after a reply or a booking, so they assert the **parent** slice was gate-built, not a fresh `leads.verified.csv` check. A fresh check here would be a false block.
- **Pre-enrichment planning** — `/campaign-approval-brief` is intentionally a *pre-list-build, pre-enrichment* gate and is allowed to run before a verified list exists. Only its finalized-**copy-preview** section is gated: skip or placeholder the preview when no verified slice exists yet. Brief generation itself stays on plan-level fields.
- **Re-uploading an already-verified external list** — allowed only behind an explicit operator `verified_flag` override (a hard-stop-class action the operator takes deliberately), so a verified export named `leads.csv` is not false-blocked.

## Skills that reference this gate

Assert all three conditions directly: `/campaign-copywriting`, `/personalization-subagent-pattern`, `/auto-research-public`, and the campaign-upload skill for whichever platform is locked in `run_state.sending_platform`, if `/stack-setup` activated a pack that provides one (`/smartlead-campaign-upload-public` and `/emailbison-campaign-upload-public` are those skills in their packs). If no pack is active, the gate still binds: it applies to whoever performs the upload, including a manual one on the platform's native surface.

Inherit the upstream gate (point here, no fresh list check): `/lifecycle-copy`, the spintax skill for the locked sending platform where an activated pack provides one (`/smartlead-spintax`, `/emailbison-spintax`), and the DOCX-presentation skills (`cold-email-campaign-sequence-docx-presentation`, `cold-email-followups-docx-presentation`, `interested-replies-docx-presentation`, `pre-call-nurture-docx-presentation`).

Policy teeth: `/autonomous-execution-policy` (hard-stop list). Partial / preview-only: `/campaign-approval-brief`.
