# HunarOS v2 - Product Requirements Document (PRD)

**Target build environment:** Google AI Studio
**Target application platform:** Firebase-centered architecture
**Document status:** Draft for implementation planning
**Version:** v2.1

> This PRD carries forward the business intent of the original HunarOS requirements while changing the implementation platform from Supabase/PostgreSQL to Firebase. Any requirement not explicitly confirmed in the new product plan remains an open decision rather than an invented requirement.

## 1. Product Vision

HunarOS is a production-grade, multi-organization institute management platform for vocational training operations, including private and NAVTTC-affiliated programs. The system replaces fragmented spreadsheets and disconnected operational tools with one governed source of truth.

The product must support multiple organizations/institutes, each with programs, courses and batches, while maintaining strict organization isolation, auditable workflows, operational visibility, and mobile-first data entry.

## 2. Primary Problems to Solve

- Duplicate or conflicting student records across spreadsheets.
- Students being contacted or scheduled incorrectly.
- Documents and certificates being lost or untracked.
- Attendance living outside the main operational system.
- Stipends, spending and organization-level finance lacking a single ledger.
- CVs disappearing after submission.
- Manual lead and agent commission reconciliation.
- Important physical hand-offs lacking reliable receipts.
- Operational knowledge being trapped in individual staff workflows.

## 3. Core Product Principles

1. **Person identity is global.** CNIC is the primary identity key for a Person where available; leads may exist before CNIC capture.
2. **Organization is a hard security boundary.** A user must never access another organization's data unless their role explicitly grants that scope.
3. **Business status is controlled.** States and transitions are explicit, validated, and covered by tests.
4. **Important history is auditable.** Finance, custody, certificate and other material events must be traceable.
5. **Physical hand-offs require receipts/signatures where applicable.**
6. **External systems use adapters.** Provider replacement must not require rewriting the core domain.
7. **Mobile-first operational UX.** High-frequency tasks must work comfortably on real phones as well as desktop.
8. **The repository and specification files are the persistent product memory.** Implementation agents must not rely on chat history as the sole source of truth.

## 4. User Roles

### Owner / Super Owner
Cross-organization administrative authority. Can manage organizations, access organization-level data according to policy, and access consolidated operational/financial information where permitted.

### Staff
Organization-scoped operational users. Access is limited to assigned organization(s) and role permissions.

### Agent
Restricted operational role. Access is limited to explicitly assigned leads and permitted actions.

### Future roles
Any new role requires an explicit requirements and security review before implementation.

## 4A. Authentication and Account Provisioning Policy

HunarOS has **no public self-registration** for internal users. Authentication and authorization are separate concerns.

### Bootstrap identity

The initial permanent Super Owner identity is provisioned as:

```text
navttcinstitutes@gmail.com
```

The Super Owner is already authorized as `SUPER_OWNER` and may sign in without an invitation flow. The email address is the bootstrap reference; the Firebase UID is the durable authenticated identity.

### Authorized account creation

Only an already-authorized `SUPER_OWNER`, `SUPER_ADMIN`, `ADMIN`, or `COORDINATOR` who has the explicit `create_staff` permission may create a Staff account. No unauthenticated user may create an internal account.

A Staff creation record requires:

- name — required;
- email — required;
- initial PIN — required;
- contact number — optional;
- CNIC — optional;
- organization assignment — required according to the creator's authority;
- role — Staff for this workflow;
- account status — initially Pending or Active according to the approved onboarding flow.

The initial PIN is a credential secret and must never be stored as plaintext in Firestore. Staff may change their PIN after authorization.

### Supported sign-in methods

Internal users may authenticate through:

1. email + PIN;
2. Google sign-in, only when the authenticated Google/Firebase identity is already authorized for HunarOS.

Successful Google authentication is **not** equivalent to HunarOS authorization. An authenticated Google account without an authorized HunarOS membership must receive an `UNAUTHORIZED` result and must not receive private application data.

### Account status

Authentication state and HunarOS account status are separate. At minimum, accounts support:

```text
PENDING
ACTIVE
SUSPENDED
DISABLED
```

A suspended or disabled HunarOS account must be denied application access even when Firebase Authentication succeeds.

### V1 student account policy

Students are business records, not internal application users, unless a later approved requirement explicitly introduces student-facing authentication.

### Authorization enforcement

Authorization is derived from the authenticated Firebase UID and trusted membership/permission data. Client-supplied role, organization ID, permissions, or authorization flags are never trusted. Firebase Security Rules and trusted server-side logic remain the enforcement boundary.

## 5. Product Modules

### Module 1 - Lead-to-Enrollment

Target workflow:

Lead -> CNIC capture/deduplication -> NAVTTC eligibility check -> Enrolled -> NTS result -> Seat award -> Confirmation -> Capacity-locked seat selection -> Awarded / Next-Cycle

Requirements carried forward:

