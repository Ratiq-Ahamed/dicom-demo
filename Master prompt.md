# MASTER BUILD PROMPT — DICOM REPORTING SERVICES FRONTEND DEMO

## Your role and outcome
You are a principal product designer, UX architect and senior frontend engineer. Build a **polished, genuinely interactive, frontend-only demonstration** of a custom teleradiology operational platform for **DICOM Reporting Services**, created by **Myurrix**.

This is a **client presentation prototype**, intended to help the client see her actual business operating inside one connected system and to freeze the V1 scope. It must feel like a high-quality production SaaS application, but it must **not** pretend to have real backend integration, patient-data security, external storage, AI interpretation, email delivery or legal compliance.

**Do not create slides, a static marketing landing page, disconnected wireframes, or a collage of screenshots. BUILD THE ACTUAL CLICKABLE WEB APPLICATION.** The user must be able to switch between the three roles, perform a complete case journey and see consistent data change everywhere.

**Exactly three roles:**
1. SCAN CENTRE
2. ADMIN
3. DOCTOR / RADIOLOGIST

There must be **no fourth role** (no separate superadmin, trainer, accountant, reviewer or marketing portal). All management permissions in this prototype belong to Admin. Display only functionality the active role should have.

## Source material and source hierarchy — read before writing code
1. Review the attached **`DICOM_Myurrix_Proposal (1).pdf`**, particularly **pages 2–12** for the business flow and **all ten full-size UI reference screenshots** accompanying the prompt. The screenshots are design references, **not finished frontend assets to stretch across a page**.
2. Reuse DICOM Reporting Services’ genuine identity: the **blue-and-gold owl/caduceus emblem**, the **DICOM Reporting Services** name, deep navy and medical blue colours, and the restrained dental/CBCT imagery style shown in the reference material. If there is an actual supplied client logo image, use it unchanged. If only the mockup contains a logo, extract/use it as an explicitly replaceable demo asset rather than inventing an unrelated logo. Do not invent a new hospital brand.
3. Treat **recent client-meeting decisions in this prompt as overriding old commercial figures** in the PDF. The older PDF mentions 15 centres and conditional 3–7 day scan retention; current working assumptions are approximately 25 existing Indian centres, 18 included commercially, around 5–10 doctors, 45 cases/day currently, with potential growth. **Do not turn uncertain commercial assumptions into a binding in-app promise.** These values are illustrative demo configuration, not a quotation screen.
4. The **scan-file maximum retention is 7 days** and **final report PDF retention is 2 months** in the proposed workflow. Voice notes are temporary and removed at the agreed post-report stage; design this timing as configurable pending final scope freeze.
5. International centres are a potential **separately scoped/commercially quoted expansion**, not automatically included in the India deployment. Nevertheless, design centre onboarding with `country_code` and IANA `timezone` so the concept can demonstrate global readiness. A sample Bahrain centre may appear marked *illustrative international demo*; do not imply that international hosting/compliance is implemented.
6. The V1 concept is **secure file-upload/download and reporting workflow**, **not** a full PACS archive, advanced CBCT workstation, radiology AI, or a medical diagnostic viewer. DO NOT fake an OHIF/PACS viewer or present its tools as part of the included V1.

## Non-negotiable product vision
The client's current work is fragmented across WeTransfer, WhatsApp, Google Drive, occasional Nandico transfers, separate doctor training videos and manual coordination. The prototype must visually demonstrate their **one connected operating workflow**:

**Centre creates case → uploads prescription/scan + optional voice note → submits → Admin receives and assigns a doctor → Doctor reviews case/attachments and prepares a PDF externally → Doctor uploads report → Admin reviews, optionally returns for revision or uploads an updated version → Admin approves → Correct centre receives final report → Centre can request correction → Admin handles correction and redelivers → timestamps, audit history and performance indicators update throughout.**

