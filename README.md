# Lumen Psychiatry Group — widget integration demo

Static demo marketing site embedding MemberMD widgets via iframe.
Used to validate cross-origin embed behavior end-to-end.

**Live URL:** https://michelevens.github.io/lumen-psychiatry-group/

## Updating the tenant_code

The `PASTE_TENANT_CODE` and `PASTE_SIGNATURE_TOKEN` placeholders
in `index.html` need to be replaced with real values from the
production database.

To generate them, run this in the MemberMD backend:

```bash
php artisan widgets:seed-test-practices --source="EnnHealth Psychiatry"
```

The command prints a JSON block. Take the `tenant_code` and
`signature_token` for the matching practice (slug
`widget-demo-lumen-psychiatry-group`) and paste them into `index.html`, then push.

## Tear-down

Delete this repo and run on production:

```sql
DELETE FROM practices WHERE slug = 'widget-demo-lumen-psychiatry-group';
```
