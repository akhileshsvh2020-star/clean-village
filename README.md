# CleanVillage

An independent implementation for the agreed multi-village sanitation project. The sibling reference repository is unchanged.

## Run the first development increment

Requires Node.js 24 or newer. No package installation is required.

```powershell
cd 'D:\sourya project(CSP)\clean-village'
npm run demo
```

Open http://127.0.0.1:4173. This binds only to the local computer. SQLite stores records in `data/village.sqlite`, excluded from source control.

Explicit demo mode creates test accounts on an empty database:

| Role | Email |
| --- | --- |
| Resident | resident@demo.local |
| Village manager | manager@demo.local |
| Working staff | staff@demo.local |
| Admin | admin@demo.local |

Development password for these accounts: `VillageDemo!2026`. These are local fixtures, never production identities. Pinapadu and Burripalem are seeded test jurisdictions, not enrolled service partners. Do not publish the demo database.

## Working now

Session login/logout with hashed passwords and HttpOnly cookies; server-side role/jurisdiction scoping; SQLite persistence; complaint photographs/location coordinates; private resident dashboard; village/admin register; available area-team assignment; staff sequential work updates; proof submission; team release on completion submission; rework; no-issue rejection; exactly-once stage credits and reversals; history and in-app notifications. Mobile layouts and reduced-motion support.

## Not yet implemented

Public registration/email verification; real email sending; required mobile onboarding and SMS; invitation/removal approvals; team editing; duplicate report linking; complaint correction/resubmission and citizen review requests; map picker; reward catalogue/redemption/delivery; scheduled collection; awareness/events; reminders; PDF/Excel reports; Telugu; production hosting and deployment hardening (including request throttling, upload validation/storage, backups, TLS and migrations).

This is a development increment, not a complete production application. The remaining agreed scope is documented in REQUIREMENTS.md. The interface does not pretend that external services are connected.

## Verify

`npm test` starts an isolated in-memory database and tests privacy, role scoping, mandatory evidence, assignment, proof review, rework, no-issue rejection and duplicate coin prevention. It does not contact live services.
