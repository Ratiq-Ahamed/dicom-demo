import { test } from 'node:test';
import assert from 'node:assert/strict';
import { seed } from '../src/domain/seed';
import { centreStatus, latestReview, peerCases, reportingCases, visibleAudit, canAssign, caseMetrics, formatTime, mergeIntervals, transition, visibleCases, watched } from '../src/domain/workflow';
import { centreCases, dashboardCases, pendingPeerCases, visibleNotifications } from '../src/domain/presentation';
import { migrateData } from '../src/domain/migration';
import { validatePDF } from '../src/lib/pdf-storage';
import type { Case, DemoData, User } from '../src/domain/types';
const anchor='2026-11-04T08:00:00.000Z';
const centre:User={id:'centre-1',entityId:'centre-1',role:'centre',name:'Velachery',timezone:'Asia/Kolkata'};
const admin:User={id:'admin-1',entityId:'admin-1',role:'admin',name:'Admin',timezone:'Asia/Kolkata'};
const doctor:User={id:'doctor-1',entityId:'doctor-1',role:'doctor',name:'Dr. Priya',timezone:'Asia/Kolkata'};
const reviewer:User={...doctor,id:'doctor-2',entityId:'doctor-2',name:'Dr. Arjun'};
const time=(minutes:number)=>new Date(new Date(anchor).getTime()+minutes*60000).toISOString();
function newCase(data:DemoData):Case{return{...structuredClone(data.cases[0]),id:'DRS-2026-0185',centreId:centre.id,patient:'Demo Patient Test',scanTakenAt:time(-20),status:'DRAFT',submittedAt:undefined,assignedAt:undefined,startedAt:undefined,doctorSubmittedAt:undefined,approvedAt:undefined,deliveredAt:undefined,doctorId:undefined,reports:[],peerReviews:[],deliveries:[],corrections:[],audit:[]};}
function submitted(){let d=seed(anchor);const c=newCase(d);return transition(d,centre,{type:'SAVE_CASE',value:c,submit:true},time(0));}
test('seeds a consistent busy demo with synthetic identities and ten modules',()=>{const d=seed(anchor);assert.equal(d.centres.length,25);assert.equal(d.doctors.length,8);assert.equal(d.cases.length,40);assert.equal(d.modules.length,10);d.cases.forEach(c=>Object.values(caseMetrics(c)).forEach(v=>assert(v===undefined||v>=0)));});

function reporting(){let d=submitted();const id=d.cases[0].id;d=transition(d,admin,{type:'ASSIGN',caseId:id,doctorId:doctor.id},time(1));return transition(d,doctor,{type:'START',caseId:id},time(2));}
function upload(d:DemoData,n:number,who=doctor){return transition(d,who,{type:'REPORT',caseId:d.cases[0].id,filename:'v'+n+'.pdf',note:'Version '+n,pdfId:'pdf-'+n,expectedVersionId:d.cases[0].reports.at(-1)?.id},time(3+n));}
function verify(d:DemoData,who=reviewer){const c=d.cases[0],r=latestReview(c)!;return transition(d,who,{type:'PEER_VERIFY',caseId:c.id,versionId:c.reports.at(-1)!.id,reviewId:r.id},time(10));}
function approve(d:DemoData){return transition(d,admin,{type:'APPROVE',caseId:d.cases[0].id,versionId:d.cases[0].reports.at(-1)!.id},time(11));}
function map(d:DemoData,id=doctor.id,reviewerId:string|undefined=reviewer.id){const value={...d.doctors.find(x=>x.id===id)!,reviewerId};return transition(d,admin,{type:'DOCTOR',value},time(5));}

