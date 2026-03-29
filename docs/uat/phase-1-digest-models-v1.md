# Phase 1 — User Acceptance Testing (UAT)

**Document:** `phase-1-digest-models-v1.md`
**Version:** 2.0
**Phase:** Phase 1 — Digest Data Models, Admin CRUD, and API Routes
**Branch:** `feature/phase-1-digest-models`
**Date:** 2026-03-29

---

## Prerequisites

- Branch `feature/phase-1-digest-models` checked out
- `pnpm install` completed
- Database accessible (Railway Postgres)
- Run `pnpm dev` — app starts at `localhost:3000`
- Logged in as an admin user

---

## UAT-1.1: Database & Seed Data

| # | Test Step | Expected Result | Pass |
|---|-----------|-----------------|------|
| 1 | Run `pnpm dev` | App starts without errors at `localhost:3000` | [ ] |
| 2 | Log in as admin, open the sidebar | "Digests" nav item appears in the admin section of the sidebar | [ ] |
| 3 | Navigate to `/admin` → click "Seed Data" button | Toast confirms seeding completed with 6 digests | [ ] |
| 4 | Navigate to `/admin/digests` | Table shows 6 sample digests (#94–#99) | [ ] |

---

## UAT-1.2: Admin Digest List (`/admin/digests`)

| # | Test Step | Expected Result | Pass |
|---|-----------|-----------------|------|
| 1 | Page loads | Table displays 6 digests with columns: #, Title, Day, Status, Lee, Hanna, Publish Date, Actions | [ ] |
| 2 | Check status badges | Published (green) ×4, In Review (yellow) ×1, Draft (gray) ×1 | [ ] |
| 3 | Check day badges | Monday ×2, Wednesday ×2, Friday ×2 | [ ] |
| 4 | Stats cards | Show correct counts — Total: 6, Published: 4, In Review: 1, Draft: 1 | [ ] |
| 5 | Filter by status → select "Published" | Only 4 published digests displayed | [ ] |
| 6 | Filter by status → select "Draft" | Only 1 draft digest displayed (#99) | [ ] |
| 7 | Filter by day → select "Monday" | Only Monday digests displayed (#94, #97) | [ ] |
| 8 | Clear all filters | All 6 digests displayed again | [ ] |
| 9 | Click "Create Digest" button | Navigates to `/admin/digests/create` | [ ] |
| 10 | Click "Edit" on any digest row | Navigates to `/admin/digests/[id]` for that digest | [ ] |

---

## UAT-1.3: Create Digest (`/admin/digests/create`)

| # | Test Step | Expected Result | Pass |
|---|-----------|-----------------|------|
| 1 | Page loads | Form shows fields: Digest Number, Publish Day, Publish Date, Title | [ ] |
| 2 | Submit empty form | Validation prevents submission (required fields) | [ ] |
| 3 | Fill in: Number=100, Day=Monday, Date=2026-04-06 | Fields accept input correctly | [ ] |
| 4 | Click "Create" | Toast confirms creation, redirects to edit page for digest #100 | [ ] |
| 5 | Navigate back to `/admin/digests` | Digest #100 appears in the list with DRAFT status | [ ] |
| 6 | Try creating another digest with Number=100 | Error toast — digest number must be unique | [ ] |

---

## UAT-1.4: Edit Digest (`/admin/digests/[id]`)

Open a **published** digest (e.g., #94) for tests 1–6. Open the **draft** digest (#99 or #100) for tests 7–8.

| # | Test Step | Expected Result | Pass |
|---|-----------|-----------------|------|
| 1 | Page loads for digest #94 | Shows header "Digest #94 — Monday" with Published status badge | [ ] |
| 2 | All 5 section editors visible | Sections labeled: FBM Expert Tip, Marketing Tip of the Week, Community Spotlight, Funnel of the Week, Food for Thought | [ ] |
| 3 | Each section shows populated content | Heading, body, source URL, source title fields filled with seed data | [ ] |
| 4 | Edit Section 1 heading → click Save | Toast confirms save. Refresh page — change persists | [ ] |
| 5 | Edit Subject Line and Pre-Header → Save | Changes persist after refresh | [ ] |
| 6 | Lee/Hanna approval checkboxes | Both show as checked (read-only) for published digest #94 | [ ] |
| 7 | Open draft digest → check approval checkboxes | Both show unchecked (read-only) | [ ] |
| 8 | Add Lee's Personal Note → Save | Note persists after refresh | [ ] |
| 9 | Click "Preview" | Preview panel/modal shows rendered newsletter format with all sections | [ ] |

---

## UAT-1.4b: AI Content Generation (v2)

Open a **draft** digest (e.g., #99 or newly created #100) for these tests.

| # | Test Step | Expected Result | Pass |
|---|-----------|-----------------|------|
| 1 | Each section editor card | "Generate with AI" button visible in card header | [ ] |
| 2 | Click "Generate with AI" on Expert Tip section (empty) | Button shows spinner, after 3-10s heading and body fields populate with AI-generated content | [ ] |
| 3 | Review generated Expert Tip content | Content is a marketing/growth strategy tip in Lee's conversational voice, 2-3 short paragraphs | [ ] |
| 4 | Click "Generate with AI" on Food for Thought section | Generates a quote with attribution + Lee's connecting sentence | [ ] |
| 5 | Type a topic in Section 2 heading (e.g., "Notion AI") → click Generate | AI generates content specifically about the typed topic | [ ] |
| 6 | Click Generate while another section is generating | Button is disabled — only one generation at a time | [ ] |
| 7 | Save after generating | Generated content persists after refresh | [ ] |

---

## UAT-1.5: Digest API Routes

| # | Test Step | Expected Result | Pass |
|---|-----------|-----------------|------|
| 1 | `GET localhost:3000/api/digests` | Returns JSON array of published digests only (status=PUBLISHED) | [ ] |
| 2 | `GET localhost:3000/api/digests/latest` | Returns the single most recently published digest with sections | [ ] |
| 3 | `GET localhost:3000/api/digests/[id]` (use a valid digest ID) | Returns full digest object with sections array | [ ] |
| 4 | `GET localhost:3000/api/digests/[id]` with invalid ID | Returns 404 | [ ] |
| 5 | `GET localhost:3000/api/admin/digests` (logged out or non-admin) | Returns 401 Unauthorized | [ ] |
| 6 | `GET localhost:3000/api/admin/digests` (logged in as admin) | Returns all digests (all statuses) | [ ] |

---

## UAT-1.6: Delete Digest

| # | Test Step | Expected Result | Pass |
|---|-----------|-----------------|------|
| 1 | Open a draft digest (e.g., #100) edit page | Delete button visible | [ ] |
| 2 | Click Delete | Confirmation dialog appears | [ ] |
| 3 | Cancel the confirmation | Dialog closes, digest unchanged | [ ] |
| 4 | Click Delete → Confirm | Toast confirms deletion, redirects to `/admin/digests` | [ ] |
| 5 | Check digest list | Deleted digest no longer appears | [ ] |
| 6 | `GET /api/digests/[deleted-id]` | Returns 404 | [ ] |

---

## Sign-Off

| Role | Name | Date | Result |
|------|------|------|--------|
| Tester | | | Pass / Fail |
| Developer | | | Reviewed |

**Pass criteria:** All checkboxes above must pass before proceeding to Phase 2.

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-03-29 | Initial UAT for Phase 1 — Digest data models, admin CRUD, API routes |
| 2.0 | 2026-03-29 | Added UAT-1.4b: AI Content Generation tests. Fixed stats API, field name mismatches, duplicate-safe seeding |
