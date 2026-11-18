// Optional acceptance check. Uses an existing Playwright Core installation; no new dependency.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_CORE_PATH || 'playwright-core');
const { jsPDF } = require('jspdf');
const base = process.env.DICOM_BASE_URL || 'http://localhost:3100';
const output = path.resolve('test-results/peer-review');
await mkdir(output, { recursive: true });
const files = [];
for (let n = 1; n <= 3; n++) {
  const pdf = new jsPDF();
  pdf.text('SYNTHETIC ACCEPTANCE TEST - NOT FOR CLINICAL USE', 12, 20);
  pdf.text('Peer review report V' + n, 12, 36);
  const bytes = Buffer.from(pdf.output('arraybuffer'));
  const filename = path.join(output, 'report-v' + n + '.pdf');
  await writeFile(filename, bytes);
  files.push({ filename, hash: createHash('sha256').update(bytes).digest('hex') });
}

const browser = await chromium.launch({ channel: 'chromium', headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const id = 'DRS-2026-0145';
const data = () => page.evaluate(() => JSON.parse(localStorage.getItem('dicom-demo-v1')).data);
async function waitFor(check, label) {
  for (let i = 0; i < 100; i++) {
    if (await check()) return;
    await page.waitForTimeout(100);
  }
  throw new Error('Timed out: ' + label);
}
async function status(expected) {
  await waitFor(async () => (await data()).cases.find(c => c.id === id).status === expected, expected);
}
async function role(value, identity) {
  await page.getByRole('button', { name: 'Demo', exact: true }).click();
  await page.getByLabel('Demo role', { exact: true }).selectOption(value);
  if(value!=='admin')await page.getByLabel('Demo identity', { exact: true }).selectOption(identity??(value==='doctor'?'doctor-1':'centre-1'));
  await page.getByRole('button', { name:'Switch', exact:true }).click();
  await page.waitForURL(base+'/'+value);
  await page.getByRole('dialog').waitFor({state:'hidden'});
}
async function openCase(roleName, list = 'cases', caseId = id) {
  let suffix='';if(roleName==='centre'){const c=(await data()).cases.find(c=>c.id===caseId);suffix='?status='+(c.deliveries.length?'Received':'Pending');}
  await page.goto(base+'/'+roleName+'/'+list+suffix);
  await page.getByLabel('Search cases', { exact: true }).fill(caseId);
  await page.locator('.table-desktop').getByRole('link', { name: caseId, exact: true }).click();
  await page.getByRole('heading', { name: caseId }).waitFor();
}
async function centrePrivacy(){
 const text=await page.locator('.workspace').innerText();
 assert(!/\bTAT\b|Upload delay|Assignment delay|Assigned doctor|Peer reviewer|Peer verification|Pending Peer Review|Pending Admin Approval|Reporting workflow|Activity history|Admin revision|Doctor submission|Awaiting assignment/.test(text),'Centre screen exposes internal tracking');
}
async function upload(n, admin = false) {
  if (!admin) for (const box of await page.locator('.quality-checks input').all()) await box.check();
  await page.getByLabel('Choose report PDF', { exact: true }).setInputFiles(files[n - 1].filename);
  await page.getByRole('button', { name: admin ? 'Save & Send for Peer Review' : 'Submit for Peer Review', exact: true }).click();
  await status('PENDING_PEER_REVIEW');
}
async function blobHash(pdfId) {
  return page.evaluate(async id => {
    const db = await new Promise((resolve, reject) => { const r = indexedDB.open('dicom-demo-pdfs', 1); r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); });
    const blob = await new Promise((resolve, reject) => { const r = db.transaction('reports').objectStore('reports').get(id); r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); });
    db.close();
    const digest = await crypto.subtle.digest('SHA-256', await blob.arrayBuffer());
    return Array.from(new Uint8Array(digest), n => n.toString(16).padStart(2, '0')).join('');
  }, pdfId);
}
async function screenshot(name) { await page.waitForTimeout(250); await page.screenshot({ path: path.join(output, name + '.png'), fullPage: true }); }
async function noOverflow(label) {
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), label + ' overflows viewport');
}
async function reportLayout() {
  await page.locator('.actual-pdf').first().waitFor();
  const layout = await page.evaluate(() => {
    const frame = document.querySelector('.actual-pdf');
    const summary = document.querySelector('.verification-summary');
    const history = document.querySelector('.report-history-heading');
    return {
      frameWidth: frame.getBoundingClientRect().width,
      containerWidth: frame.parentElement.clientWidth,
      height: frame.getBoundingClientRect().height,
      summary: summary && getComputedStyle(summary).display,
      history: history && getComputedStyle(history).display,
      metadata: getComputedStyle(document.querySelector('.pdf-version-info')).display,
    };
  });
  assert(Math.abs(layout.frameWidth - layout.containerWidth) <= 2, 'PDF must fill the viewer width');
  assert(layout.height >= 430, 'PDF must not collapse to the default iframe height');
  assert.equal(layout.metadata, 'flex');
  if (layout.summary) assert.equal(layout.summary, 'grid');
  if (layout.history) assert.equal(layout.history, 'flex');
}