Parallel operational path: **Admin invites doctor → doctor completes assigned training videos → admin can review training progress → optional training-completion requirement for active reporting access.**

This must not be three separate mocked products. Every action must change one shared dataset and be visible upon role switching.

## Visual design: high fidelity to the existing mockups
**Style:** LIGHT-mode enterprise medical SaaS. Deep navy vertical sidebar, white/light-blue workspace, blue CT/CBCT imagery, crisp tables, tasteful colour status badges, softly rounded cards, professional typography. This is NOT a dark app, and it is NOT a generic hospital template.

- Use the original references to reproduce the overall visual grammar, not every pixel or misleading sample value.
- Sidebar: very deep navy `#06162E` / `#071D3B`, fixed on desktop; DICOM owl brand at top; radiant but understated blue anatomical/CT illustration low in the sidebar; icon+label navigation; vivid blue active indicator. Sidebar visual identity is **consistent for all three roles**.
- Main area: near-white `#F6F9FE`, white cards, subtle slate-blue borders and soft shadows; navy headings `#132854`, saturated CTA blue around `#0869F7`, secondary pale-blue surfaces. Use green for success, amber for priority/warning, violet for awaiting review, red only for urgent/corrections, neutral grey for draft/inactive.
- Header: clear page title + helpful one-line subtitle, user name/role and centre identity, notification icon, current local date/time or relevant timezone indicator. No meaningless decorative controls.
- Use occasional branded, low-contrast dental X-ray/CBCT blue imagery header banners **where they add value**. Keep workflows and data above decoration. Do not rely on external copyrighted radiology images; use supplied permitted design assets or neutral illustrative artwork.
- Desktop 1440–1680px is the hero target; responsive at 1024/768 and mobile 390px. Admin mobile view should look like a thoughtful **PWA-style operational console**, with cards replacing wide tables and usable tap targets.
- Type hierarchy: strong but restrained titles, readable 13–15px table labels, consistent 14–16px body text, no tiny unreadable screenshots. Use a modern font such as Inter or Plus Jakarta Sans if available.
- Use Lucide icons and one consistent icon size/weight. Use Recharts (or comparable installed package) for genuine UI charts tied to state.
- Branding rule: the app itself is **DICOM Reporting Services**, not 'Myurrix ERP'. Allow a discreet footer: `Technology by Myurrix`.
- No unrelated themes, no gradients everywhere, no rainbow cards, no excessive marketing slogans, no emojis as the product's icon system.
- Professional motion: subtle hover, status transition, modal animations, upload progress, toasts and activity timeline. Disable/reduce motion for accessibility preference.

## Recommended implementation stack
- Next.js **App Router + TypeScript**, Tailwind CSS, polished component system (shadcn/ui/Radix if available), Lucide and Recharts.
- **Frontend only.** No FastAPI, PostgreSQL, Docker, real authentication provider, DigitalOcean integration, production file upload, real OTP email, API keys, paid services, server database or Next.js API backends are needed for the demo.
- Create typed domain models + deterministic seeded demo data, centralized store (Zustand/Context or similar) persisted in **browser localStorage using synthetic data only**; add a clearly identified `Reset demo` command. Actions must persist across refreshes and role switches.
- Maintain a single source of truth for cases, doctors, centres, report versions, notifications, voice notes, training watch-progress, audit events and timestamps. UI counters and charts should derive from the same state; do not hardcode conflicting metrics.
- Build clean, reusable, production-shaped components, routes and modules. Separate fixtures, domain logic, role permissions, UI components and pages. Add a README with `npm install`, `npm run dev`, demo walkthrough, project structure and what is intentionally simulated.
- If existing project/dependencies/assets exist, inspect and reuse them first. Do not delete a working project blindly. Finish the whole runnable app; don't stop at scaffolding.

