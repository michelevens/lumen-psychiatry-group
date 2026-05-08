# Lumen Psychiatry Group — widget integration demo

Static demo marketing site embedding MemberMD widgets via iframe.
Cloned and rebranded from ennhealth-psychiatry to validate widget
integration end-to-end on a realistic-looking practice site.

**Live URL:** https://michelevens.github.io/lumen-psychiatry-group/

## What's embedded

- Plan comparison + enrollment widget (in the pricing section)
- Booking widget (in the booking section)
- Signature widget (new "Patient Forms" section)

All four point at MemberMD tenant_code `PASTE_TENANT_CODE`.

## Updating the widget targets

Re-run `rebrand.sh` from the widget-demo-repos working dir with
new `TENANT_CODE` / `SIGNATURE_TOKEN` env vars, then `git push`.

## Tear-down

Delete this repo and run on production:

```sql
DELETE FROM practices WHERE slug = 'widget-demo-lumen-psychiatry-group';
```
