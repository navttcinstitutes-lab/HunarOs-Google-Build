# HUNAROS — PERMANENT PRODUCT CONTEXT & BRANDING RULES

## 1. What HunarOS Is

**HunarOS is an independent, production-level Enterprise SaaS product.**

HunarOS is designed for organizations operating within the **NAVTTC ecosystem**, particularly organizations/institutes registered with NAVTTC.

NAVTTC is the target ecosystem and domain context for HunarOS.

**HunarOS itself is NOT a NAVTTC product.**

HunarOS must maintain its own independent product identity, architecture, branding, UX, and commercial direction.

---

## 2. Product Owner

**Syed Umair Ahmed is the owner of the HunarOS product.**

The product is being developed under his ownership with the long-term intention of offering HunarOS as a commercial SaaS platform to multiple organizations.

The initial Super Owner / administrative account may be configured according to the approved authentication requirements, but no individual email address or organization must become a permanent architectural dependency.

---

## 3. Initial Development vs Long-Term Product

There are two different stages of HunarOS:

### Early Stage
In the early development and implementation phases, HunarOS may primarily be used by the owner and his own organization/institute operations.
This is the **initial customer/use case**, not the final product limitation.

### Future Stage
In the completed product, HunarOS is intended to become a **commercial enterprise SaaS platform** that can be offered to multiple NAVTTC-registered organizations.
Organizations will be able to subscribe to HunarOS and receive access to the platform according to their subscription and enabled modules/features.

Therefore:
> **Build for the future product, even when implementing the current owner's requirements.**

Do not sacrifice enterprise architecture simply because the first deployment has only one organization.

---

## 4. SaaS Business Model

HunarOS will ultimately operate using a **subscription-based SaaS model**.

Potential commercial models may include:
* Organization-based subscriptions
* Monthly subscriptions
* Annual subscriptions
* Module-based subscriptions
* Feature-based entitlements
* Different plans based on organization size or requirements
* Additional paid modules/services

The exact pricing and commercial plans should only be implemented when defined in the approved product requirements.

However, the architecture must be capable of supporting subscription and entitlement management in the future.

Do NOT hard-code the assumption that every organization has access to every feature forever.

---

## 5. Multi-Tenant Product

HunarOS must be architected as a **true multi-tenant enterprise SaaS platform**.

The system must eventually support:

**HunarOS Platform**
→ Organizations
→ Institutes / Branches
→ Programs / Departments
→ Courses
→ Batches
→ Students / Candidates
→ Staff / Users

The exact domain hierarchy must follow the approved PRD/TRD/domain documentation.

Every organization must have strong logical and database-level isolation.

One customer must never be able to access another customer's:
* Users
* Candidates
* Students
* Courses
* Batches
* Attendance
* Finance
* Communications
* Documents
* Reports
* Integrations
* Audit records
* Settings
* Other tenant-specific data

Tenant isolation must never depend only on frontend filtering.

---

## 6. NAVTTC Positioning

NAVTTC-specific functionality is important because NAVTTC organizations are the intended customer ecosystem.

HunarOS may therefore contain functionality such as:
* NAVTTC programs
* NAVTTC reporting
* NAVTTC-related workflows
* NAVTTC compliance requirements
* NAVTTC integrations
* NAVTTC-specific operational fields
* Other approved NAVTTC processes

But these are **domain capabilities**, not HunarOS branding.

Never present HunarOS as:
* “NAVTTC HunarOS”
* “NAVTTC's HunarOS”
* “Official NAVTTC HunarOS”
* A NAVTTC-owned software product

unless an explicitly approved requirement later requires organization-specific contextual wording.

The global product identity remains:
**HunarOS — Independent Enterprise Operating System for Training & Skills Organizations**

---

## 7. Production-Level Requirement

This is one of the most important principles of the entire project:

### HunarOS is NOT a prototype.

Do not build temporary/dummy architecture simply because the feature is being developed in an early phase.

Do not intentionally create:
* Fake production flows
* Mock authentication where real authentication is required
* Mock security
* Fake database behavior
* Hard-coded business data
* Hard-coded customer assumptions
* Placeholder authorization logic
* Insecure shortcuts
* “We'll fix it later” security architecture
* Frontend-only tenant isolation
* Prototype-only data models
* Disposable architecture

If something cannot yet be fully implemented because a dependency is unavailable, clearly identify it as a limitation rather than silently replacing it with a fake production implementation.

---

## 8. Enterprise Engineering Standard

Every implementation should be evaluated as if HunarOS will eventually serve **many independent paying organizations**.

Prioritize:
* Security
* Tenant isolation
* RBAC
* Data integrity
* Auditability
* Scalability
* Maintainability
* Reliability
* Error handling
* Validation
* Observability
* Performance
* Accessibility
* Production UX
* Automated testing
* Upgradeability
* Backward compatibility where appropriate
* Safe migrations
* Clear domain boundaries

Do not optimize architecture solely for the current small deployment.

---

## 9. Subscription-Ready Architecture

Even if subscription billing is not being implemented in the current phase, avoid architecture that makes future subscription control difficult.

The system should determine:
**Organization → Subscription → Plan → Entitlements → Enabled Modules/Features**

The architectural principle is:
> HunarOS must be capable of evolving into a modular subscription SaaS product without requiring a fundamental rewrite.

---

## 10. Customer-Specific Configuration

Customer-specific information must be configuration/data, not hard-coded application logic.

Future organizations may have different:
* Names, Logos, Institutes, Branches, Staff, Roles, Courses, Programs, Operational rules, Branding, Integrations, Subscription plans, Enabled modules.

The HunarOS product identity remains consistent while customer-specific configuration remains tenant-specific.

---

## 11. Owner Account vs Customer Accounts

The platform owner and customers are different concepts:
* **Platform Owner (Syed Umair Ahmed)**: Owns and operates the HunarOS SaaS platform.
* **Customer Organization**: Purchases/subscribes to HunarOS.
* **Organization Users**: Staff/users operating the customer's HunarOS environment.

Do not collapse these concepts into one permanent organization.

---

## 12. Development Decision Rule

Whenever implementing a feature, ask:
> “Would this implementation still be appropriate if HunarOS had 100 or 1,000 independent customer organizations?”
> “Would this implementation allow HunarOS to introduce subscription-based modules later without rebuilding the entire system?”

---

## 13. Source of Truth

The approved HunarOS project documentation remains the source of truth for actual functional requirements.
This product context defines the **strategic direction and permanent principles** of the product.
Do not invent features merely because the long-term SaaS vision makes them possible.

---

## 14. Permanent Principle

> **HunarOS is being built as a real enterprise SaaS product from day one, even if its initial deployment is primarily for the owner's own operations.**
> **Build the product, not just the current deployment.**
> **Build production-grade, not prototype-grade.**
> **Build multi-tenant, not single-customer.**
> **Build subscription-ready, not permanently free/unrestricted.**
> **Build HunarOS as an independent product, not as a NAVTTC-branded product.**
