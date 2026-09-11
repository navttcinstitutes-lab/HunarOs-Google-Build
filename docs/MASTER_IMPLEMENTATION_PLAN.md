# HunarOS v2.1 - Master Implementation Plan & Foundation Architecture

**Status:** Awaiting Lead Architect / Product Owner Approval  
**Environment:** Google AI Studio + Firebase Architecture  
**Bootstrap Super Owner:** `navttcinstitutes@gmail.com`  

---

## 1. Product Understanding

HunarOS is an enterprise-grade, multi-tenant institute management operating system designed for vocational training institutions, technical institutes, and NAVTTC-affiliated (National Vocational and Technical Training Commission) training programs in Pakistan.

### Core Problems Solved
- Eliminating conflicting/duplicate student and lead records across decentralized spreadsheets.
- Establishing an immutable global Person identity keyed by CNIC (Computerized National Identity Card), while gracefully accommodating pre-CNIC leads.
- Enforcing hard organization and institute isolation boundaries.
- Automating the complex NAVTTC vocational lifecycle: lead generation, eligibility gates, batch seat allocation with capacity locks, biometric and manual attendance reconciliation, document verification, and physical certificate custody tracking with receipts.
- Providing an auditable, append-only financial ledger for organization-level cash flow, fee collection, and student stipends.
- Empowering external agents with strictly scoped, forward-only lead access.
- Delivering a Swiss-minimal, high-density, mobile-first operational interface.

---

## 2. Complete Module Map

| Module ID | Module Name | Primary Responsibilities & Functional Scope |
| :--- | :--- | :--- |
| **MOD-00** | **Core Foundation & Identity** | Global `Person` registry, CNIC uniqueness reservation, Org multi-tenancy, Auth gate, RBAC & permissions, Audit logging engine. |
| **MOD-01** | **Lead-to-Enrollment Pipeline** | Lead capture, deduplication, manual NAVTTC eligibility verification, enrollment state machine, NTS exam results, atomic seat awards, capacity-locked overflow/underflow handling, Next-Cycle pool. |
| **MOD-02** | **Documents & Physical Custody** | Mandatory document intake checklists, verification/rejection workflows, NAVTTC certificate receipt logging, physical custody-in / custody-out receipts with signature/acknowledgement tracking. |
| **MOD-03** | **Biometric & Attendance Engine** | Dual-source intake (biometric device import + manual roll-call signatures), reconciliation engine, mismatch review queue, biometric device ID to Person mapping with effective date ranges, monthly attendance roster generation, continuous percentage computation. |
| **MOD-04** | **HR & Staff Management** | Staff profiles, role assignments, multi-org assignment conflict/overlap detection, staff attendance, draft payroll calculation bridge requiring human sign-off, CV/hiring pool pipeline. |
| **MOD-05** | **Finance, Stipends & Ledgers** | Double-entry / append-only ledger for income & expenses, strict reversal/adjustment entries (no hard deletes), student stipend distribution tracking, organization-scoped staff view vs. Owner consolidated multi-org view. |
| **MOD-06** | **Agent & Commission Management** | Strictly scoped agent portal (agents only see explicitly assigned leads), forward-only status updates, proof attachment requirements for commission milestones, non-overlapping routing rules, auditable commission payouts. |
| **MOD-07** | **Communications & Messaging Adapter** | Notification and messaging abstraction layer supporting Email, SMS, and WhatsApp (initial deep-link / web intents, upgradeable to Cloud API), templating engine, delivery logging. |
| **MOD-08** | **Persistent Operational Notifications** | Persistent system notifications for background sync failures, attendance discrepancies, pending NAVTTC portal tasks, capacity alerts, security events. |
| **MOD-09** | **Service Contacts Directory** | Lightweight, categorized directory for vendor, equipment, utility, and maintenance service providers. |
| **MOD-10** | **Public Org Portal (Phase 2)** | Per-organization public-facing microsite featuring published programs, live batch offerings, and direct lead capture with server validation. |

---

## 3. Recommended Implementation Phases

```text
Phase 1: Production Foundation (Auth, Multi-Org RBAC, Security Rules, UI Design System Primitives)
    │
Phase 2: Global Identity, Organization Hierarchy & Lead-to-Enrollment State Machine
    │
Phase 3: Document Verification & Certificate Custody Lifecycle
    │
Phase 4: Dual-Source Attendance & Biometric Reconciliation Engine
    │
Phase 5: Financial Ledger, Reversals & Student Stipends
    │
Phase 6: HR Operations, Assignment Conflict Detector & Payroll Bridge
    │
Phase 7: Scoped Agent Portal & Commission Engine
    │
Phase 8: Unified Communications, Operational Notifications & Directory
    │
Phase 9: End-to-End Verification, Performance Hardening & Production Handover
```

---

## 4. Phase-by-Phase Breakdown