## Demo entry, authentication and navigation
Create a handsome branded sign-in view with DICOM logo, blue medical image accent and three **demo persona choices**: `Scan Centre`, `Admin`, `Doctor`. Alternatively show one sign-in form and a discreet **Presenter / Demo role switcher** in the header. A user must be able to switch roles without re-entering information, but visibly label this **Demo role switching only**, never a production capability.

- Optionally simulate `Enter password → email OTP or authenticator step → dashboard`. Do not send an OTP or imply authentication is real.
- Seed default identities: `Velachery Scan Centre` staff, `DICOM Admin`, and `Dr. Priya Menon`. Other centre and doctor identities can be selected through demo persona controls.
- Accessible navigation: real routes, back button, consistent breadcrumbs on detail screens, no dead links. Show a toast/dialog when a mock action succeeds, with a chance to review the result.
- Enforce frontend **demonstration of visibility rules**, though label it as simulated—not genuine backend security. Centre sees its own case list; doctor sees only assigned/authorized work; admin sees all demo cases.

## Seed data and realistic domain rules
Seed around **25 centres**, **8 doctors**, several admins represented by 1 admin persona, and at least **30–40 cases of varied statuses** so dashboards don't appear empty. Use Indian centre names such as Velachery, Adyar, Anna Nagar, T Nagar etc. Include one visually labelled **Bahrain international example** if demonstrating multi-country timestamps, but mark it as a conceptual example beyond the India commercial package.

Use **entirely fictitious patient information**. Never use actual patient records from marketing brochures or screenshots. Seed realistic dental scan types and specialities: CBCT Full Mouth, CBCT Mandible, CBCT Maxilla, TMJ, Implant Planning, Endodontic Assessment, Impacted Tooth, OPG, Lateral Cephalogram. Don't turn these into diagnostic opinions.

Each case should hold:
- case ID (e.g., `DRS-2026-0145`), centre ID, patient pseudonym, patient reference ID, age or DOB, gender, referring doctor, modality/study, anatomy/region, clinical history, priority (Normal/Urgent/STAT), optional notes.
- `scan_taken_at`, `centre_submitted_at`, `admin_assigned_at`, `doctor_started_at`, `doctor_submitted_at`, `admin_approved_at`, `report_delivered_at` as appropriate; **store absolute timestamps in UTC**, render at the selected user's IANA timezone, and label timezone when useful.
- scan attachment mock, prescription mock, voice attachments, doctor assignment, report versions, correction requests, audit events.
- state machine: `DRAFT → SUBMITTED/UNASSIGNED → ASSIGNED → IN_PROGRESS → AWAITING_REVIEW → APPROVED/DELIVERED`, plus controlled branches for `REVISION_REQUESTED`, `CORRECTION_REQUESTED`, `CORRECTION_IN_PROGRESS`, `REDELIVERED`. A case should not jump straight from submitted to delivered.
- constraints: doctor can submit only an assigned case; admin can approve only a submitted report; centre can request correction only for delivered case; show helpful error if action is invalid.

**TAT definitions:**
- Centre upload delay = centre submission timestamp − scan taken timestamp.
- Assignment delay = admin assigned timestamp − centre submitted timestamp.
- Doctor TAT = doctor submitted timestamp − assigned timestamp (label clearly).
- Review time = approved timestamp − doctor submitted timestamp.
- **Total reporting TAT = final report delivered timestamp − centre submitted timestamp.**
- Avoid incorrect or negative time math. Use reproducible seed timestamps and derive aggregates correctly. Show mean/median doctor TAT and late-case count as appropriate.

Do not treat case counts or revenue figures on reference screenshots as actual client historical performance. Mock figures must be internally consistent and clearly demonstrative.

## SCAN CENTRE portal — make it feel complete
**Navigation**: Dashboard, New Case / New Report, My Cases, Corrections, Notifications, Profile. Only centre-specific pages.

