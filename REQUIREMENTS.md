# CleanVillage — agreed requirements

This is a new implementation. ../reference-clean-village is reference material only.

## Delivery and appearance
College demonstration with real village use in mind. Website, source, project report and PPT required; no video. English first, Telugu later. Professional greenery theme, restrained accessible motion, mobile support. No government affiliation implied.

## Roles and jurisdictions
Normal user, manager, admin and working staff. Multiple supported villages, each with areas and potentially multiple managers. Admin appoints managers by village; managers appoint registered users as staff through accepted invitations. Managers create area teams and manage membership. Individual staff logins share team assignments. Admin oversees all complaints and can intervene in assignment and verification; no admin team membership controls.
Public registration: name, email, password, village; email verification required. Accepted manager/staff appointments require mobile onboarding before role access. SMS verification was recommended, not yet explicitly approved. Manager/staff cannot create personal complaints or redeem; prior complaints continue without further coins. Stored balance and rewards are hidden and restored on return to normal user; no retroactive stage awards.
Admin may remove managers. Staff role removal: manager sends required reason, admin accepts/rejects, notification opens one-time removal action only on acceptance; manager completes removal. Handover required for individual duties; team duties stay with remaining members. Cannot leave pending work with an empty team.

## Complaints
Citizen sees only own complaints. Required photo (at least one), description, category, supported village/area selection and precise map/GPS location with landmark. Route by complaint location, not home village. Manager sees village; admin sees all and filters; staff sees assigned team work. Manager/admin choose priority and verify/reject with reason. Staff update sequential stages once; actor/time retained, no staff edits. Manager/admin corrections retained in history.
10 coins at initial verification, 10 at resolution, each once. Different reporters of the same genuine issue may each earn; same reporter duplicates cannot. Link reports to one cleaning assignment (not yet implemented). Recurrence must be genuine. No-issue evidence from staff needs manager/admin confirmation; reverse verification credit once, allow negative balance even after redemption. Corrected same complaint may restore reversed verification credit once on genuine reverification. Financial state changes must be atomic.
Staff completion requires proof photo, visible to reporter, manager and admin. Completion releases team immediately; complaint awaits approval. Either manager/admin approves once; immediate second credit. Rework requires reason, original team queues it behind current work; fresh proof, history preserved, no extra awards. Rejected complaints may be corrected/resubmitted with same ID/history. Resolved complaint review needs reporter reason/new photo; manager/admin must accept to reopen.
Unassigned complaints remind village managers and admin every 3 working hours, seven days/week; working hours deferred. In-app and email notifications.

## Rewards
Admin owns catalogue, coin cost and stock. Successful order deducts coins/reserves stock and must be fulfilled; no routine cancellation. Delivery: Requested → Dispatched to Village (admin) → Received by Manager → Out for Delivery (staff) → Delivered (single-use recipient code entered by staff). Manager assigns area team. User supplies delivery village/area/address/contact. Timestamps, progress notifications, no delivery estimate. Role conversion with pending orders remains to be resolved.

## Other modules
Manager primarily manages village collection schedules; admin can also edit. Area team separately marks scheduled collection completed or missed; missed requires reason, completion needs no photo. Replacement time set by manager/admin; residents see updated timing, missed record preserved.
Awareness: admin and village managers publish/edit. Events: both organise, managers village-limited; registration and attendance, no coins. Only complaints earn coins.
Monthly reports: received/resolved/rejected/pending, assignment backlog, average resolution time, collections completed/missed/rescheduled, coin credits/reversals/redemptions, events and attendance. Village-scoped manager reports; individual/all village admin reports. PDF and Excel exports.

## Implementation status
The local application now covers the four role portals and the agreed complaint, coin, invitation, team, removal-approval, reward-delivery, collection-schedule, awareness, event-registration and reporting workflows. Email verification and all notification emails are recorded in a provider-ready outbox; the demo reveals verification codes locally for testing. PDF and Excel downloads are generated from role-scoped data.

Deployment-dependent work remains separate: connect a transactional email provider, decide and configure working hours for three-hour reminders, decide whether SMS verification is required, translate the approved English interface to Telugu, move photographs to production object storage, and add hosting protections/backups/TLS. These require credentials or decisions that have not been provided and are not simulated as live services.
