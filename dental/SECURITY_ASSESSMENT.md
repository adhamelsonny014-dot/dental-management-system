# Web Application Security Assessment — Dental Management System

**Target:** Dental Management System (React SPA + Express/MongoDB API), local development build
**Scope:** Full source tree (`dental/client`, `dental/server`). Owner-authorized review of the author's own project.
**Method:** Source-based ("white-box") review mapped to the web-application pentest methodology. No live host was in scope (the app is unpublished and MongoDB is not deployed), so findings come from code analysis, not runtime exploitation.
**Date:** 2026-09-25

---

## Executive summary

The application uses a sound baseline: JWT auth with bcrypt password hashing, role-based route guards, a request-field allowlist on writes, `helmet`, CORS restricted to one origin, and rate limits on authentication and public forms. The high-impact web risks that typically dominate an assessment of this kind of app — broken access control, unauthenticated account creation, mass assignment, and committed secrets — were remediated during the preceding code-quality work and were re-verified as fixed here.

No **Critical** or **High** severity issues remain. Six **Low / Informational** hardening items are listed below. None permits privilege escalation or cross-tenant data theft on their own; they are defence-in-depth improvements.

| # | Finding | Severity | Status |
|---|---------|----------|--------|
| 1 | NoSQL operator injection in list filters | Low | **Fixed** |
| 2 | Regular-expression denial of service (ReDoS) in patient search | Low | **Fixed** |
| 3 | JWT verification does not pin the algorithm | Low / Info | Open |
| 4 | Weak password policy, no account lockout | Low | Open |
| 5 | JWT stored in `localStorage` (XSS-exposable) | Info | Open |
| 6 | Client print view uses `document.write(innerHTML)` | Info | Open |

Findings 1 and 2 were remediated after this review (see notes below); a request-input sanitizer now
strips `$`/dotted keys from body, query, and params, and the patient search term is regex-escaped and
length-capped. Both are covered by the test suite. Findings 3–6 are informational / future hardening.

---

## Findings

### 1. NoSQL operator injection in list filters — Low
**CVSS 3.1: 3.1 (AV:N/AC:H/PR:L/UI:N/S:U/C:L/I:N/A:N)**

List endpoints copy query-string values straight into the Mongo filter, e.g. `Controllers/appointment.js`:
```js
if (status) query.status = status;
```
Because Express's `qs` parser turns `?status[$ne]=x` into an object `{ $ne: "x" }`, an authenticated user can inject query operators (`$ne`, `$gt`, `$in`, `$regex`) into `status`, `patient`, `dentist`, `invoice`, `flow`, `channel`, and `role` filters.

**Impact:** limited to filter manipulation on lists the caller is already authorised to read (dentist scoping and role guards still apply on the sensitive collections), so it does not cross tenant boundaries. Worst realistic case is bypassing a status filter to list more of the caller's own records.

**Remediation (implemented):** `middleware/sanitize.js` strips any `$`-prefixed or dotted key from `req.body`/`req.query`/`req.params`, and object-valued query keys (which only arise from bracket-injection) are dropped. Regression-tested.

---

### 2. ReDoS in patient search — Low
**CVSS 3.1: 4.3 (AV:N/AC:L/PR:L/UI:N/S:U/C:N/I:N/A:L)**

`Controllers/patient.js` builds a case-insensitive regex directly from user input:
```js
{ firstName: { $regex: search, $options: "i" } }
```
The term is neither escaped nor anchored, so a crafted value (regex metacharacters, or a catastrophic-backtracking pattern) is evaluated by the database against every patient row. An authenticated staff user could degrade database responsiveness.

**Remediation (implemented):** the search term is now regex-escaped (`escapeRegex`) and capped at 100 characters in `Controllers/patient.js`.

---

### 3. JWT algorithm not pinned on verify — Low / Informational
**CVSS 3.1: 2.6 (AV:N/AC:H/PR:N/UI:R/S:U/C:L/I:N/A:N)**