### Phase 1: Production Foundation & Security Baseline
- **Scope:** 
  - Firebase Authentication integration supporting Email + PIN and Google OAuth.
  - HunarOS authorization gate: Authenticated-but-unauthorized Google accounts receive an explicit access-denied state with zero data exposure.
  - Zero public registration policy; programmatic bootstrap of Super Owner `navttcinstitutes@gmail.com`.
  - Authorized Staff creation service (permission-gated `create_staff` with hashed/encrypted initial PIN storage).
  - Multi-tenant Organization context resolver & switcher for multi-org staff/owners.
  - Audit logging service (append-only events).
  - Swiss-Minimal Design System primitives: buttons, inputs, modal dialogs, status badges, data tables, layout shells (Lucide icons, responsive sidebar/drawer, no emojis as UI buttons).
- **Acceptance Criteria:**
  - Super Owner logs in and sees administrative controls.
  - Unauthorized Google login gets 403 Forbidden state with no leakage.
  - Staff created with temporary PIN can sign in; PIN is not stored in plaintext.
  - All security rules enforce default-deny.

### Phase 2: Academic Hierarchy & Lead-to-Enrollment Workflow
- **Scope:**
  - Programs, Courses, and Batches scoped to Organizations.
  - Global `Person` registry with atomic CNIC uniqueness lock (`/cnic_reservations/{cnic}`).
  - Lead capture (pre-CNIC support with deduplication heuristics).
  - Enrollment state machine (lead -> eligibility_checked -> enrolled -> tested_pass/fail -> seat_awarded -> confirmed -> awarded / next_cycle).
  - Atomic Firestore transaction for seat allocation against batch max capacity (preventing race conditions).
- **Acceptance Criteria:**
  - Duplicate CNIC intake is blocked across organizations.
  - Concurrent seat claims cannot exceed batch limit.
  - State machine rejects illegal transitions.

### Phase 3: Documents & Certificate Custody
- **Scope:**
  - Document checklist per program/course.
  - Document upload, MIME validation, file size enforcement.
  - Verification & rejection workflow with staff audit stamps.
  - NAVTTC Certificate tracking (Pending -> Received from NAVTTC -> Ready for Collection -> Collected).
  - Physical custody transfer with printable/digital signed receipts.
- **Acceptance Criteria:**
  - Sensitive files restricted via Storage rules.
  - Certificate collection requires actor confirmation and generates immutable audit entry.

### Phase 4: Biometric & Attendance Reconciliation
- **Scope:**
  - Session calendars per batch with org-specific holiday awareness.
  - Biometric log parser/importer + manual roll-call interface.
  - Device User ID to Person mapping table with effective start/end dates.
  - Reconciliation algorithm flagging mismatches into a dedicated review queue.
  - Real-time attendance percentage computation.
- **Acceptance Criteria:**
  - Discrepancies between biometric and manual signatures generate review tasks.
  - Monthly attendance sheet generated accurately from live rosters.

### Phase 5: Organization Finance & Stipend Ledger
- **Scope:**
  - Organization-scoped double-entry / append-only ledger.
  - Financial entry categories: Tuition, Exam Fees, NAVTTC Grants, Expenses, Stipends.
  - Strict reversal/adjustment protocol (hard deletes forbidden).
  - Stipend disbursement linked to Person, attendance percentage threshold, and batch.
  - Consolidated Owner financial overview vs. org-isolated staff ledger.
- **Acceptance Criteria:**
  - No delete operations allowed on finance collections in security rules.
  - Reversals reference original transaction ID and maintain net ledger integrity.

### Phase 6: HR, Staff Allocation & Payroll
- **Scope:**
  - Staff profiles, contracts, qualifications, and role assignments.
  - Multi-org assignment conflict detector (flags overlapping teaching schedules).
  - Staff attendance tracking.
  - Draft payroll generation requiring explicit human sign-off before bridge to finance.
  - CV / candidate hiring pool.

### Phase 7: Agent Portal & Commissions
- **Scope:**
  - Scoped agent interface (agent only queries and mutates leads where `agentId == request.auth.uid`).
  - Forward-only permitted status updates.
  - Proof attachment upload for milestone actions (e.g., fee payment, physical arrival).
  - Commission ledger and payout reconciliation.

### Phase 8: Communications, Notifications & Directory
- **Scope:**
  - Pluggable messaging adapter: Email, SMS, WhatsApp deep-link generation.
  - Persistent operational notification hub.
  - Vendor and service contact directory.

---

## 5. Security & Isolation Architecture

1. **Defense-in-Depth:**
   - **Layer 1: Network & Auth Gate:** Firebase Auth token validation. Check for active HunarOS membership before serving any operational payload.
   - **Layer 2: Firestore Security Rules:** Zero-trust ABAC rules. Every sub-collection checks organization membership. Default catch-all rule: `match /{document=**} { allow read, write: if false; }`.
   - **Layer 3: Query Enforcer:** Security rules mandate `resource.data.organizationId == request.auth.token.orgId` or explicit member lookup.
   - **Layer 4: Server-Side Transactions:** Critical invariants (CNIC reservations, seat capacity increments, financial reversals) execute inside atomic transactions.
2. **Account Status Enforcement:**
   - Evaluated on every access: `PENDING`, `ACTIVE`, `SUSPENDED`, `DISABLED`. Suspended/disabled accounts are cut off immediately.