### 1. Centre Dashboard
- Lovely header with `Welcome, [centre]`, today’s submissions, pending, in reporting, completed, correction requests, average turnaround; a status trend / daily cases small chart, latest cases table, alerts.
- Quick prominent `New Case` CTA.
- Case row links to actual case detail; filter Today/7 days/30 days and search by case ID or patient reference.
- Show local timestamps for centre; sample upload delay and submission status.

### 2. New Case / Scan Upload — primary showcase
Mirror the reference layout from proposal page 3: Patient Details panel, Scan Details panel, Prescription upload, Scan File upload, right-side step-by-step `Submission Guide` with completion indicators, plus optional `Clinical Voice Notes` module.
- Patient name/reference, age/DOB, gender, referring doctor, centre-locked identity.
- Scan type, region, history, priority, `Scan taken at` (required).
- Native file input plus drag/drop styling for prescription PDF/JPG/PNG; one main scan ZIP/DICOM bundle **with 300–800 MB displayed as expected operational range**, not a browser uploading hundreds of real files.
- Show fake but convincing upload progress on `Use sample scan` / selected local file, size, percentage, speed estimate, retry/pause/resume controls **clearly demo simulated**. A cancel and retry must actually change simulation state. No fake claim that file reaches Spaces.
- Optional simulated DICOM metadata detection chip: patient ID, study type, acquisition time, with `Illustrative metadata preview` label and manual correction ability. Don't claim real DICOM parsing.
- Voice panel: `Attach audio` (or demo recording if simple and supported), waveform/player UI, description, duration, file chip, remove button. Explicitly indicate private case-linked audio and temporary lifecycle. No real media is uploaded to a server.
- `Save Draft`, `Review & Submit`, validation, success confirmation with case ID. Submission must add a case to admin queue immediately.

### 3. My Cases and Case Detail
- Tabs/filter/search with statuses, uploaded/submitted dates, assigned progress (without disclosing unnecessary doctor private data), TAT, downloadable/mock attachment info.
- Detail page with patient/referrer/scan metadata, horizontal lifecycle timeline, attachment list, voice note, status timeline, report delivery section.
- Final approved PDF **preview simulation** using safe fictitious formatted report content or a locally supplied demo report. Provide a simulated Download Report action (clearly sample-only).
- Corrections: `Request Correction` opens modal with category and explanation; submit adds a correction to admin Corrections queue and changes case state. The centre can follow correction status/history. No direct case re-assignment authority.

## ADMIN portal — flagship operations console
**Navigation**: Dashboard, Case Queue, Assignments, Report Review, Corrections, Centres, Doctors, Training, Analytics / Reports, Notifications, Settings. Do not create a separate Admin type.

### 4. Admin Dashboard — flagship visual moment
Follow the original proposal page 5 and its high-resolution reference: navy sidebar, blue medical header, dashboard statistic cards, dense yet readable Case Queue, Doctor Status panel, Recent Activity, TAT overview, cases by modality, cases by centre.
- Counts and charts **derive from shared seed/state**. Make the page feel like a real busy business, not an empty admin template.
- Highlight unassigned/urgent/awaiting review/corrections and cases approaching deadline.
- Filters and quick actions work; clicking a card filters the case queue.

### 5. Case Queue & Doctor Assignment
- Search, tabs, priority, study, centre, status and date range filters; bulk select UI only if it performs a meaningful action.
- Clicking a submitted case opens a polished case detail drawer with centre, history, scan metadata, prescription, voice and exact timestamps.
- `Assign Case` shows doctor cards/table with availability, active workload, speciality, average TAT, recent case count and an intentionally non-clinical workload indicator.
- Admin selects doctor and confirms; **doctor receives that case in their work queue**, case state changes, timestamp/audit event and notification update.
- Support reassignment with reason (and audit event) if useful. Default assignment is admin-controlled; self-allocation is optional/disabled unless configured.

