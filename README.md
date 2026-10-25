
# 🎓 AcademIQ

### CBT-style exam practice for UNILAG students

**A student portal and a super-admin panel on one Supabase backend.**

![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20Auth-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-Installable-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)

[**Live Site**](https://academiqapp.me) · [**Admin Panel**](https://admin.academiqapp.me)

</div>

---

## 🧠 What is AcademIQ?

AcademIQ lets university students practice past-question-style exams in a timed, CBT-like environment, get instant scores with explanations, and track how they are doing. Free users get a sample of questions in every course; premium users unlock everything with a token bought over WhatsApp.

Students can also enter **Study Mode**, where they read chapter summaries before taking a quiz specifically targeted at that chapter. 

Admins manage the whole question bank, write chapter summaries, generate and track premium tokens, and watch usage analytics from a separate panel.

This repository is a single repo with two independent projects that share one Supabase backend.

---

## 🏗️ Architecture

```text
                  +---------------------------------+
                  |        SUPABASE (backend)       |
                  |                                 |
                  |  - Postgres + Row Level Security|
                  |  - Auth (email + password)      |
                  |  - SQL functions (RPCs)         |
                  +----------------+----------------+
                                   |
            +----------------------+----------------------+
            |                                             |
            v                                             v
   +-----------------+                           +-----------------+
   |  academiq-web   |                           | academiq-admin  |
   |  Student portal |                           |  Super admin    |
   |  Vite + React   |                           |  Vite + React   |
   |  PWA / Vercel   |                           |  Vercel         |
   +-----------------+                           +-----------------+
```

**Security model:** the browser only ever holds the public anon key. Row Level Security protects every table, and everything sensitive (token redemption, attempt sync, all admin operations) runs inside `security definer` SQL functions that check the caller's role on the server. Hiding a page in the UI is never the protection.

---

## 📦 The Projects

### 🌐 academiq-web — Student Portal

The public app where students sign up, practice and track results. It is fully installable as a Progressive Web App (PWA) on iOS and Android.

**Stack:** Vite · React 19 · TypeScript · React Router 7 · TanStack Query · Zustand · Tailwind CSS · React Hook Form · Zod · Supabase

**Features**
- **Authentication:** email and password, with a 3-step signup and password reset by email
- **One-time ID upgrade:** students who register with a JAMB number can update to their Matric number once
- **Study Mode:** read chapter summaries and immediately take a quiz targeted at that specific chapter
- **Faculty-aware courses:** students see the courses targeted at their faculty
- **CBT simulation:** timed exams, question navigation, quick-nav pill bar, custom timer settings, and auto-submit
- **Results and review:** score, grade, time taken, breakdown bar, and a per-question review with explanations
- **Free sample and premium:** free users get the questions flagged as free; redeeming a token unlocks everything for 30 days
- **Public CGPA calculator:** free, 5-point scale, works without logging in, and saved in the browser
- **Dark mode & PWA support**

### 🛠️ academiq-admin — Super Admin Panel

The control center. Desktop-first, light theme.

**Stack:** Vite · React 19 · TypeScript · React Router 7 · TanStack Query · Recharts · Papa Parse · Tailwind CSS · Supabase

**Features**
- **Overview:** student, premium and token counts, revenue from redeemed tokens, a 30-day signups chart and a premium/free split
- **Courses and topics:** create, edit, hide and delete, with faculty targeting and live question counts
- **Study Mode Notes:** write and save chapter summaries (notes) for any topic
- **Question bank:** paginated browser, edit modal, free/paid flag and draft/published status
- **Bulk CSV upload:** row-level validation, duplicate detection and batched inserts (200 rows per batch)
- **Token engine:** generate batches of 1 to 100 tokens, see which are redeemed, copy or export as CSV
- **User management:** search and filter, grant, extend or revoke premium, edit usernames
- **Attempt analytics:** score distribution, pass rate and per-attempt drill-down
- **Safety:** non-admin accounts are signed out immediately, every admin function re-checks the role in SQL, and sessions end after 30 minutes of inactivity

---

## 🗄️ Backend

Supabase Postgres, with Row Level Security enabled on every table. Business logic lives in SQL functions rather than in the clients.

### Key functions

| Function | Purpose |
|---|---|
| `handle_new_user()` | Trigger: creates a profile from the signup metadata |
| `student_course_stats()` | Per-course question counts for the signed-in student |
| `get_questions_for_course()` | Published questions; free users only receive the ones flagged free |
| `submit_attempt()` | Idempotent attempt sync: re-scores on the server and stores the attempt and answers |
| `redeem_token()` | Atomic one-time redemption, extends premium by 30 days, rate-limited |
| `update_student_id()` | One-time JAMB to Matric upgrade. Validates format, refuses if already a Matric number |
| `generate_tokens()` | Unambiguous `ACAD-XXXX-XXXX` codes (run from the SQL editor, not callable by clients) |
| `admin_stats()`, `admin_list_users()`, `admin_list_tokens()`, `admin_generate_tokens()`, `admin_set_premium()`, `admin_list_attempts()` | Admin-only operations, each guarded by `is_admin()` |

### Main tables

| Table | Notes |
|---|---|
| `profiles` | Extends `auth.users`; role, faculty, department, year, premium expiry. Clients can only update safe columns, never `role` or `premium_expires_at` |
| `courses`, `topics` | Course code and name, active flag, faculty targeting. Topics include a `summary` column for Study Mode. |
| `questions` | Options, correct index, explanation, `is_free`, `status` (draft/published). Students read them only through the RPC |
| `tokens`, `token_attempts` | Premium codes with price and redemption tracking; failed attempts for rate limiting. No client access |
| `exam_attempts`, `exam_answers` | Attempt history with per-question detail |

> **Database setup:** the SQL lives in `supabase/`. Run the schema files in order.

---

## 🚀 Local Development

Each project is independent.

### Prerequisites
- Node.js 20+
- A Supabase project with the SQL from `supabase/` applied
- A `.env` file in each project (copy `.env.example`)

| Project | Variables |
|---|---|
| `academiq-web`, `academiq-admin` | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` |

> Only the public anon key belongs in these apps. **Never** put the service-role key in any client.

```bash
# Student portal
cd academiq-web && npm install && npm run dev      # http://localhost:5173

# Admin panel
cd academiq-admin && npm install && npm run dev    # http://localhost:5174
```

To create the first admin, sign up a user, then run in the SQL editor:

```sql
update profiles set role = 'super_admin' where id = '<user-uuid>';
```

---

## 🚢 Deployment

| Project | Platform | Notes |
|---|---|---|
| `academiq-web` | Vercel | Auto-deploys on push to `main`. `vercel.json` rewrites all routes to `index.html` for React Router |
| `academiq-admin` | Vercel | Same setup |

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in each Vercel project. In Supabase, set the Site URL and Redirect URLs to the production domain so password-reset links work.

---

## 🎨 Design Tokens (student portal)

| Token | Light | Dark |
|---|---|---|
| `bg-primary` | `#F8FAFC` | `#0A1628` |
| `bg-secondary` | `#FFFFFF` | `#0F1F3A` |
| `brand-primary` | `#1A5276` | `#2E86C1` |
| `brand-success` | `#16A34A` | `#2ECC71` |
| `brand-danger` | `#DC2626` | `#E74C3C` |

Components use semantic tokens (`text-primary`, `bg-border`, and so on), so palettes can change without touching components.

---

## ⚠️ Known Limitations

- Quiz progress is saved to `sessionStorage`, so refreshing the same tab resumes the attempt. Opening in a new tab starts fresh.
- Questions are delivered to the device with their correct answers. This is deliberate (instant review and offline scoring) and appropriate for practice, not proctored exams.

---

## 🧪 Release Checklist

- [ ] Sign up a new student and confirm faculty shows on the profile
- [ ] Redeem a token and confirm all questions unlock without a manual reload
- [ ] Complete a quiz and confirm the score matches the admin attempts view
- [ ] Enter Study Mode, read notes, and take a chapter-specific quiz
- [ ] Refresh any authenticated page: no 404 and no logout
- [ ] As a student, open `/overview` on the admin site and confirm it is refused
- [ ] Admin: bulk-upload 50 CSV rows and confirm the question count updates
- [ ] Admin: generate 10 tokens and confirm they appear in the token list

---

## 🛣️ Roadmap

- [x] Admin panel
- [x] Student web portal
- [x] Premium token system
- [x] Public CGPA calculator
- [x] Faculty-based course targeting
- [x] Bulk CSV question upload
- [x] Dark mode & PWA support
- [x] Persist quiz progress across refreshes
- [x] Study Mode (Chapter summaries + targeted quizzes)
- [ ] Offline quiz mode (Service Workers)
- [ ] Push notifications for new courses
- [ ] Leaderboards

---

## 👤 Author

**DemiGold**: [github.com/DemiGold](https://github.com/DemiGold)

---

## 📄 License

Proprietary. All rights reserved.