- Leads may exist with name, phone and email before CNIC capture.
- CNIC is captured as structured identity data in addition to document images when available.
- Person deduplication must protect against duplicate identity creation.
- NAVTTC eligibility is a manual gate; the product must not automate portal login unless separately authorized.
- Enrollment statuses are controlled and tested.
- Seat capacity must be enforced.
- Overflow follows first-confirmed-first-selected.
- Underflow can be resolved through internal or external Transfer-In.
- External Transfer-In requires a tracked pending manual NAVTTC entry task.
- Passed-but-not-selected and failed candidates can feed a named Next-Cycle pool.

### Module 2 - Documents and Certificates

- Standard document checklist.
- Document lifecycle: Submitted -> Verified / Rejected.
- Certificate lifecycle must include receipt from NAVTTC where relevant before Ready-for-Collection.
- Collection must be auditable.
- Physical originals require custody-in and custody-out acknowledgement.

### Module 3 - Attendance

- Support biometric and manual-signature attendance sources.
- Reconcile both sources.
- Mismatches enter a review queue.
- Device user IDs must be mapped to a Person with effective dates.
- Generate monthly attendance sheets from live rosters.
- Support organization-specific holidays and session-aware batches.
- Attendance percentage is continuously computed and configurable per program.

### Module 4 - HR and Staff

- Staff identity, role, employment status and organization assignments.
- Overlap warning for conflicting assignments.
- Staff attendance.
- Payroll bridge into finance as a draft requiring human sign-off.
- CV / hiring pool with persistent statuses.

### Module 5 - Finance and Stipends

- Organization-scoped ledger.
- Income/expense transactions.
- No hard delete of financial transactions.
- Corrections through reversing/adjustment entries.
- Stipends tied to Person and relevant program/course context.
- Owner consolidated view; staff organization-scoped visibility.

### Module 6 - Agent and Commission

- Agent sees only explicitly assigned leads.
- Forward-only permitted status updates according to business rules.
- Proof required for designated commission-trigger actions.
- Configurable commission rates.
- Non-overlapping lead routing rules.
- Auditable commission events.

### Module 7 - Communications

- Email, WhatsApp and SMS abstractions behind a messaging interface.
- Initial WhatsApp implementation may use deep links; paid API support is an upgrade path.
- Provider replacement must not require rewriting business workflows.

### Module 8 - Notifications

- Persistent notifications.
- Background failures, attendance mismatches, sync tasks and risk flags must be visible and retained historically.

### Module 9 - Service Contacts

Searchable lightweight directory for vendors/service providers.

### Phase 2 - Public Organization Website

Per-organization public site with published programs linked to live data, validated lead capture, editable content blocks, and isolated public access.

## 6. Cross-Cutting Business Requirements

### Identity

- One Person record per global identity.
- CNIC uniqueness where present.
- No silent merges.
- Potential duplicates must be surfaced for review.

### Organization Isolation

- Security must be enforced in Firebase security controls and server-side authorization.
- UI filtering is never considered sufficient security.
- Cross-organization access must have automated tests.

### Auditability

Material events must record actor, action, target entity, timestamp and contextual metadata. Audit history should be append-only from the application perspective.

### File Handling

Sensitive files include CNIC images, certificates, CVs, proof screenshots and other operational attachments. Upload validation, access control, retention and signed/authorized retrieval are required.

## 7. Non-Functional Requirements

- Production-grade reliability and maintainability.
- Mobile-first PWA experience.
- Strong authorization boundaries.
- Automated testing at unit, integration and E2E layers.
- Structured errors and observability.
- Async/background processing for heavy jobs.
- Environment separation for development, staging and production.
- Safe migrations/data evolution.
- Backup and restore strategy.

## 8. Acceptance Criteria for Every Module

A module is not complete merely because the UI works.

Completion requires:

- documented requirements;
- domain/application behavior implemented;
- authorization enforced;
- persistence rules enforced;
- validation and error handling;
- automated tests;
- mobile UX;
- accessibility baseline;
- auditability where required;
- build/type/lint/test gates passing;
- documentation updated;
- code review completed.

## 9. Open Product Decisions

These items must be finalized before implementation where they affect architecture:

- Exact Firebase authentication methods and account-provisioning policy. (Resolved in v2.1: no public registration; email + PIN and authorized Google sign-in; Super Owner bootstrap identity; privileged Staff provisioning.)
- Exact Firestore collection/subcollection model.
- Whether any data needs a secondary relational/analytics store.
- Exact backup/restore and retention policy.
- Final SMS provider.
- WhatsApp Business API timing.
- Exact commission rates.
- Exact per-organization holiday calendars.
- Attendance threshold by program.
- New features requested after this document.
- HubSpot design reference source file for final visual/interaction mapping; until supplied, UI/UX requirements in HUNAROS_UI_UX_V2.md remain the controlling baseline.

## 10. Change Management

New requirements must first enter this PRD (or a linked feature specification), then be analyzed for data, security, UX and testing impact before implementation.

No feature should be accepted only because an AI coding agent produced working UI.