### 6. Admin Report Review — second flagship moment
- Full case header, patient/study context, annotated case timeline, doctor identity and submitted time.
- Embedded **mock PDF preview** with realistic multi-page layout/thumbnail navigation (sample, not actual patient report).
- Report versions `V1 doctor`, `V2 admin revision`, `Final` as appropriate. Never overwrite prior versions in demo state.
- Main actions: `Approve & Deliver`, `Return to Doctor with comment`, `Upload Corrected Version` (demo simulation), `View Versions`.
- Approval makes **final version visible only in the originating centre portal**, changes case to delivered, stamps time, creates notifications and audit record.
- If returned, doctor sees requested revision and can upload a new version.

### 7. Corrections Dashboard
- Separate urgent, new, in progress, waiting doctor and resolved queues; notification badges.
- Centre correction details with reason, requested timestamp, assigned doctor, linked prior approved report; admin can send to doctor, upload corrected file or close after redelivery.
- Status changes propagate back to the requesting centre. Every report revision remains available in internal history only for its allowed retention.

### 8. Centres Management
- Centres directory table/cards with centre name, city, country, timezone, status, user count, cases this month, avg TAT and last submission.
- `Add Centre` modal: name, contact, email, country code, city, **auto-suggested IANA timezone (with manual override for multi-timezone countries)**, active status.
- Show `Asia/Kolkata`, `Asia/Bahrain`, `Asia/Dubai`, `Europe/London`, `America/New_York` as sample timezone values when appropriate. Save dates in UTC.
- Centre pause/deactivate confirmation. Do not actually delete historical cases when centre becomes inactive.
- International feature is display/configuration demo only, not real multi-region storage or compliance clearance.

### 9. Doctors Management and Training Overview
- Doctor profile: speciality, assigned/in-progress/completed, average TAT, workload, training progress, availability.
- Add/invite doctor (mock), deactivate (mock), see cases and training, toggle `require training completion before live case assignment` as **configurable concept**.
- Training admin monitor: each doctor’s 10 module completions, unique watched minutes, latest training activity, pending modules.

### 10. Analytics and Performance
Mirror reference page 11: sophisticated KPI strip, doctor performance table, case volume trend, case mix, centre volumes, average/median doctor TAT, assignment delay, total TAT, overdue/priority distribution, correction trends.
- Interactive date/centre/doctor/scan-type filters; every KPI and chart updates from shared data.
- Tooltips explain exact metrics. Avoid presenting ranking as medical quality proof; if ranking exists, label `Operational Performance` and base it transparently on TAT, workload and corrections, not clinical skill.
- Export to CSV generated in-browser from mock demo data (working) if feasible.

### 11. Admin Mobile / PWA experience
- Mobile-first adaptations for dashboard, queue, urgent case, assignment and corrections.
- In-app activity notification centre with working read/unread and deep link to case.
- Make the shell installable as a PWA if straightforward, using a manifest and only cache static public assets. **Never persist mock 'patient' records in service worker caches**. Do not claim live push notifications work without a backend; showcase `Push notification preview (simulated)` where needed.

## DOCTOR / RADIOLOGIST portal
**Navigation**: My Dashboard, My Cases / Work Queue, Case Workspace (via case), Submitted Reports, Training, Notifications, Profile. Doctor must not see Admin controls or unrelated doctors' cases.

### 12. Doctor Dashboard and Work Queue
- My new assignments, due/urgent, in progress, awaiting review, returned for revision, recently submitted; priority sorting, case cards/table, TAT indicators, progress/activity.
- Click `Start Reporting` → case moves to In Progress, doctor started timestamp added, a visible activity event appears for Admin.
- Click case → workspace.

### 13. Doctor Case Workspace
- Strong detailed layout based on proposal page 8: case details, clinical history, prescription, source scan file (download/demo preview), optional centre voice note playback, audit/timeline panel, quality checklist, report upload area.
- A practical `Open/Download Scan` **simulates requesting controlled access**; it does not fake a DICOM workstation.
- Doctor enters own working note (not clinical AI-generated text), attaches a mock PDF, previews/replaces before submission, checks checklist, clicks `Submit for Admin Review`.
- The event updates Admin Review queue and the Centre's case timeline while keeping final report unavailable until Admin approves.
- On `Revision requested`, display Admin comments and make `Upload Updated Version / Resubmit` usable.

