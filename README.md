# DICOM Reporting Services frontend demo

A local, interactive client-presentation prototype with exactly three roles: Scan Centre, Admin, and Doctor. All roles share one synthetic dataset, persisted in browser localStorage. Original proposal, master prompt and ten reference screens are preserved in this workspace.

## Run

Requires Node.js 20.9+ (Node 22 is recommended).

```powershell
npm install
npm run dev
```

Open http://localhost:3000. A development server was already running at that address during implementation. If port 3000 is occupied by this project, reuse that server.

```powershell
npm run typecheck
npm test
npm run build
npm start
```

On Windows environments where sandbox process restrictions interfere with Turbopack CSS workers, use `npx next build --webpack` in a normal terminal. Dependency versions are recorded in package-lock.json.

## Presenter walkthrough (5–8 minutes)

1. Open the branded entry page and choose **Scan Centre**. The default identity is Velachery Scan Centre. Use **New Case** and **Fill synthetic patient details**; adjust the study, priority and scan time as desired.
2. Select **Use sample prescription**, **Use sample 650 MB scan**, and **Add sample voice note**. The study simulation takes approximately four seconds. Pause/resume, retry and cancel work. Click **Review & Submit**, then **Submit Case**. Note the case ID.
3. In the header's **Demo role** selector, choose **Admin**. Open **Case Queue**, find the case, click **Assign**, choose **Dr. Priya Menon**, and confirm. Workload cards derive from shared cases.
4. Switch to **Doctor** (Priya is the default). Open **Work Queue**, select that exact case and **Start Reporting**. Inspect the source attachment access concept, play the sample voice note and review the transcript. Check all three quality items, select **Use sample PDF**, and **Submit for Admin Review**.
5. Switch to **Admin**, open **Report Review**, then the case. Explore the three-page synthetic report and version selector. Optionally return it with a required comment, switch to Doctor to upload an updated PDF, and return to Admin. Click **Approve & Deliver**.
6. Switch to **Scan Centre**, open **My Cases**, and select the case. The delivered report is available for preview and sample PDF download. Choose **Request Correction**, enter a reason, and submit.
7. Switch to **Admin → Corrections**. Open the case. Either route the correction to Priya and repeat the Doctor submission/Admin approval, or choose **Handle in Admin**, attach a sample corrected version, save it, then approve and redeliver. Previous report versions remain preserved. Switch back to Centre to see the updated history.
8. For training, switch to **Doctor → Training**, select a lesson, and play at 30× or 60× demo speed. Pause, then switch to **Admin → Training** to view the same watched intervals. Seeking earns no watch time. In **Centres**, find Manama to illustrate Bahrain timezones. Resize the browser to phone width for Admin cards, navigation, assignment and correction dialogs.

The sidebar's **Presenter guide** provides a condensed walkthrough. **Reset demo data** asks for confirmation, restores fixtures and returns to persona entry.

## What is implemented

- Shared case creation/drafts, submission, assignment/reassignment, reporting, revision requests, review, approval/delivery, corrections and redelivery.
- Case ownership selectors and action-level role guards, UTC timestamps, scoped notifications and activity history.
- Immutable submitted report versions with delivery references; Centres see delivered versions rather than unapproved internal reports.
- Simulated study uploads and attachment metadata, voice-note sample playback through browser speech synthesis with a transcript fallback.
- Fictitious PDF generation/download, CSV analytics export, shared dashboard charts and operational metrics.
- Centre and Doctor management, country/IANA timezone configuration, availability and optional training eligibility rules.
- Ten-module training simulation with unique watched-interval merging, replay protection and persisted resume positions.
- Responsive Admin cards and dialogs, local PWA manifest and a service worker restricted to an explicit list of static brand assets.

## Design and workflow assumptions

The ten supplied screens establish the deep navy sidebar (`#06162E`), near-white workspace (`#F6F9FE`), navy text (`#132854`), bright blue CTA (`#0869F7`), white bordered cards and restrained status colours. The supplied Logo.png is reused unchanged. Decorative crops use only supplied sidebar/banner artwork. No screenshot serves as an application page.

Fixtures contain 25 centres, eight doctors, 40 cases and ten modules. They are deterministic relative to initialization time. Manama is explicitly an illustrative international example. Training gating defaults off. Editable priority targets default to Normal 240, Urgent 120 and STAT 60 minutes; they are demo operational configuration, not commercial promises.

Centre upload delay = submission minus acquisition; assignment delay = assignment minus submission; Doctor TAT = doctor submission minus assignment; review time = approval minus doctor submission; total reporting TAT = latest delivery minus centre submission. Missing durations display Not available. UTC underlies elapsed-time calculations. The scan-time input currently uses the device's timezone, labelled in the form; display elsewhere uses persona timezones.

## Simulation boundaries

Synthetic information only. There is no backend, authentication, cloud upload, real presigned URL, email/OTP delivery, push service, PACS viewer, AI interpretation or compliance certification. Local file bytes are not persisted or uploaded; chosen files are represented by metadata and sample previews. Browser speech synthesis reads a fictitious sample transcript rather than a selected audio file. Browser storage is demonstration persistence, not production patient-data security.

Retention labels show scan maximum seven days and final report two months. Voice expiry is configurable pending final scope. Deletion scheduling is illustrative; no cloud deletion occurs, and downloaded files cannot be revoked remotely. The PWA caches only explicitly named static images; it does not cache case routes or reports and does not provide offline application operation.

## Structure

- `src/domain`: types, synthetic fixtures, pure state transitions, permissions, timing and training helpers.
- `src/store`: client initialization, versioned localStorage persistence, role identity and mutation wiring.
- `src/components`: shell, role modules, reusable dialogs, report preview, upload and learning interfaces.
- `src/lib`: browser PDF and CSV downloads.
- `src/app`: App Router entry, metadata, stylesheet and shared application route.
- `public`: supplied brand assets, manifest and static-image-only service worker.
- `tests`: domain-level scenarios and invalid-transition checks.

## Verification status

TypeScript checking, all ten domain tests, and the production webpack build passed during implementation. The sign-in and Scan Centre dashboard were opened in the running browser with no captured console errors. The initial sandboxed production build hit a Turbopack CSS-worker process restriction; the normal-access webpack build then succeeded, and `npm run build` now uses webpack. The user requested immediate delivery and no further testing before the full browser walkthrough and responsive verification were completed. Those remaining checks are not claimed as passed.