`middleware/auth.js` calls `jwt.verify(token, secret)` with no `algorithms` option. `jsonwebtoken` v9 already blocks the classic `alg:none` downgrade, so exploitability is low, but pinning removes any ambiguity.

**Remediation:** `jwt.verify(token, secret, { algorithms: ["HS256"] })`, and pass the same in `sign`.

---

### 4. Weak password policy, no lockout — Low
**CVSS 3.1: 3.7 (AV:N/AC:H/PR:N/UI:N/S:U/C:L/I:N/A:N)**

Minimum password length is 6 (`Models/User.js`) with no complexity or breach check, and there is no per-account lockout. The login rate limit (20 / 15 min / IP) blunts online guessing but is IP-scoped.

**Remediation:** raise the minimum to 8–12, check against a common-password list, and add per-account failed-attempt throttling. Temporary staff passwords are already random (good).

---

### 5. JWT stored in `localStorage` — Informational

`client/src/utils/api.js` keeps the token in `localStorage`, which is readable by any JavaScript that runs on the page, so a future XSS would yield full session theft. React's default escaping and the current absence of `dangerouslySetInnerHTML` make XSS unlikely today; this is a note on the architecture, not an active bug.

**Remediation (if hardening further):** an `httpOnly`, `Secure`, `SameSite` cookie removes the token from script reach, at the cost of adding CSRF protection.

---

### 6. Print view uses `document.write(innerHTML)` — Informational

`components/TreatmentPlanReport.jsx` (and the invoice/prescription print views) open a window and write the React-rendered `innerHTML`. Because the values are already escaped as DOM text nodes before serialisation, and the window is same-origin and user-initiated, the practical risk is self-inflicted only. Noted for completeness.

**Remediation:** prefer the browser print stylesheet (`@media print`) over a written-out window, or sanitise before writing.

---

## Not applicable / tested clean

| Class | Result |
|-------|--------|
| SQL injection | N/A — MongoDB via Mongoose; no SQL. |
| NoSQL auth bypass (login) | Clean — `email` is a typed String path, so operator objects are cast/rejected; password is always verified with bcrypt. |
| Mass assignment | Clean — every create/update uses the `utils/fields.js` allowlist; server-managed fields (`patientNumber`, `receiptNumber`, `createdBy`, `role`) cannot be set by the client. Regression-tested. |
| Broken access control / IDOR | Clean — role guards on every write route; dentists are scoped to their own patients; verified by the test suite. |
| SSTI | N/A — no server-side template engine. |
| XXE | N/A — no XML parsing. |
| RCE / command injection | N/A — no `child_process`, `eval`, or shell use. |
| SSRF | N/A — the server makes no outbound requests from user-supplied URLs (SMTP host is operator-configured). |
| Open redirect | N/A — no redirect-by-parameter; client routing only. |
| Deserialization | N/A — JSON only, no `node-serialize`/pickle-style sinks. |
| GraphQL | N/A — REST API. |
| Stored XSS via email | Remediated — `utils/mailer.js` HTML-escapes message text. |
| Secrets in repo | Clean — `.env` files git-ignored; `.env.example` holds no real values; history rewritten. |
| Security headers | Present — `helmet` enabled. |
| Rate limiting | Present — login and the four public POST forms. |

---

## Attack-chain note

No chain reaches sensitive data. The highest-value path — inject a `$ne` filter (Finding 1) to widen a list — is stopped at the collection level by the role and dentist-scope guards, so it yields only the caller's own records. Findings 2–4 are availability / credential-strength concerns, not access-control breaks.

## Recommended priority

1. ~~Cast/validate query-string filters (Finding 1) and escape the search regex (Finding 2)~~ — **done**.
2. Pin the JWT algorithm (Finding 3) and strengthen the password policy (Finding 4).
3. Treat 5–6 as future hardening.