### 14. Doctor Training Portal — high-value differentiator
- Professional 10-video training curriculum; clear curriculum list, categories, durations, progress, resume, completion indicators, certificate readiness status (illustrative).
- Use realistic medical education titles aligned with the client's brochure, e.g. CBCT/DICOM Fundamentals; Radiographic Anatomy; Dental Arch and Landmarks; Implant Planning; Endodontic Assessment; Impacted Teeth; Pathology Red Flags; TMJ/Sinus Assessment; Dental Reporting Workflow; Case Quality & SOPs.
- A polished built-in lesson player experience. If authorised real sample videos are provided, play them as normal HTML5 video. Otherwise, use a **clearly labelled sample player/progress simulation**, not a broken empty video element. No real Vimeo or external service needed.
- Progress model: store unique watched intervals or conservative demo approximation and show `viewed minutes / total`, completion percent, last position, timestamps. Seeking to the end must not count as 100% watch time. A sample `Play demo training` action should visibly progress and update Admin Training overview.
- Admin may optionally configure completion requirement before the doctor can start live work, but default demo behaviour should not trap the entire case walkthrough.

## Shared cross-role scenarios — MUST WORK END TO END
Create a **presenter demo path** (optional subtle `Demo Guide` popover) with these exact interactions:

**Scenario A — New case lifecycle (most important)**
1. Select `Scan Centre: Velachery Scan Centre`.
2. Create new fictitious CBCT case; enter scan taken time; attach a sample prescription, sample 650 MB study (simulated upload), and a short voice note chip; submit.
3. Switch to Admin. New case appears automatically under Unassigned, and an in-app notification is generated. View the scan-to-submission delay.
4. Assign it to Dr. Priya Menon using live workload cards.
5. Switch to Doctor. The exact case is visible. Start reporting; listen to voice, inspect attachments; submit sample PDF.
6. Switch to Admin. Report appears under Awaiting Review; preview V1; approve and deliver.
7. Switch to Centre. Exact case now shows Delivered, report visible, overall TAT and timeline updated.
8. Request a correction from Centre; see it in Admin Corrections; route/resolve and show an immutable V2 entry and updated centre status.

**Scenario B — Training visibility**
1. Switch to Doctor, open training and advance a demo lesson to a meaningful watched percentage.
2. Switch to Admin, navigate to Training and see the same doctor/video progress, with no page reload hacks.

**Scenario C — Centre timezone**
1. Admin opens the centre manager, demonstrates selecting Bahrain and the `Asia/Bahrain` timezone as a conceptual international setup.
2. Show one timestamp rendered correctly in the chosen timezone vs Admin's IST time, with a UTC basis for TAT. Do not imply local Bahrain storage or regulatory compliance is implemented.

**Scenario D — Admin mobile**
1. Reduce viewport to phone width or use a built-in mobile preview.
2. Show the queue, urgent cases and working assignment/correction interactions.

## Security/privacy messaging — truthful prototype, strong product design
Visually reflect proposed controls: restricted cases, MFA login mock, per-role access, private-file badge, expiring access URL concept, access/activity audit, file lifecycle indicators, session indicators.

**Never state these protections are operationally proven in the frontend-only demo.** Show a small, professional `Prototype • simulated data / security flows` tag or an About Demo modal. No real patient information, no real presigned URLs, no real email, no legal compliance badges/certifications. Show a retention policy component stating **Scan: maximum 7 days** and **Report: 2 months**, and a `Deletion scheduled` demonstration; actual cloud deletion is a backend requirement for production.