test('complete peer lifecycle and centre correction preserve V1 and deliveries',()=>{
 let d=upload(reporting(),1);const id=d.cases[0].id,v1=structuredClone(d.cases[0].reports[0]);
 assert.equal(d.cases[0].status,'PENDING_PEER_REVIEW');assert(peerCases(d,reviewer.id).some(c=>c.id===id));assert.equal(centreStatus(d.cases[0]),'Pending');
 assert.throws(()=>approve(d),/peer verified/);d=approve(verify(d));assert.equal(centreStatus(d.cases[0]),'Received');assert.equal(d.cases[0].status,'DELIVERED');
 d=transition(d,centre,{type:'CORRECT',caseId:id,category:'Patient details',reason:'Fix referrer'},time(12));assert.equal(centreStatus(d.cases[0]),'Received');
 d=transition(d,admin,{type:'ROUTE_CORRECTION',caseId:id,doctorId:doctor.id},time(13));d=upload(d,2);assert.throws(()=>approve(d));d=approve(verify(d));
 assert.equal(d.cases[0].status,'REDELIVERED');assert.equal(d.cases[0].corrections[0].status,'Resolved');assert.deepEqual(d.cases[0].reports[0],v1);assert.equal(d.cases[0].deliveries.length,2);assert.equal(d.cases[0].reports.length,2);
 assert(d.notifications.some(n=>n.role==='centre'&&n.caseId===id));
});
test('peer correction requires a reason and V2 requires fresh verification',()=>{
 let d=upload(reporting(),1);const c=d.cases[0],r=latestReview(c)!,v1=structuredClone(c.reports[0]);
 const action={type:'PEER_CORRECT' as const,caseId:c.id,versionId:c.reports[0].id,reviewId:r.id,reason:' '};assert.throws(()=>transition(d,reviewer,action));
 d=transition(d,reviewer,{...action,reason:'Clarify referral'},time(6));assert.equal(d.cases[0].status,'REVISION_REQUESTED');assert.equal(d.cases[0].reviewComment,'Clarify referral');
 d=upload(d,2);assert.equal(latestReview(d.cases[0])?.status,'Pending');assert.deepEqual(d.cases[0].reports[0],v1);assert.equal(d.cases[0].peerReviews?.[0].reason,'Clarify referral');assert.throws(()=>approve(d));d=approve(verify(d));assert.equal(d.cases[0].deliveries[0].versionId,d.cases[0].reports[1].id);
});
test('Admin changes and Admin-uploaded revisions also require fresh peer verification',()=>{
 let d=verify(upload(reporting(),1));const id=d.cases[0].id,versionId=d.cases[0].reports[0].id;
 assert.throws(()=>transition(d,admin,{type:'RETURN',caseId:id,versionId,comment:' '}));
 d=transition(d,admin,{type:'RETURN',caseId:id,versionId,comment:'Clarify reference'},time(12));d=upload(d,2);d=verify(d);d=upload(d,3,admin);
 assert.equal(d.cases[0].reports[2].authorRole,'admin');assert.throws(()=>approve(d));d=approve(verify(d));assert.equal(d.cases[0].deliveries[0].versionId,d.cases[0].reports[2].id);
});
test('missing mappings save and hold a PDF, then automatically queue it',()=>{
 let d=reporting();d=map(d,doctor.id,'');d=upload(d,1);const version=structuredClone(d.cases[0].reports[0]);assert.equal(d.cases[0].status,'REVIEWER_REQUIRED');assert.throws(()=>approve(d));
 d=map(d);assert.equal(d.cases[0].status,'PENDING_PEER_REVIEW');assert.equal(latestReview(d.cases[0])?.reviewerId,reviewer.id);assert.deepEqual(d.cases[0].reports[0],version);
});
test('mapping transfers invalidate pending task IDs and preserve completed verification',()=>{
 let d=upload(reporting(),1);const c=d.cases[0],r=latestReview(c)!,versionId=c.reports[0].id;
 d=map(d,doctor.id,'doctor-3');assert.equal(latestReview(d.cases[0])?.reviewerId,'doctor-3');assert(!peerCases(d,reviewer.id).some(x=>x.id===c.id));
 assert.throws(()=>transition(d,reviewer,{type:'PEER_VERIFY',caseId:c.id,versionId,reviewId:r.id}));
 const nextReviewer={...reviewer,id:'doctor-3',entityId:'doctor-3'};d=verify(d,nextReviewer);const record=structuredClone(latestReview(d.cases[0]));d=map(d);assert.deepEqual(latestReview(d.cases[0]),record);d=approve(d);
});
test('inactive reviewers hold tasks and reactivation queues them; offline is still eligible for peer review',()=>{
 let d=upload(reporting(),1);d=transition(d,admin,{type:'DOCTOR',value:{...d.doctors[1],active:false}});assert.equal(d.cases[0].status,'REVIEWER_REQUIRED');
 assert.throws(()=>map(d,'doctor-3',reviewer.id));d=transition(d,admin,{type:'DOCTOR',value:{...d.doctors[1],active:true,availability:'Offline'}});assert.equal(d.cases[0].status,'PENDING_PEER_REVIEW');d=verify(d);assert.equal(d.cases[0].status,'AWAITING_REVIEW');
});
test('self mapping, self review, stale versions and duplicate decisions are rejected without mutation',()=>{
 let d=upload(reporting(),1),before=JSON.stringify(d);const c=d.cases[0],r=latestReview(c)!,versionId=c.reports[0].id;
 assert.throws(()=>map(d,doctor.id,doctor.id));assert.throws(()=>transition(d,doctor,{type:'PEER_VERIFY',caseId:c.id,versionId,reviewId:r.id}));assert.throws(()=>transition(d,reviewer,{type:'PEER_VERIFY',caseId:c.id,versionId:'stale',reviewId:r.id}));assert.equal(JSON.stringify(d),before);
 d=verify(d);assert.throws(()=>verify(d));assert.throws(()=>transition(d,admin,{type:'APPROVE',caseId:c.id,versionId:'stale'}));d=approve(d);assert.throws(()=>approve(d));
});
test('ownership selectors keep reporting queues separate and peer reviewers cannot report or view private notes',()=>{
 let d=upload(reporting(),1);const id=d.cases[0].id;assert(visibleCases(d,reviewer).some(c=>c.id===id));assert(!reportingCases(d,reviewer.id).some(c=>c.id===id));
 assert.throws(()=>transition(d,reviewer,{type:'NOTE',caseId:id,note:'wrong owner'}));assert.throws(()=>transition(d,reviewer,{type:'REPORT',caseId:id,filename:'x.pdf',pdfId:'x',note:'',expectedVersionId:d.cases[0].reports[0].id}));
 assert(visibleCases(d,centre).every(c=>c.centreId===centre.id));d.cases[0].audit.push({id:'private',at:anchor,actorId:doctor.id,role:'doctor',message:'Working note saved',privateDoctorId:doctor.id,internal:true});assert(!visibleAudit(d.cases[0],reviewer).some(a=>a.id==='private'));assert(!visibleAudit(d.cases[0],centre).some(a=>a.message.includes('Peer')||a.message.includes('Uploaded')));
});
test('legacy migration preserves data and deliveries without fabricating verification',()=>{
 const d=seed(anchor);d.schemaVersion=1;d.doctors.forEach(d=>delete d.reviewerId);d.cases.forEach(c=>{delete c.peerReviews;c.reports.forEach(v=>delete v.sample);});const before=structuredClone(d),next=migrateData(d);
 assert.equal(next.schemaVersion,2);assert.deepEqual(d,before);assert.deepEqual(next.training,d.training);assert.deepEqual(next.cases.map(c=>c.deliveries),d.cases.map(c=>c.deliveries));
 next.cases.filter(c=>c.reports.length).forEach(c=>{assert(c.reports.every(v=>v.legacy));assert(!(c.peerReviews??[]).some(r=>r.status==='Verified'));});
 const waiting=next.cases.find(c=>before.cases.find(x=>x.id===c.id)?.status==='AWAITING_REVIEW')!;assert.equal(waiting.status,'REVIEWER_REQUIRED');assert.throws(()=>transition(next,admin,{type:'APPROVE',caseId:waiting.id,versionId:waiting.reports[0].id}));assert.equal(migrateData(next),next);
});
test('PDF validation rejects empty or disguised files and accepts PDF bytes',async()=>{
 await assert.rejects(validatePDF(new Blob([])));await assert.rejects(validatePDF(new Blob(['not a PDF'])));await validatePDF(new Blob(['%PDF-1.7\nsynthetic test']));
});
test('invalid transitions and unauthorized actions do not mutate source state',()=>{const d=submitted(),id=d.cases[0].id,before=JSON.stringify(d);assert.throws(()=>transition(d,admin,{type:'APPROVE',caseId:id,versionId:'none'}));assert.throws(()=>transition(d,doctor,{type:'REPORT',caseId:id,filename:'x.pdf',pdfId:'x',note:''}));assert.throws(()=>transition(d,centre,{type:'ASSIGN',caseId:id,doctorId:doctor.id}));assert.equal(JSON.stringify(d),before);});
test('watch intervals merge replay without counting seeks',()=>{assert.deepEqual(mergeIntervals([[0,30],[20,45],[50,60],[5,10]]),[[0,45],[50,60]]);assert.equal(watched([[0,30],[0,30]]),30);let d=seed(anchor);d=transition(d,doctor,{type:'TRAIN',moduleId:'module-10',from:0,to:30,position:30},anchor);d=transition(d,doctor,{type:'TRAIN',moduleId:'module-10',from:0,to:0,position:1500},anchor);assert.equal(watched(d.training.find(p=>p.doctorId===doctor.id&&p.moduleId==='module-10')!.intervals),30);});
test('training gate defaults off and blocks new live work when enabled',()=>{let d=seed(anchor);assert(canAssign(d,doctor.id));d=transition(d,admin,{type:'SETTINGS',value:{...d.settings,requireTraining:true}},anchor);assert(!canAssign(d,doctor.id));assert.throws(()=>transition(d,admin,{type:'ASSIGN',caseId:d.cases[0].id,doctorId:doctor.id},anchor));});
test('UTC timing is invariant across Bahrain and IST display',()=>{const d=seed(anchor),c=d.cases.find(c=>c.deliveredAt)!;const before=caseMetrics(c);assert.notEqual(formatTime(anchor,'Asia/Kolkata'),formatTime(anchor,'Asia/Bahrain'));assert.deepEqual(caseMetrics(c),before);assert.equal(formatTime(anchor,'Asia/Kolkata').includes('01:30'),true);assert.equal(formatTime(anchor,'Asia/Bahrain').includes('11:00'),true);});
test('draft can be saved, edited and submitted once',()=>{let d=seed(anchor);const c=newCase(d);d=transition(d,centre,{type:'SAVE_CASE',value:c,submit:false},anchor);assert.equal(d.cases[0].status,'DRAFT');d=transition(d,centre,{type:'SAVE_CASE',value:{...d.cases[0],patient:'Updated Demo'},submit:true},time(1));assert.equal(d.cases[0].patient,'Updated Demo');assert.equal(d.cases.filter(x=>x.id===c.id).length,1);assert.throws(()=>transition(d,centre,{type:'SAVE_CASE',value:d.cases[0],submit:true},time(2)));});
test('notification read updates are scoped to their recipient',()=>{const d=submitted();const next=transition(d,centre,{type:'READ'},anchor);assert(next.notifications.filter(n=>n.role==='admin').every(n=>!n.read));});

