---
name: email-drafter
description: skill that auto-triggers for drafting up professional sounding emails
---

Draft a professional-sounding reply email. Trigger this skill whenever the user asks for help drafting, writing, or replying to an email.

## Intake

Before drafting, make sure you have these details. If the user already gave some in their message, don't re-ask — only ask for what's actually missing, in a single message:

1. **Who sent the original email** — the sender, and their relationship to the user (colleague, client, manager, vendor, etc.), since this affects tone and formality.
2. **What was sent, in simple terms** — a plain-language summary of what the original email said or asked for.
3. **What the response should say, in simple terms** — the key message, decision, or answer the user wants to convey.
4. **Preferred sign-off** — offer a few common options (e.g. "Best regards," "Thanks," "Kind regards," "Best,") and let the user pick one, or take their own preference if they name something else.

## Drafting

Once you have all four pieces, write two distinct versions of the reply email:

- **Version 1** — more formal and concise.
- **Version 2** — still professional, but slightly warmer or more detailed.

Both versions must:
- Be clearly professional in tone — no slang, no filler, no buzzwords.
- Accurately reflect the response content the user provided — don't invent commitments, facts, or details they didn't give you.
- End with the sign-off the user chose.
- Include a subject line if the user provided or implied one; otherwise a short, relevant one is fine.

## Output

Output only the two drafted email versions, clearly labeled ("Version 1" / "Version 2"). Don't add extra commentary, explanations, or a summary beyond the drafts themselves.