Distinguish report retention and raw-study retention. Any voice note expiry is configurable pending scope confirmation. Be conservative about download revocation: an already downloaded local file cannot be deleted remotely.

## Feature boundaries — do NOT overpromise
**In prototype:** the three roles, shared working case flow, large-file upload simulation, voice-note attachment simulation, reporting/review/version history, corrections, training watch progress, operational analytics, country+timezone concept, notifications, admin mobile/PWA presentation.

**Not promised as V1:** full Nandico-equivalent PACS, OHIF/Orthanc, in-browser dental 3D CBCT planning, implant simulation, AI diagnosis, real AI summaries, real international data hosting, real payment/billing, live email OTP, live upload/streaming, actual cloud lifecycle deletion, WhatsApp Business API integration, or regulatory certification. If useful, show these only under `Future Possibilities` clearly segregated from included V1, or omit them entirely.

Don't surface quotation/fee calculators inside the operational product. This is for **functional scope discovery**, not invoicing the client. Keep all case/centre/doctor counts editable in fixtures and avoid hardcoding historical claims from screenshots.

## Technical quality / frontend behavior requirements
- Strong TypeScript types for Centre, User, Doctor, Case, Attachment, ReportVersion, Correction, TrainingModule, TrainingProgress, AuditEvent and Notification.
- Central state with derived views. No duplicate case arrays by role.
- Stable case IDs and reliable mutations, readable activity records, and timestamps.
- Reusable table/grid/card, case status/priority badge, date/time formatter, file chips, timeline, drawer/modal, upload mock, PDF mock preview, training progress, role switcher, toast, empty states.
- Forms validate required fields, dates, file type limits in simulated way, and show inline errors.
- Tables support real search/filter/sort/pagination if presented.
- Loading/success/error/empty states for key flows; responsive layout without horizontal overflow.
- Use sensible keyboard focus, labels, colour contrast, accessible modal behaviour.
- All active buttons and links must have meaningful click behavior. No `onClick={() => {}}`, no unimplemented links, no static `Lorem ipsum`, no generic placeholder icons in the final result.
- Avoid memory leaks/infinite timers for simulated upload/video playback. Handle cleanup and pause/resume. Use mock network latency sparingly.
- Use local static/synthetic assets only. Never embed or expose real clinical patient identifiers from brochures.
- No unsupported false status like 'cloud upload completed' or 'OTP emailed'. Label simulations plainly.

## Deliverable, workflow and completion criteria
1. Inspect the reference PDF and all attached screenshots/assets before coding; briefly document the extracted design tokens and workflow assumptions in README.
2. Set up the frontend app and shared typed mock store.
3. Build the branded shell and three roles, then critical cross-role case flow **before polishing secondary pages**.
4. Build centre, admin, doctor modules; complete training, analytics, corrections, report review and mobile admin adaptations.
5. Run the app, fix TypeScript/build/runtime problems, test at least the complete Scenario A, then B–D. Confirm state survives reload and role switching.
6. Add `Reset demo data`, make it obvious to the presenter, and ensure sample case creation can be repeated.
7. Deliver working source with exact local run commands and a compact demo script explaining where to click in a 5–8-minute client walkthrough.

**Definition of done:** The client can see her business identity, three distinct roles, one case passing through every handoff, doctor training progress, review and correction history, useful KPIs, and a professional mobile admin interface. If any of these are dead/incoherent, the prototype is NOT complete.

**Prioritization if time-constrained:** complete the end-to-end role-linked workflow with accurate design first. A polished, truthful, functioning 12-screen demo is better than 25 hollow screens.

## Final instruction
Build for a **real meeting with a serious dental teleradiology operator**. The client has seen generic PACS portals already. Impress her by letting her watch **her own people, her own process and her own operational decisions** working cohesively. Make it clear that Myurrix has understood the business deeply, not just copied a hospital dashboard. Start implementation now, and only ask clarifying questions if something truly prevents a runnable, compelling demo.