3. **No Plaintext Secrets:**
   - PINs are salted and hashed (or managed through secure custom token/auth flows).

---

## 6. Database Architecture (Firestore Model)

```text
/users/{uid}                                    -> User profile, global role, status
/organizations/{orgId}                          -> Organization info, config, policies
/organizations/{orgId}/members/{uid}            -> Scoped membership, roles, permissions
/cnic_reservations/{cnic}                       -> Atomic CNIC uniqueness lock { personId, createdAt }
/persons/{personId}                             -> Global Person entity (canonical identity)
/organizations/{orgId}/programs/{programId}     -> Programs offered
/organizations/{orgId}/courses/{courseId}       -> Courses under programs
/organizations/{orgId}/batches/{batchId}        -> Batches, capacity, schedules, session calendar
/organizations/{orgId}/leads/{leadId}           -> Lead records (with optional agentId)
/organizations/{orgId}/enrollments/{enrollmentId}-> Student enrollment state machine
/organizations/{orgId}/documents/{docId}        -> Document metadata & verification status
/organizations/{orgId}/certificates/{certId}    -> Certificate lifecycle & custody receipts
/organizations/{orgId}/attendance_sessions/{id} -> Batch daily session attendance
/organizations/{orgId}/attendance_mismatches/{id}-> Review queue for biometric vs manual
/organizations/{orgId}/biometric_mappings/{id}  -> Device ID to Person mapping
/organizations/{orgId}/finance_transactions/{id}-> Append-only financial ledger
/organizations/{orgId}/stipends/{stipendId}     -> Student stipend disbursements
/organizations/{orgId}/staff/{staffId}          -> Staff profiles, employment details
/organizations/{orgId}/agent_commissions/{id}   -> Commission calculations & payout logs
/organizations/{orgId}/audit_logs/{logId}       -> Append-only audit logs
/notifications/{notificationId}                 -> User-specific persistent notifications
```

---

## 7. Testing Strategy

1. **Unit Testing:**
   - Enrollment state machine transitions (valid vs invalid paths).
   - Seat allocation boundary math (overflow/underflow).
   - Attendance percentage algorithms.
   - Ledger balancing and reversal calculations.
   - CNIC format validation and deduplication hashing.
2. **Integration Testing:**
   - Firestore Security Rules evaluation (simulating Super Owner, Admin, Staff, and Agent).
   - Cross-organization leakage tests (proving Org A cannot read Org B data).
   - Agent scope tests (proving Agent A cannot list unassigned leads).
   - Atomic transaction tests (simulating concurrent seat reservation).
3. **E2E Browser Testing:**
   - Complete authentication flow (Google sign-in gate, PIN sign-in).
   - Staff creation by authorized administrator.
   - Lead entry -> CNIC capture -> Seat Award -> Document Verification -> Certificate Collection.

---

## 8. Critical Dependencies & Major Risks

| Risk / Dependency | Impact | Mitigation Strategy |
| :--- | :--- | :--- |
| **Firestore NoSQL vs. Financial Immutability** | Accidental edit/delete of financial records. | Strict Firestore security rules denying `update` and `delete` on `finance_transactions`. Reversals must be new entries. |
| **CNIC Race Conditions** | Duplicate student records created concurrently. | Uniqueness reservation collection `/cnic_reservations/{cnic}` using atomic transactions. |
| **Seat Capacity Oversubscription** | More students awarded than physical lab capacity. | Transactional atomic increment with precondition check (`enrolledCount < maxCapacity`). |
| **Agent Data Leakage** | Agents viewing competitors' or general leads. | ABAC security rules evaluating `resource.data.agentId == request.auth.uid` on list queries. |
| **Biometric Sync Quality** | Low-quality imports breaking attendance. | Normalization layer with date-effective mapping table and human review queue. |
| **HubSpot Design Reference Pending** | Divergence in design tokens. | Established strict Swiss-Minimal baseline following `HUNAROS_UI_UX_V2.md`; will integrate specific patterns once `design.md` is provided without rework. |

---

## 9. Immediate Recommendation: What to Build First

We recommend proceeding directly with **Phase 1: Production Foundation & Security Baseline**:
1. **Initialize Firebase & Authentication Infrastructure**:
   - Provision Firebase Web and Firestore via the platform skill.
   - Implement the Authentication & Authorization gate:
     - Bootstrap Super Owner: `navttcinstitutes@gmail.com`.
     - Email + PIN login flow.
     - Authorized Google Sign-In flow (with strict gate rejecting unassigned accounts).
     - Staff provisioning module (`create_staff` with initial PIN credential handling).
2. **Setup Core RBAC & Multi-Tenant State Provider**:
   - Organization context resolver and switcher.
   - Role & permission definitions.
   - Default-deny Firestore security rules draft.
3. **Build the Swiss-Minimal Design System & Application Shell**:
   - High-density responsive operational shell with top context bar, org selector, and role badge.
   - Accessible UI primitives (Button, Input, Select, Badge, DataTable, Dialog, Notice).
   - Empty, loading, and error boundaries.
