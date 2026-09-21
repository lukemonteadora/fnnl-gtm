# Archived: cold-email-copy-best-practices, Signature Standards

- **Source file:** `outbound/reference/cold-email-copy-best-practices.md`
- **Section:** Signature Standards
- **Archived:** 2026-09-21 (operator-approved Aaron alignment)
- **Reason:** it required a three-line block with a job title and a location, where Aaron says name plus company, no title and no location (doctrine §9).

Replaced in place by a one-line pointer or an aligned rewrite. The original text, verbatim:

> - Email 1 (the single new thread) must close with a full signature block, not a first name alone. A fuller sign-off reads as a real person at a real company and supports legitimacy and deliverability.
> - The signature is a 3-line block: line 1 = full name; line 2 = title and company joined by " @ " (e.g. "Partner @ Acme Oy"); line 3 = company location (city + country).
> - **Phone line (optional 4th line):** when the client has supplied a sender phone number, add it as a 4th line below the location. Use ONE fixed number per persona (the persona is one real person — never show two or three different numbers across a client's campaigns); if the client provides several, the first is primary and the rest are held as spares in the profile (swap if a number is ever flagged). The number is static sender identity, sourced from `client-profile.yaml` `sender_persona.phone`, configured once on the step like the rest of the block — never spun, A/B-tested, or put in per-contact data. If the client has no number yet, the 3-line block stands; do not invent one.
> - In-thread follow-ups (Email 2, and Email 3 in a 3-step) sign with the first name only — they continue a thread where the sender's identity was already established. But a sign-off is mandatory: **every email in the sequence, follow-ups included, ends with at least a name.** A follow-up with no sign-off at all is a failure — it reads as an unsigned fragment. The minimum is the first name; the full block is optional on follow-ups.
> - Each signature line goes on its own line. The block stays plain text; line breaks are not "formatting" in the deliverability sense, so this does not violate the plain-text rule.
> - Do not invent a specific senior title for a fabricated sender persona — use a broad title (e.g. Partner) if there is none.
> - Do not spin, AI-vary, or A/B-test the signature. Pull the name from the sender persona and the company name + location from the client profile or public contact page.
> - Place the signature in the sending tool, never in per-contact lead or CSV data. In the `variants.yaml` template path it is part of the campaign step body. In the pre-written copy path the body variable carries no sign-off, and the static 3-line signature block is appended below the variable in the sending-tool step. See `/campaign-copywriting` Pre-Written Email Copy Architecture.
