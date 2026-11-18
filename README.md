# DICOM Reporting Services frontend demo

An interactive client-presentation prototype with exactly three roles: Scan Centre, Admin, and Doctor. All personas share synthetic workflow data in browser localStorage. Uploaded PDF bytes are stored locally in IndexedDB; there is no backend or cloud upload.

## Run

Requires Node.js 20.9+; Node 22 is recommended.

```powershell
npm.cmd install
npm.cmd run dev
```

Open http://localhost:3000. Reuse an existing development server for this project if one is already running.

```powershell
npm.cmd test
npm.cmd run typecheck
npm.cmd run build
npm.cmd start
```

To run the production build on another port, use `npm.cmd start -- --port 3100`. The build uses webpack. Dependencies remain recorded in package-lock.json; no new runtime libraries were added for peer review.

## Presenter walkthrough

1. Choose **Scan Centre** and Velachery Scan Centre. In **New Case**, fill synthetic details and use the sample prescription, scan, and optional voice note. Review and submit. Alternatively, use unassigned fixture **DRS-2026-0145**.
2. Switch to **Admin > Doctors**. Open **Edit profile / reviewer** for **Dr. Priya Menon** and select **Dr. Arjun Nair** as her peer reviewer. Save. Priya and Arjun are ordinary Doctor accounts, not separate roles.
3. In **Admin > Case Queue**, assign the case to Priya.
4. Switch to **Doctor**, select Priya in **Demo identity**, and open the case in **Work Queue**. Start reporting, complete the three checklist items, choose a PDF (up to 100 MB) or use a synthetic sample, and **Submit for Peer Review**. The case becomes **Pending Peer Review**.
5. Switch Doctor identity to Arjun and open **Peer Reviews**. Open the report, inspect the PDF and version, and choose **Verify & Forward to Admin**. The case becomes **Pending Admin Approval**.
6. Switch to **Admin > Report Review**, open that case, inspect the reviewer and verification timestamp, and **Approve & Release**.
7. Switch to **Scan Centre > My Cases**. The case shows **Received**, and its final PDF can be opened or downloaded. The download contains the uploaded bytes.
8. To demonstrate peer correction before release, Arjun selects **Request Correction** with a mandatory reason. Priya sees the remarks and uploads V2. V1 stays in history. V2 must pass peer verification before Admin can release it.
9. Admin may **Request Changes** with a reason after verification. The next version must be verified again. For a centre-requested correction after delivery, Admin can route it to the reporting doctor or handle the correction and upload a revised PDF; both routes require peer verification before redelivery. The centre retains access to its previous released PDF meanwhile.
10. Explore training at accelerated playback speed, shared Admin training progress, operational analytics, centres including Bahrain timezones, and mobile navigation. These existing modules remain available.

The sidebar **Presenter guide** describes these handoffs. **Reset demo data** clears saved PDF blobs and restores the synthetic fixtures.

## Peer-review behavior

- **Doctors:** cards show the mapped reviewer and mapping status. The profile modal supports selecting, changing, or removing the reviewer; self-review is rejected.
- **No active reviewer:** the PDF is saved as a version with **Reviewer Assignment Required**. Assigning an active reviewer automatically queues it. Offline/Busy availability does not prevent an otherwise active doctor from peer reviewing.
- **Mapping changes:** undecided tasks transfer to the new reviewer with new task IDs; stale decisions are rejected. Removing or deactivating a reviewer holds their pending tasks. Completed reviews retain their attribution.
- **Review history:** each PDF version is immutable. Reviewer decisions, mandatory correction reasons, timestamps, reassignment events, Admin changes, and releases remain linked to the case/version.
- **Approval:** Admin release requires verification of the latest version. Viewing an older PDF disables current-version approval actions. An Admin-uploaded revision requires fresh peer verification.
- **Visibility:** doctors have separate reporting and peer-review queues. Reviewers cannot report on another doctor's case or read their private working notes. Centres see only **Pending**, **Assigned**, or **Received**, and only released report versions. Internal review stages and events are hidden from centres.
- **PDFs:** actual uploads persist in IndexedDB across refresh and persona switches. Native browser PDF preview includes open/download fallbacks. If a stored upload is missing, an explicit error is shown; a synthetic report is never silently substituted. Sample/legacy files are labeled.
- **Migration:** schema v1 data is migrated in place to v2. Existing cases, training, report history, and previous deliveries are retained. Old unreleased reports require peer review; old releases do not receive fabricated verification records. Since the previous demo stored only filenames, those historical reports remain labeled legacy samples.