test('dashboard selectors retain old work without a rolling submission cutoff',()=>{const d=seed('2020-01-01T08:00:00.000Z');assert.equal(dashboardCases(d,admin).length,40);assert(dashboardCases(d,doctor).length>0);assert(centreCases(d,centre).length>0);assert(pendingPeerCases(d,'doctor-3').length>0);});
test('centre projections expose only own submitted information and released PDF files',()=>{const d=seed(anchor),views=centreCases(d,centre);assert(views.length>0);for(const c of views){assert(['Pending','Received'].includes(c.category));for(const forbidden of ['doctorId','peerReviews','audit','status','reviewComment','workingNote','assignedAt','doctorSubmittedAt','approvedAt'])assert(!Object.hasOwn(c,forbidden));for(const report of c.reports){assert(!Object.hasOwn(report,'authorId'));assert(!Object.hasOwn(report,'authorRole'));assert(!Object.hasOwn(report,'note'));assert(c.category==='Received');}}assert.equal(centreCases(d,doctor).length,0);});
test('centre notifications omit assignment details and use public wording for releases',()=>{let d=upload(reporting(),1);d=approve(verify(d));const notes=visibleNotifications(d,centre);assert(notes.length>0);assert(notes.every(n=>n.title.startsWith('Report available:')));assert(!notes.some(n=>/assigned|peer|approval/i.test(n.title)));});
test('centre categories stay Received during corrections and exclude internal revision versions',()=>{let d=approve(verify(upload(reporting(),1)));const id=d.cases[0].id;d=transition(d,centre,{type:'CORRECT',caseId:id,category:'Patient details',reason:'Clarify reference'});d=transition(d,admin,{type:'ROUTE_CORRECTION',caseId:id,doctorId:doctor.id});d=upload(d,2);const c=centreCases(d,centre).find(c=>c.id===id)!;assert.equal(c.category,'Received');assert.equal(c.reports.length,1);assert.equal(c.correctionSent,true);assert.equal(c.canRequestCorrection,false);});
