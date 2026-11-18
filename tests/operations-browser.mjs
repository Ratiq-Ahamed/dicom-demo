import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_CORE_PATH||'playwright-core');
const base=process.env.DICOM_BASE_URL||'http://localhost:3000';
const browser=await chromium.launch({channel:'chromium',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const saved=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('dicom-demo-v1')).data);
async function role(value,id){await page.getByRole('button',{name:'Demo',exact:true}).click();await page.getByLabel('Demo role',{exact:true}).selectOption(value);if(id)await page.getByLabel('Demo identity',{exact:true}).selectOption(id);await page.getByRole('button',{name:'Switch',exact:true}).click();await page.waitForURL(base+'/'+value);}
try{
 await mkdir('test-results/operations',{recursive:true});
 await page.goto(base);await page.locator('.persona-card').filter({hasText:'DICOM Admin'}).click();await page.waitForURL(base+'/admin');const before=await saved();
 await page.goto(base+'/admin/simulation');await page.getByRole('button',{name:'Generate 30 Days of Demo Data',exact:true}).click();await page.getByRole('button',{name:'Confirm Generation',exact:true}).click();
 await page.waitForFunction(()=>JSON.parse(localStorage.getItem('dicom-demo-v1')).data.operations?.simulations[0]?.status==='Complete',{},{timeout:60000});
 const d=await saved(),op=d.operations,batch=op.simulations[0];assert.equal(op.attendance.length,90);assert.equal(op.payroll[0].lines[0].dailyRate,83333);assert(op.invoices.length>=2);assert(op.invoices.every(i=>i.pdfId&&i.total===i.lines.length*i.rate));assert(op.payroll[0].lines.every(l=>l.pdfId));
 await page.screenshot({path:'test-results/operations/simulation.png',fullPage:true});
 await page.goto(base+'/admin/attendance');assert.equal(await page.locator('.calendar-date').count(),30);assert.equal(await page.locator('.attendance-calendar-table thead th').count(),7);assert(await page.locator('.calendar-date').first().evaluate(el=>el.getBoundingClientRect().height>=82));await page.screenshot({path:'test-results/operations/attendance.png',fullPage:true});
 await page.goto(base+'/admin/leave');assert((await page.locator('.workspace').innerText()).includes('Rejected'));
 await page.goto(base+'/admin/payroll');assert((await page.locator('.workspace').innerText()).includes('Approved & locked'));await page.getByRole('button',{name:'Payslip / Details',exact:true}).first().click();await page.locator('.ops-pdf').waitFor();assert(await page.getByRole('link',{name:'Download PDF',exact:true}).count());await page.getByRole('button',{name:'Close dialog',exact:true}).click();
 await page.goto(base+'/admin/invoices');await page.getByRole('button',{name:'Open Invoice',exact:true}).first().click();await page.locator('.ops-pdf').waitFor();await page.screenshot({path:'test-results/operations/invoice.png',fullPage:true});await page.getByRole('button',{name:'Close dialog',exact:true}).click();
 const centre=d.centres.find(c=>c.simulationBatchId===batch.id);await role('centre',centre.id);await page.goto(base+'/centre/invoices');assert(!(await page.locator('.workspace').innerText()).includes(d.centres.find(c=>c.simulationBatchId===batch.id&&c.id!==centre.id).name));assert.equal(await page.getByRole('button',{name:'Generate Invoices',exact:true}).count(),0);
 await role('doctor',d.doctors.find(c=>c.simulationBatchId===batch.id).id);await page.goto(base+'/doctor/attendance');assert.equal(await page.locator('.calendar-date').count(),30);assert(!/salary|payable|₹/i.test(await page.locator('.workspace').innerText()));await page.goto(base+'/doctor/leave');assert((await page.locator('.workspace').innerText()).includes('Pending'));
 await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.screenshot({path:'test-results/operations/doctor-leave-mobile.png',fullPage:true});
 await role('admin');await page.goto(base+'/admin/simulation');await page.getByRole('button',{name:'Reset Generated Demo Data',exact:true}).click();await page.getByRole('button',{name:'Confirm Reset',exact:true}).click();await page.waitForFunction(()=>JSON.parse(localStorage.getItem('dicom-demo-v1')).data.operations.simulations.length===0);const after=await saved();assert.deepEqual(after.cases,before.cases);assert.deepEqual(after.doctors,before.doctors);assert.equal(after.operations.invoices.length,0);assert.deepEqual(errors,[]);
 console.log('PASS: generation, /30 salary, attendance, leave, payroll/payslip PDFs, invoice PDFs, centre isolation, mobile and batch-only reset.');
}catch(e){console.log((await page.locator('body').innerText()).slice(-3000));await page.screenshot({path:'test-results/operations/failure.png',fullPage:true}).catch(()=>{});throw e;}finally{await browser.close();}