try {
  await page.goto(base);
  await page.locator('.persona-card').filter({ hasText: 'DICOM Admin' }).click();
  await page.waitForURL(base + '/admin');
  await page.evaluate(()=>{const saved=JSON.parse(localStorage.getItem('dicom-demo-v1'));const age=value=>{if(typeof value==='string'&&/^2026-\d\d-\d\dT/.test(value))return new Date(new Date(value).getTime()-365*86400000).toISOString();if(Array.isArray(value))return value.map(age);if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([key,v])=>[key,age(v)]));return value;};localStorage.setItem('dicom-demo-v1',JSON.stringify(age(saved)));});
  await page.reload();
  for(const persona of ['admin','doctor','centre']){await role(persona);await page.locator('.dashboard-queue').waitFor();assert(await page.locator('.dashboard-queue tbody tr').count()>0,persona+' lost old saved cases');assert(!await page.getByLabel('Dashboard date range').count());if(persona==='centre')await centrePrivacy();await screenshot(persona+'-essential-dashboard');}
  await role('admin');
  await page.locator('.sidebar nav a[href="/admin/doctors"]').click();
  const priya = page.locator('.doctor-directory > .card').filter({ has: page.getByRole('heading', { name: 'Dr. Priya Menon', exact: true }) });
  await priya.getByRole('button', { name: 'Edit profile / reviewer' }).click();
  assert.equal(await page.getByLabel('Peer reviewer', { exact: true }).locator('option[value="doctor-1"]').count(), 0);
  await page.getByLabel('Peer reviewer', { exact: true }).selectOption('doctor-2');
  await page.getByRole('button', { name: 'Save doctor', exact: true }).click();
  await screenshot('admin-mappings-desktop');
  await openCase('admin');
  await page.getByRole('button', { name: 'Assign case', exact: true }).click();
  await page.locator('.doctor-choice').filter({ hasText: 'Dr. Priya Menon' }).locator('input').check();
  await page.getByRole('button', { name: 'Confirm assignment' }).click();
  await status('ASSIGNED');
  await role('doctor', 'doctor-1');
  await openCase('doctor');
  await page.getByRole('button', { name: 'Start Reporting', exact: true }).click();
  await upload(1);
  let c = (await data()).cases.find(c => c.id === id);
  assert.equal(c.reports.length, 1);
  assert.equal(await blobHash(c.reports[0].pdfId), files[0].hash);
  const v1 = structuredClone(c.reports[0]);
  await screenshot('doctor-pending-peer-desktop');
  await role('doctor', 'doctor-2');
  await page.locator('.sidebar nav a[href="/doctor/peer-reviews"]').click();
  await page.getByLabel('Search peer reviews').fill(id);
  await page.locator('.table-desktop').getByRole('link', { name: id, exact: true }).click();
  await page.getByRole('link', { name: 'Open PDF', exact: true }).waitFor();
  const popupPromise = page.waitForEvent('popup');
  await page.getByRole('link', { name: 'Open PDF', exact: true }).click();
  const pdfPage = await popupPromise;
  await pdfPage.waitForLoadState('load');
  assert(pdfPage.url().startsWith('blob:'));
  await pdfPage.close();
  await page.reload();
  await page.getByRole('button', { name: 'Verify & Forward to Admin', exact: true }).waitFor();
  assert.equal(await page.getByRole('button', { name: 'Submit for Peer Review', exact: true }).count(), 0);
  assert.equal(await blobHash(v1.pdfId), files[0].hash);
  await page.getByRole('button', { name: 'Verify & Forward to Admin', exact: true }).click();
  await status('AWAITING_REVIEW');
  await role('admin');
  await openCase('admin', 'reviews');
  await reportLayout();
  await screenshot('admin-verified-desktop');
  await page.getByRole('button', { name: 'Approve & Release', exact: true }).click();
  await status('DELIVERED');
  await role('centre', 'centre-1');
  await openCase('centre');
  assert.equal(await page.locator('.heading-actions .badge').innerText(), 'Received');
  await centrePrivacy();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download final report', exact: true }).click();
  const download = await downloadPromise;
  const stream = await download.createReadStream(), chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  assert.equal(createHash('sha256').update(Buffer.concat(chunks)).digest('hex'), files[0].hash);
  await screenshot('centre-received-desktop');
  console.log('PASS V1: Admin mapping -> reporting -> peer verification -> release -> identical PDF download');

  // Centre correction, peer rejection, then V3: both correction branches preserve history.
  await page.getByRole('button', { name: 'Request Correction', exact: true }).click();
  await page.getByLabel('Explanation').fill('Please clarify the synthetic referrer.');
  await page.getByRole('button', { name: 'Submit correction', exact: true }).click();
  await status('CORRECTION_REQUESTED');
  await role('admin');
  await openCase('admin', 'corrections');
  await page.getByRole('button', { name: 'Route to doctor', exact: true }).click();
  await page.getByRole('button', { name: 'Route correction', exact: true }).click();
  await role('doctor', 'doctor-1');
  await openCase('doctor');
  await upload(2);
  await role('doctor', 'doctor-2');
  await page.goto(base + '/doctor/cases/' + id);
  assert.equal(await page.getByRole('button', { name: 'Request Correction', exact: true }).isDisabled(), true);
  await page.getByLabel('Peer correction reason', { exact: true }).fill('V2 needs the synthetic patient reference clarified.');
  await page.getByRole('button', { name: 'Request Correction', exact: true }).click();
  await status('REVISION_REQUESTED');
  await role('doctor', 'doctor-1');
  await openCase('doctor');
  assert((await page.locator('.review-comment').first().innerText()).includes('V2 needs'));
  await upload(3);
  await role('doctor', 'doctor-2');
  await page.goto(base + '/doctor/cases/' + id);
  await page.getByRole('button', { name: 'Verify & Forward to Admin', exact: true }).click();
  await status('AWAITING_REVIEW');
  await role('admin');
  await openCase('admin', 'reviews');
  await page.getByLabel('Report version', { exact: true }).selectOption(v1.id);
  assert.equal(await page.getByRole('button', { name: 'Approve & Release', exact: true }).isDisabled(), true);
  c = (await data()).cases.find(c => c.id === id);
  await page.getByLabel('Report version', { exact: true }).selectOption(c.reports[2].id);
  await page.getByRole('button', { name: 'Approve & Release', exact: true }).click();
  await status('REDELIVERED');
  c = (await data()).cases.find(c => c.id === id);
  assert.deepEqual(c.reports[0], v1);
  assert.equal(c.reports.length, 3);
  assert.equal(c.deliveries.length, 2);
  assert.equal(c.peerReviews.find(r => r.versionId === c.reports[1].id).status, 'Correction requested');
  await screenshot('admin-version-history');
  console.log('PASS corrections: centre correction -> V2 -> peer correction -> V3 -> fresh verification -> redelivery');

  // Responsive checks use all three personas and verify the shared sidebar.
  await page.setViewportSize({ width: 390, height: 844 });
  for (const persona of ['admin', 'doctor', 'centre']) {
    await role(persona, persona === 'doctor' ? 'doctor-2' : persona === 'centre' ? 'centre-1' : undefined);
    await noOverflow(persona + ' mobile dashboard');
    await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
    assert.equal(await page.locator('.sidebar.open').count(), 1);
    await screenshot(persona + '-sidebar-mobile');
    await page.getByRole('button', { name: 'Close menu', exact: true }).click({ position: { x: 350, y: 300 } });
    await page.goto(base + '/' + persona + '/cases/' + id);
    await page.getByRole('heading', { name: id }).waitFor();
    await noOverflow(persona + ' mobile case');
    await reportLayout();
    if(persona==='centre')await centrePrivacy();
    await screenshot(persona + '-case-mobile');
  }
  assert.deepEqual(errors, []);
  console.log('PASS responsive: desktop and 390px layouts across Admin, Doctor and Scan Centre; no page errors');

  await role('admin');
  await page.goto(base + '/admin/doctors');
  await page.locator('.doctor-directory > .card').filter({ has: page.getByRole('heading', { name: 'Dr. Neha Singh', exact: true }) }).getByRole('button', { name: 'Edit profile / reviewer' }).click();
  await noOverflow('mobile reviewer mapping modal');
  await screenshot('admin-mapping-modal-mobile');
  await page.getByLabel('Peer reviewer', { exact: true }).selectOption('doctor-2');
  await page.getByRole('button', { name: 'Save doctor', exact: true }).click();
  const previouslyHeld = (await data()).cases.find(c => c.id === 'DRS-2026-0157');
  assert.equal(previouslyHeld.status, 'PENDING_PEER_REVIEW');
  await role('doctor', 'doctor-2');
  await page.goto(base + '/doctor/peer-reviews');
  await page.getByLabel('Search peer reviews').fill(previouslyHeld.id);
  assert.equal(await page.locator('.mobile-case').count(), 1);
  await noOverflow('mobile peer-review queue');
  await screenshot('doctor-peer-queue-mobile');

  // Existing case submission, training playback, and remaining navigation still work.
  await page.setViewportSize({ width: 1440, height: 1000 });
  await role('centre', 'centre-1');
  await page.goto(base + '/centre/new');
  const newId = await page.locator('.case-id-chip').innerText();
  await page.getByRole('button', { name: 'Fill synthetic patient details', exact: true }).click();
  await page.getByRole('button', { name: 'Use sample prescription', exact: true }).click();
  await page.getByRole('button', { name: 'Use sample 650 MB scan', exact: true }).click();
  await page.getByText('Simulation complete', { exact: false }).waitFor();
  await page.getByRole('button', { name: 'Review & Submit', exact: true }).click();
  await page.getByRole('button', { name: 'Submit Case', exact: true }).click();
  await page.waitForURL(base + '/centre/cases/' + newId);
  assert.equal((await data()).cases.find(c => c.id === newId).status, 'SUBMITTED');
  await role('doctor', 'doctor-1');
  await page.goto(base + '/doctor/training');
  const positionBefore = (await data()).training.find(p => p.doctorId === 'doctor-1' && p.moduleId === 'module-5').position;
  await page.getByRole('button', { name: 'Play demo training', exact: true }).click();
  await waitFor(async () => (await data()).training.find(p => p.doctorId === 'doctor-1' && p.moduleId === 'module-5').position > positionBefore, 'training playback');
  await page.getByRole('button', { name: 'Pause demo training', exact: true }).click();
  for (const persona of ['admin', 'doctor', 'centre']) {
    await role(persona);
    const paths = await page.locator('.sidebar nav a').evaluateAll(links => links.map(a => a.getAttribute('href')));
    for (const target of paths) {
      await page.goto(base + target);
      await page.locator('.workspace h1').waitFor();
      assert(!/Page not found|This workspace belongs to another role/.test(await page.locator('.workspace h1').innerText()), target);
    }
  }
  await role('centre');
  await page.goto(base+'/centre/cases?status=Assigned');
  await page.locator('.category-tabs').waitFor();assert.equal(await page.locator('.category-tabs .active').textContent(),'Pending'+String((await data()).cases.filter(c=>c.centreId==='centre-1'&&!c.deliveries.length).length));await centrePrivacy();
  await page.goto(base+'/centre/corrections');await page.waitForURL(base+'/centre/cases?status=Received');await centrePrivacy();
  await page.evaluate(()=>{const saved=JSON.parse(localStorage.getItem('dicom-demo-v1'));saved.data.cases=[];localStorage.setItem('dicom-demo-v1',JSON.stringify(saved));});await page.reload();
  for(const persona of ['admin','doctor','centre']){await role(persona);await page.locator('.workspace h1').waitFor();assert.equal(await page.locator('.dashboard-queue .empty').count(),1);}
  assert.deepEqual(errors, []);
  console.log('PASS saved/empty datasets, centre privacy and legacy category URLs');
  console.log('PASS existing features: case submission, training playback, every role navigation page; mobile mapping modal and peer queue');
} catch (error) {
  await screenshot('failure').catch(() => {});
  console.error(await page.locator('body').innerText().catch(() => ''));
  throw error;
} finally {
  await browser.close();
}
