# Web Application Security Assessment — Dental Management System

**Target:** Dental Management System (React SPA + Express/MongoDB API), local development build
**Scope:** Full source tree (`dental/client`, `dental/server`). Owner-authorized review of the author's own project.
**Method:** Source-based ("white-box") review mapped to the web-application pentest methodology. No live host was in scope (the app is unpublished and MongoDB is not deployed), so findings come from code analysis, not runtime exploitation.
**Date:** 2026-09-25

---

## Executive summary

The application uses a sound baseline: JWT auth with bcrypt password hashing, role-based route guards, a request-field allowlist on writes, `helmet`, CORS restricted to one origin, and rate limits on authentication and public forms. The high-impact web risks that typically dominate an assessment of this kind of app — broken access control, unauthenticated account creation, mass assignment, and committed secrets — were remediated during the preceding code-quality work and were re-verified as fixed here.

No **Critical** or **High** severity issues remain. Six **Low / Informational** hardening items were identified; all have since been remediated. None permitted privilege escalation or cross-tenant data theft on their own; the fixes are defence-in-depth improvements.

| # | Finding | Severity | Status |
|---|---------|----------|--------|
| 1 | NoSQL operator injection in list filters | Low | **Fixed** |
| 2 | Regular-expression denial of service (ReDoS) in patient search | Low | **Fixed** |
| 3 | JWT verification does not pin the algorithm | Low / Info | **Fixed** |
| 4 | Weak password policy | Low | **Fixed** |
| 5 | JWT stored in `localStorage` (XSS-exposable) | Info | **Fixed** |
| 6 | Client print view uses `document.write(innerHTML)` | Info | **Fixed** |

All six were remediated after the initial review (see per-finding notes below): a request-input
sanitizer strips `$`/dotted keys from body, query, and params; the patient search term is
regex-escaped and length-capped; the JWT is signed and verified with a pinned `HS256` algorithm; the
password policy requires at least 8 characters with a letter and a number; the session token is now
delivered in an `httpOnly` cookie instead of `localStorage`; and the treatment-plan print view builds
its document with DOM APIs rather than `document.write`. The access-control and input-validation fixes
are covered by the test suite (30 tests). A remaining defence-in-depth idea — per-account login lockout
— is noted under Finding 4 as future work.

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

### 3. JWT algorithm not pinned on verify — Low / Informational — **Fixed**
**CVSS 3.1: 2.6 (AV:N/AC:H/PR:N/UI:R/S:U/C:L/I:N/A:N)**

`middleware/auth.js` called `jwt.verify(token, secret)` with no `algorithms` option. `jsonwebtoken` v9 already blocks the classic `alg:none` downgrade, so exploitability was low, but pinning removes any ambiguity.

**Remediation (implemented):** verification now passes `{ algorithms: ["HS256"] }` in `middleware/auth.js`, and signing pins `{ algorithm: "HS256" }` in `Controllers/auth.js`.

---

### 4. Weak password policy — Low — **Fixed**
**CVSS 3.1: 3.7 (AV:N/AC:H/PR:N/UI:N/S:U/C:L/I:N/A:N)**

Minimum password length was 6 (`Models/User.js`) with no complexity check. The login rate limit (20 / 15 min / IP) blunts online guessing but is IP-scoped.

**Remediation (implemented):** a shared policy in `utils/password.js` now requires at least 8 characters including a letter and a number. It is enforced by the `User` schema validator (on a freshly set plaintext password), by the admin create/update-account handlers, and by the temporary-password generator used for seeded and staff logins, so every generated password is policy-compliant.

**Future work:** per-account failed-attempt lockout and a breached-password check would further harden credential security; the current IP-scoped rate limit is the baseline control.

---

### 5. JWT stored in `localStorage` — Informational — **Fixed**

`client/src/utils/api.js` previously kept the token in `localStorage`, which is readable by any JavaScript on the page, so a future XSS would yield full session theft.

**Remediation (implemented):** the server now issues the JWT in an `httpOnly`, `SameSite=Lax` cookie (`Secure` in production), so page scripts can no longer read the session token. The client sends the cookie automatically (`withCredentials`) and no longer stores or attaches a token; a new `POST /api/auth/logout` clears the cookie. `SameSite=Lax` plus the single-origin CORS policy mitigates CSRF for the state-changing routes. The Authorization-header path is retained for non-browser API clients and the test suite.

---

### 6. Print view uses `document.write(innerHTML)` — Informational — **Fixed**

`components/TreatmentPlanReport.jsx` opened a window and wrote the React-rendered `innerHTML`. Because the values were already escaped as DOM text nodes before serialisation, and the window is same-origin and user-initiated, the practical risk was self-inflicted only.

**Remediation (implemented):** `handlePrint` now builds the print document with DOM APIs — the title is set as a property, the stylesheet via `style.textContent`, and the report body is a deep `importNode` clone of the already-rendered nodes — so no markup is parsed from a string. The invoice and prescription print views already used a `window.print()` / print-stylesheet flow with no `document.write`.

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

No chain reached sensitive data. The highest-value path — inject a `$ne` filter (Finding 1) to widen a list — was stopped at the collection level by the role and dentist-scope guards, so it yielded only the caller's own records, and the filter injection itself is now blocked by the input sanitizer. Findings 2–6 are availability / credential-strength / defence-in-depth concerns, not access-control breaks.

## Recommended priority

1. ~~Cast/validate query-string filters (Finding 1) and escape the search regex (Finding 2)~~ — **done**.
2. ~~Pin the JWT algorithm (Finding 3) and strengthen the password policy (Finding 4)~~ — **done**.
3. ~~Move the session token out of `localStorage` (Finding 5) and remove the `document.write` print sink (Finding 6)~~ — **done**.
4. Remaining future work: per-account login lockout and a breached-password check (see Finding 4).
