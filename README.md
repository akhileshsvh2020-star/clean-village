# CleanVillage

An independent implementation for the agreed multi-village sanitation project. The sibling reference repository is unchanged.

## Run the application

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

## Implemented application scope

- Resident registration with email-code verification, private complaints, GPS coordinates, mandatory evidence, duplicate protection, resubmission, resolution review, exact coin ledger, rewards and delivery tracking.
- Manager invitations, mobile onboarding, team creation and membership, village complaint operations, staff-removal approval workflow, schedules, missed-collection replacements, reward handover, awareness, drives and reports.
- Working-staff assignment updates, completion/no-issue evidence, rework queue, collection reporting and code-confirmed reward delivery.
- Admin multi-village oversight, supported village/area management, manager appointments/removal, complaint intervention, reward catalogue/dispatch, schedules, community publishing and PDF/Excel exports.
- Persistent SQLite data, server-enforced role and village access, hashed passwords, HttpOnly sessions, in-app notifications, queued email records, responsive layouts and reduced-motion support.

## External-service and deployment boundary

The application queues email messages in `email_outbox`, but a real email provider is not configured. SMS/OTP, Telugu translation, production object storage, hosting, TLS, backups, rate limiting and production migrations require deployment credentials and infrastructure. The local demo labels these services honestly; it does not pretend they are connected.

## Verify

`npm test` starts an isolated in-memory database and tests privacy, role scoping, mandatory evidence, assignment, proof review, rework, no-issue rejection, exact coin handling, registration, email verification, role invitations, teams, schedules, community publishing and PDF export. It does not contact live services.