## Design and existing features

The navy sidebar, blue actions, white cards, supplied logo/artwork, and responsive navigation are retained. Restrained neem-yellow accents touch the logo area and active navigation without replacing the sidebar palette.

The demo retains shared case creation/drafts, simulated study uploads, assignment/reassignment, quality checks, immutable versions, delivery references, correction routing, notifications, PDF/CSV downloads, dashboards, centre/doctor management, training eligibility settings, and ten-module watched-interval tracking.

Fixtures contain 25 centres, eight doctors, 40 cases, and ten training modules. Priya is mapped to Arjun by default; fixtures include pending, held, verified, corrected, and released reports. Neha illustrates a missing reviewer mapping. Saved pre-existing accounts keep their configuration during migration.

UTC underlies elapsed-time calculations. Persona timezones control display, including the illustrative Bahrain centre. Priority targets default to Normal 240, Urgent 120, and STAT 60 minutes. Training gating defaults off.

## Verification

- `npm.cmd test`: domain scenarios cover peer review, centre and peer corrections, Admin revisions, V2/V3, mapping transfers, holds/reactivation, permissions, stale/duplicate actions, migration, PDF validation, training, timezones, drafts, and notifications.
- `npm.cmd run typecheck` and `npm.cmd run build`: TypeScript and production checks.
- `npm.cmd run test:browser`: optional acceptance script requiring an existing Playwright Core installation and its Chromium browser. No browser dependency is added to this app. Set `PLAYWRIGHT_CORE_PATH` to that package's absolute path if it is not locally resolvable, and `DICOM_BASE_URL` to the running production URL (default `http://localhost:3100`). It uses a fresh isolated browser context, real generated PDFs, and writes ignored screenshots to `test-results/peer-review`.
- Browser acceptance covers mapping, assignment, real V1 upload, reviewer refresh, verification, Admin release, byte-identical centre download, centre correction, V2 peer correction, V3 verification/redelivery, historic-version approval guards, and all three personas at desktop and 390px widths.

## Demo-only boundaries

Synthetic information only. There is no production authentication, server authorization, backend database, cloud file service, real scan upload, PACS viewer, AI interpretation, email/OTP, or push service. Persona guards illustrate workflow behavior; browser storage is not production patient-data security. Uploaded PDFs remain in this browser/profile and are lost if its site data is cleared. Browser storage quotas apply, and PDF rendering depends on the browser.

Scan/prescription/voice attachments remain simulations. Browser speech synthesis reads a fictitious sample transcript. Retention/deletion schedules are illustrative; no cloud deletion occurs, and downloaded files cannot be revoked. The PWA caches only explicitly named static images, not case routes or PDF documents.

## Structure

- `src/domain`: types, synthetic fixtures, pure workflow transitions, migration, permissions, timing, and training helpers.
- `src/store`: shared client state, localStorage persistence, persona switching, and PDF submission orchestration.
- `src/components`: shell, existing role modules, peer queue/history/stepper, reusable dialogs, PDF preview, uploads, and training.
- `src/lib`: IndexedDB PDF storage, sample PDF generation, actual PDF download, and CSV export.
- `src/app` and `public`: App Router entry, shared styling, supplied brand assets, and static-only PWA.
- `tests`: domain scenarios and optional browser acceptance script.
