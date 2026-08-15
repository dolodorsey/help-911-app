# HELP 911 Release Handoff

## Canonical identity

- Repository: `dolodorsey/help-911-app`
- Production: `https://help911.help`
- Case authority: MCP Gateway `public.help911_*`
- Intake/staging: controlled Google Drive Sheets
- Data classification: highly restricted

## Release rule

`public.help911_leads` is authoritative for identity, consent, provenance, assignment, status, and verified case facts. Sheets may append controlled intake evidence but may not overwrite consent, assignment, verification, legal status, or disposition.

## Required checks

1. Run `npm ci`.
2. Run `node --test tests/*.test.mjs`.
3. Run `npm run build`.
4. Confirm `/health.json` identifies restricted classification and the MCP authority.
5. Use sanitized test data in preview.
6. Validate consent proof, provenance, duplicate detection, qualification, assignment, partner acceptance/rejection, transfer, notes, documents, audit history, and contact preferences/DNC.
7. Confirm partner access is limited to assigned records.
8. Confirm Sheet imports are staged, validated, idempotent, and unable to overwrite protected fields.
9. Record evidence in Enterprise System Control.

## Data rules

- Access is limited by brand, role, assignment, purpose, and audit history.
- Public links, broad exports, unrestricted Sheets, and cross-brand reuse are prohibited.
- Never place secrets or reusable credentials in Drive documents.

## Rollback

Revert Vercel, suspend the affected import/integration, preserve the MCP lead, block the release gate, and document every potentially affected lead and contact attempt before resuming.
