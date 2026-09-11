# HunarOS v2 - Technical Requirements Document (TRD)

**Target build environment:** Google AI Studio
**Backend platform:** Firebase-centered
**Version:** 2.1
**Status:** Architecture baseline for implementation

## 1. Technical Goals

The technical architecture must support a long-lived enterprise application with multiple organizations, sensitive records, stateful workflows, files, background jobs, integrations and strong automated verification.

The system must be modular without becoming distributed unnecessarily. The default architecture is a well-structured application with clear domain, application, infrastructure and UI boundaries.

## 2. Target Technology Shape

### Application

- Modern React with Vite or Express/API layer as needed.
- TypeScript with strict checking.
- PWA-capable front end.

### Firebase Services

Use Firebase services according to responsibility rather than putting every concern into a single collection:

- **Firebase Authentication:** identity/session establishment.
- **Cloud Firestore:** operational application data requiring flexible document-oriented access.
- **Cloud Storage for Firebase:** sensitive files and attachments.
- **Cloud Functions / server-side execution:** privileged workflows, background processing and integration adapters.
- **Firebase App Hosting / Cloud Run:** application delivery.
- **Observability:** structured logging, audit trails and error reporting.

## 3. Architecture Layers

```text
UI / Presentation (React 19 + Tailwind + Lucide Icons)
      |
Application Services & State Hooks
      |
Domain / Business Rules & State Machines (Framework-Independent)
      |
Infrastructure Adapters (Firebase SDK, Firestore, Auth, Storage, Server APIs)
      |
Firebase Services (Firestore, Auth, Storage, Security Rules)
```

Rules:

- UI must not contain critical authorization logic.
- Domain logic must not depend directly on browser APIs.
- Domain code should remain as framework-independent as practical.
- Infrastructure adapters own external provider details.
- Modules communicate through defined interfaces/services rather than arbitrary table/collection access.

## 4. Identity and Authentication

Authentication is distinct from authorization.

Authentication establishes the Firebase user identity.

Authorization determines:

- user role;
- organization scope;
- feature permissions;
- assignment scope for restricted roles.

## 4A. Authentication and Authorization Technical Model

### Firebase Authentication

Primary supported methods for internal users:

- email + PIN credential flow;
- Google OAuth, subject to an existing authorized HunarOS identity.

There is no public self-registration endpoint.

### Identity records

At minimum, the trusted model must distinguish:

```text
Firebase Auth User (uid)
        ↓
HunarOS user profile (/users/{uid})
        ↓
Organization membership(s) (/memberships/{id} or /orgs/{orgId}/members/{uid})
        ↓
Role + permission set (SUPER_OWNER, SUPER_ADMIN, ADMIN, COORDINATOR, STAFF, AGENT)
        ↓
Authorization scope
```

### Bootstrap Super Owner

The pre-provisioned Super Owner is:

```text
navttcinstitutes@gmail.com
```

The bootstrap email may be used during provisioning, but application authorization must resolve from trusted UID/membership data rather than repeated email checks throughout the codebase.

### Staff provisioning

Only a trusted user with the effective `create_staff` permission may create a Staff account. Required onboarding inputs are name, email and initial PIN; contact number and CNIC are optional.

The initial PIN must not be persisted in plaintext. A credential-management flow must own the secret.

### Google authorization gate

For Google sign-in:

```text
Google authentication succeeds
        ↓
Firebase UID resolved
        ↓
HunarOS authorization record exists?
   ├── YES → continue
   └── NO  → deny access and expose no private data
```

### Account status

HunarOS account state must be evaluated independently of Firebase Auth: `PENDING`, `ACTIVE`, `SUSPENDED`, `DISABLED`.

## 5. Organization Isolation

Organization isolation is a critical security boundary.

Required layers:

1. Firebase Authentication identity.
2. Server-side authorization checks.
3. Firestore Security Rules for direct data access.
4. Server-side functions/API authorization for privileged operations.
5. Automated cross-organization tests.

Never trust:

- a client-supplied organization ID;
- a client-supplied role;
- a hidden navigation item;
- an unvalidated query filter.

## 6. Role Model

- **Owner / Super Owner:** Cross-organization authority subject to explicit security rules.
- **Staff:** Organization-scoped permissions.
- **Agent:** Assignment-scoped permissions.

The security design must specifically prevent a permissive organization-level rule from accidentally granting Agents broader access than intended.

## 7. Data Modeling Requirements

Collections design:
- `users`: Global user records, roles, statuses.
- `organizations`: Organization profiles, settings, policies.
- `memberships`: User-organization associations with specific roles and scoped permissions.
- `persons`: Global person records keyed by CNIC (or temp ID prior to CNIC capture).
- `programs`, `courses`, `batches`: Academic hierarchy scoped to organizations.
- `leads`: Prospective students; scoped to org or agent assignment.
- `enrollments`: Student journey and state machine instances.
- `documents` & `certificates`: Document checklist, verification status, custody records.
- `attendance_records` & `biometric_mappings`: Attendance entries, logs, reconciliations.
- `finance_transactions` & `stipends`: Append-only ledgers, adjustment references.
- `staff_profiles` & `assignments`: HR assignments, contracts, payroll drafts.
- `audit_logs`: Append-only audit records with actor, action, timestamp, metadata.
- `notifications`: Persistent operational notifications.

## 8. State Machines

Controlled transitions:
- **Enrollment**: lead -> eligibility_checked -> enrolled -> tested_pass/fail -> seat_awarded -> confirmation_pending/interested/not_interested/unreachable -> selected/next_cycle_eligible -> awarded
- **Certificate**: pending -> received_from_navttc -> ready_for_collection -> collected
- **Document**: submitted -> verified / rejected
- **Physical Custody**: in_custody -> returned_with_receipt

## 9. Data Integrity Strategy

Firestore invariants:
- **CNIC uniqueness**: Reservation collection `/cnic_reservations/{cnic}` ensures atomic single-ownership.
- **Seat capacity**: Firestore atomic transactions ensure capacity is never exceeded during concurrent claims.
- **Financial corrections**: Strictly append-only ledgers; corrections are represented as adjusting entries referencing original transaction IDs.

## 10. Audit System

Every material operation writes an audit log:
- `id`, `actorUid`, `organizationId`, `action`, `entityType`, `entityId`, `occurredAt`, `metadata`.
- Client cannot overwrite or delete audit entries.
- High-value operations emit audit logs in the same atomic batch/transaction.

## 11. Testing Architecture

- **Unit**: Pure domain logic (state machines, capacity rules, attendance calculations, finance math).
- **Integration**: Auth, Firestore rules, cross-organization isolation, agent scoping, capacity locks.
- **E2E**: Complete user workflows (auth gate, lead intake, enrollment transitions, certificate custody).
