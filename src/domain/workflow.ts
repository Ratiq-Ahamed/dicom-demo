import type { Action, Case, DemoData, Role, User } from './types';
export const uid=()=>typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():`${Date.now()}-${Math.random().toString(36).slice(2)}`;
export function reportingCases(data:DemoData,id:string){return data.cases.filter(c=>c.doctorId===id);}
export const latestReview=(c:Case)=>(c.peerReviews??[]).filter(r=>r.versionId===c.reports.at(-1)?.id).at(-1);
export function peerCases(data:DemoData,id:string){return data.cases.filter(c=>(c.peerReviews??[]).some(r=>r.reviewerId===id&&r.status!=='Superseded'));}
export function visibleCases(data:DemoData,user:User){return data.cases.filter(c=>user.role==='admin'||(user.role==='centre'?c.centreId===user.entityId:c.doctorId===user.entityId||(c.peerReviews??[]).some(r=>r.reviewerId===user.entityId&&r.status!=='Superseded')));}
export function centreStatus(c:Case):'Pending'|'Received'{return c.deliveries.length?'Received':'Pending';}
export function visibleAudit(c:Case,user:User){return c.audit.filter(a=>user.role==='centre'?!a.internal&&(/^(Case submitted|Draft saved|Assigned to |Correction requested:|Final report delivered|Corrected report redelivered|Report approved and delivered)/.test(a.message)):user.role==='admin'||(!a.privateDoctorId||a.privateDoctorId===user.entityId)&&a.message!=='Working note saved');}
export function activeReviewer(data:DemoData,c:Case){const id=data.doctors.find(d=>d.id===c.doctorId)?.reviewerId;return data.doctors.find(d=>d.id===id&&d.active&&d.id!==c.doctorId&&d.id!==c.reports.at(-1)?.authorId);}
/** Reconcile undecided tasks only. A transfer creates a new task, invalidating stale dialogs. */
export function syncPeerAssignments(data:DemoData,now:string,actor:User,caseId?:string){
 for(const c of data.cases.filter(c=>(!caseId||c.id===caseId)&&['REVIEWER_REQUIRED','PENDING_PEER_REVIEW'].includes(c.status))){
  const version=c.reports.at(-1);if(!version)continue;const reviewer=activeReviewer(data,c),prior=latestReview(c);
  if(prior&&prior.reviewerId===reviewer?.id&&prior.status===(reviewer?'Pending':'Waiting assignment'))continue;
  if(prior&&['Pending','Waiting assignment'].includes(prior.status))prior.status='Superseded';
  (c.peerReviews??=[]).push({id:uid(),versionId:version.id,reviewerId:reviewer?.id,submittedAt:now,status:reviewer?'Pending':'Waiting assignment'});
  c.status=reviewer?'PENDING_PEER_REVIEW':'REVIEWER_REQUIRED';
  c.audit.push({id:uid(),at:now,actorId:actor.id,role:actor.role,versionId:version.id,internal:true,message:`V${version.number} — ${reviewer?`Peer review assigned to ${reviewer.name}`:'Reviewer assignment required'}`});
  data.notifications.unshift({id:uid(),role:reviewer?'doctor':'admin',entityId:reviewer?.id??'admin-1',caseId:c.id,at:now,read:false,title:`${reviewer?'Peer review assigned':'Reviewer assignment required'}: ${c.id} · V${version.number}`});
 }
}
export function mergeIntervals(intervals:[number,number][], duration=Infinity):[number,number][]{
 const sorted=intervals.map(([a,b])=>[Math.max(0,a),Math.min(duration,b)] as [number,number]).filter(([a,b])=>b>a).sort((a,b)=>a[0]-b[0]); const out:[number,number][]=[];
 for(const item of sorted){const last=out[out.length-1];if(last&&item[0]<=last[1])last[1]=Math.max(last[1],item[1]);else out.push([...item]);} return out;
}
export const watched=(intervals:[number,number][])=>mergeIntervals(intervals).reduce((s,[a,b])=>s+b-a,0);
export function trainingPercent(data:DemoData,id:string){const total=data.modules.reduce((s,m)=>s+m.duration,0);return total?Math.round(100*data.training.filter(p=>p.doctorId===id).reduce((s,p)=>s+watched(p.intervals),0)/total):0;}
export function canAssign(data:DemoData,id:string){const d=data.doctors.find(d=>d.id===id);return !!d?.active&&d.availability!=='Offline'&&(!data.settings.requireTraining||data.modules.every(m=>watched(data.training.find(p=>p.doctorId===id&&p.moduleId===m.id)?.intervals??[])>=m.duration));}
export const delta=(a?:string,b?:string)=>a&&b?Math.max(0,(new Date(a).getTime()-new Date(b).getTime())/60000):undefined;
export function caseMetrics(c:Case){return {upload:delta(c.submittedAt,c.scanTakenAt),assignment:delta(c.assignedAt,c.submittedAt),doctor:delta(c.doctorSubmittedAt,c.assignedAt),review:delta(c.approvedAt,c.doctorSubmittedAt),total:delta(c.deliveredAt,c.submittedAt)};}
export const mean=(v:(number|undefined)[])=>{const a=v.filter((x):x is number=>x!==undefined&&Number.isFinite(x));return a.length?a.reduce((s,x)=>s+x,0)/a.length:undefined;};
export const median=(v:(number|undefined)[])=>{const a=v.filter((x):x is number=>x!==undefined).sort((a,b)=>a-b);return a.length?(a[Math.floor((a.length-1)/2)]+a[Math.floor(a.length/2)])/2:undefined;};
export const duration=(n?:number)=>n===undefined?'Not available':n<1?'<1 min':n<60?`${Math.round(n)} min`:`${Math.floor(n/60)}h ${Math.round(n%60)}m`;
export function formatTime(at?:string,tz='Asia/Kolkata'){return at?new Intl.DateTimeFormat('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit',timeZone:tz}).format(new Date(at)):'Not yet';}
export const statusLabel=(s:string)=>({SUBMITTED:'Unassigned',IN_PROGRESS:'In reporting',REVIEWER_REQUIRED:'Reviewer Assignment Required',PENDING_PEER_REVIEW:'Pending Peer Review',AWAITING_REVIEW:'Pending Admin Approval',REVISION_REQUESTED:'Revision requested',CORRECTION_REQUESTED:'Correction requested',CORRECTION_IN_PROGRESS:'Correction in progress',REDELIVERED:'Redelivered',DELIVERED:'Delivered',ASSIGNED:'Assigned',DRAFT:'Draft'}[s]??s);
function assert(value:unknown,message:string):asserts value {if(!value)throw new Error(message);}
export function transition(input:DemoData,user:User,action:Exclude<Action,{type:'OPS'}>,now=new Date().toISOString()):DemoData {
 const data=structuredClone(input); const admin=()=>assert(user.role==='admin','Only Admin can perform this action.');
 const notify=(role:Role,entityId:string,title:string,caseId?:string)=>data.notifications.unshift({id:uid(),role,entityId,title,caseId,at:now,read:false});
 if(action.type==='READ'){data.notifications.forEach(n=>{if(n.role===user.role&&n.entityId===user.entityId&&(!action.notificationId||n.id===action.notificationId))n.read=true;});return data;}
 if(action.type==='TRAIN'){
  assert(user.role==='doctor','Training playback belongs to the Doctor role.'); const m=data.modules.find(m=>m.id===action.moduleId);assert(m,'Module not found.');assert(action.from>=0&&action.to>=action.from&&action.to<=m.duration&&action.position>=0&&action.position<=m.duration,'Invalid playback interval.');
  let p=data.training.find(p=>p.doctorId===user.entityId&&p.moduleId===m.id);if(!p){p={doctorId:user.entityId,moduleId:m.id,intervals:[],position:0,updatedAt:now};data.training.push(p);}p.intervals=mergeIntervals([...p.intervals,[action.from,action.to]],m.duration);p.position=action.position;p.updatedAt=now;return data;
 }
 if(action.type==='SETTINGS'){admin();assert(Object.values(action.value.targets).every(v=>v>0&&Number.isFinite(v)),'Targets must be positive minutes.');data.settings=action.value;return data;}
 if(action.type==='CENTRE'){admin();assert(action.value.name.trim()&&action.value.email.includes('@'),'Centre name and valid email are required.');new Intl.DateTimeFormat('en',{timeZone:action.value.timezone});const index=data.centres.findIndex(c=>c.id===action.value.id);if(index<0)data.centres.push(action.value);else data.centres[index]=action.value;return data;}
 if(action.type==='DOCTOR'){admin();assert(action.value.name.trim()&&action.value.email.includes('@'),'Doctor name and valid email are required.');assert(action.value.reviewerId!==action.value.id,'A doctor cannot review their own reports.');const index=data.doctors.findIndex(d=>d.id===action.value.id);const old=index<0?undefined:data.doctors[index];if(action.value.reviewerId&&action.value.reviewerId!==old?.reviewerId)assert(data.doctors.some(d=>d.id===action.value.reviewerId&&d.active),'Choose an active doctor as reviewer.');if(index<0)data.doctors.push(action.value);else data.doctors[index]=action.value;syncPeerAssignments(data,now,user);return data;}
 if(action.type==='SAVE_CASE'){
  assert(user.role==='centre'&&action.value.centreId===user.entityId,'Create cases only for your centre.');assert(data.centres.find(c=>c.id===user.entityId)?.active,'This centre is inactive. Contact Admin.');
  const existing=data.cases.find(c=>c.id===action.value.id);assert(!existing||existing.status==='DRAFT','Only drafts can be edited.');
  const c=action.value;assert(c.patient.trim()&&c.patientRef.trim(),'Patient pseudonym and reference are required.');
  assert(Number.isFinite(new Date(c.scanTakenAt).getTime())&&c.scanTakenAt<=now,'Scan time must be valid and cannot be in the future.');
  if(action.submit){assert(c.age>0&&c.age<=120&&c.gender&&c.referrer.trim()&&c.study&&c.region.trim()&&c.history.trim(),'Complete all patient and scan details.');assert(c.attachments.some(a=>a.kind==='scan')&&c.attachments.some(a=>a.kind==='prescription'),'Complete the scan and prescription uploads.');}
  const next:Case={...c,status:action.submit?'SUBMITTED':'DRAFT',submittedAt:action.submit?now:undefined,audit:[...c.audit,{id:uid(),at:now,actorId:user.id,role:user.role,message:action.submit?'Case submitted by scan centre':'Draft saved'}]};
  if(existing)data.cases[data.cases.indexOf(existing)]=next;else{data.cases.unshift(next);data.nextCase++;}
  if(action.submit)notify('admin','admin-1',`New case ${next.id} awaiting assignment`,next.id);return data;
 }
 const c=data.cases.find(c=>c.id===action.caseId);assert(c,'Case not found.');assert(visibleCases(data,user).some(x=>x.id===c.id),'This case is not available to this persona.');
 const log=(message:string,internal=false,versionId?:string)=>c.audit.push({id:uid(),at:now,actorId:user.id,role:user.role,message,internal,versionId,...(message==='Working note saved'?{privateDoctorId:user.entityId}:{})});
 const doctor=()=>{assert(user.role==='doctor'&&c.doctorId===user.entityId,'Only the assigned doctor can perform this action.');assert(data.doctors.find(d=>d.id===user.entityId)?.active,'Doctor is inactive. Contact Admin.');};
 if(action.type==='ASSIGN'){
  admin();assert(['SUBMITTED','ASSIGNED','IN_PROGRESS'].includes(c.status),'Case is not available for assignment.');assert(canAssign(data,action.doctorId),'Doctor is unavailable or has incomplete mandatory training.');assert(!c.doctorId||action.reason?.trim(),'Give a reason for reassignment.');
  c.doctorId=action.doctorId;c.assignedAt=now;c.startedAt=undefined;c.status='ASSIGNED';log(`Assigned to ${data.doctors.find(d=>d.id===c.doctorId)!.name}${action.reason?`: ${action.reason}`:''}`);notify('doctor',c.doctorId,`New assignment: ${c.id}`,c.id);notify('centre',c.centreId,`${c.id} assigned for reporting`,c.id);
 }else if(action.type==='START'){
  doctor();assert(['ASSIGNED','REVISION_REQUESTED','CORRECTION_IN_PROGRESS'].includes(c.status),'Case cannot be started at this stage.');assert(canAssign(data,user.entityId),'Complete required training before starting reporting.');c.startedAt=now;if(c.status==='ASSIGNED')c.status='IN_PROGRESS';log('Doctor started reporting');notify('admin','admin-1',`Reporting started: ${c.id}`,c.id);
 }else if(action.type==='NOTE'){doctor();assert(['IN_PROGRESS','REVISION_REQUESTED','CORRECTION_IN_PROGRESS'].includes(c.status),'Start reporting before saving notes.');c.workingNote=action.note;log('Working note saved',true);
 }else if(action.type==='REPORT'){
  assert(action.filename.toLowerCase().endsWith('.pdf'),'Choose a PDF report.');
  assert(action.pdfId,'A stored PDF is required.');assert(action.expectedVersionId===c.reports.at(-1)?.id,'The report changed. Reload before uploading another version.');
  if(user.role==='admin'){admin();assert(['AWAITING_REVIEW','CORRECTION_REQUESTED','CORRECTION_IN_PROGRESS','REVISION_REQUESTED'].includes(c.status),'A submitted report or correction is required.');assert(c.doctorId,'Assign a reporting doctor first.');}else{doctor();assert(['IN_PROGRESS','REVISION_REQUESTED','CORRECTION_IN_PROGRESS'].includes(c.status),'Start the assigned case before submitting a report.');assert(c.status!=='CORRECTION_IN_PROGRESS'||c.corrections.some(x=>x.status==='Waiting doctor'),'Admin is handling this correction.');c.doctorSubmittedAt=now;}
  const number=c.reports.length+1,versionId=uid();c.reports.push({id:versionId,number,authorId:user.id,authorRole:user.role,createdAt:now,filename:action.filename,note:action.note,pdfId:action.pdfId,sample:action.sample});c.status='REVIEWER_REQUIRED';c.reviewComment=undefined;c.reviewSource=undefined;log(`V${number} — Uploaded by ${user.name}`,true,versionId);syncPeerAssignments(data,now,user,c.id);if(c.doctorId)notify('doctor',c.doctorId,`V${number} ${c.status==='REVIEWER_REQUIRED'?'saved; reviewer assignment required':'submitted for peer verification'}: ${c.id}`,c.id);
 }else if(action.type==='PEER_VERIFY'||action.type==='PEER_CORRECT'){
  const review=latestReview(c),v=c.reports.at(-1);assert(user.role==='doctor'&&data.doctors.some(d=>d.id===user.entityId&&d.active),'Only an active assigned reviewer can decide.');assert(c.status==='PENDING_PEER_REVIEW'&&review?.status==='Pending'&&review.id===action.reviewId&&v?.id===action.versionId,'This peer-review task is no longer pending.');assert(review.reviewerId===user.entityId&&user.entityId!==c.doctorId&&user.id!==v.authorId,'Only the assigned peer reviewer can decide.');
  if(action.type==='PEER_CORRECT'){
   assert(action.reason.trim(),'A correction reason is required.');review.status='Correction requested';review.reason=action.reason.trim();review.decidedAt=now;c.status='REVISION_REQUESTED';c.reviewComment=review.reason;c.reviewSource=`Peer reviewer · ${user.name}`;log(`V${v.number} — Correction requested by ${user.name}: ${review.reason}`,true,v.id);notify('doctor',c.doctorId!,`Peer correction requested: ${c.id} · V${v.number}`,c.id);
  }else{
   review.status='Verified';review.decidedAt=now;c.status='AWAITING_REVIEW';log(`V${v.number} — Verified by ${user.name}`,true,v.id);log(`V${v.number} — Sent for Admin approval`,true,v.id);notify('admin','admin-1',`Peer-verified report awaiting approval: ${c.id} · V${v.number}`,c.id);notify('doctor',c.doctorId!,`Peer verification complete; pending Admin approval: ${c.id}`,c.id);
  }
 }else if(action.type==='RETURN'){
  admin();assert(c.status==='AWAITING_REVIEW'&&c.doctorId&&c.reports.at(-1)?.id===action.versionId,'Only the current submitted report can be returned.');assert(action.comment.trim(),'Add a revision instruction.');c.reviewComment=action.comment.trim();c.reviewSource='Admin';c.status='REVISION_REQUESTED';log(`V${c.reports.at(-1)!.number} — Admin requested changes: ${c.reviewComment}`,true,action.versionId);notify('doctor',c.doctorId,`Revision requested: ${c.id}`,c.id);
 }else if(action.type==='APPROVE'){
  admin();const review=latestReview(c);assert(c.status==='AWAITING_REVIEW'&&c.reports.at(-1)?.id===action.versionId&&review?.status==='Verified'&&review.decidedAt&&review.reviewerId!==c.doctorId,'The latest report must be peer verified before release.');const correction=c.corrections.find(x=>x.status!=='Resolved');c.approvedAt=now;c.deliveredAt=now;c.deliveries.push({versionId:action.versionId,approvedAt:now,deliveredAt:now,actorId:user.id});c.status=correction?'REDELIVERED':'DELIVERED';if(correction){correction.status='Resolved';correction.resolvedAt=now;}log(`V${c.reports.at(-1)!.number} — Approved by Admin`,true,action.versionId);log(correction?'Corrected report redelivered to centre':'Final report delivered to centre',false,action.versionId);notify('centre',c.centreId,`${correction?'Corrected':'Final'} report ready: ${c.id}`,c.id);if(c.doctorId)notify('doctor',c.doctorId,`Report approved: ${c.id}`,c.id);
 }else if(action.type==='CORRECT'){
  assert(user.role==='centre'&&c.centreId===user.entityId,'Only the originating centre can request correction.');assert(['DELIVERED','REDELIVERED'].includes(c.status),'Corrections require a delivered report.');assert(action.reason.trim()&&action.category,'Select a category and explain the correction.');c.corrections.push({id:uid(),category:action.category,reason:action.reason,requestedAt:now,status:'New',priorVersionId:c.deliveries.at(-1)!.versionId});c.status='CORRECTION_REQUESTED';log(`Correction requested: ${action.category} — ${action.reason}`);notify('admin','admin-1',`Correction requested: ${c.id}`,c.id);
 }else if(action.type==='TAKE_CORRECTION'){
  admin();const correction=c.corrections.find(x=>x.status!=='Resolved');assert(correction&&['CORRECTION_REQUESTED','CORRECTION_IN_PROGRESS'].includes(c.status),'No correction available to take.');correction.status='In progress';c.status='CORRECTION_IN_PROGRESS';log('Admin is handling correction',true);
 }else if(action.type==='ROUTE_CORRECTION'){
  admin();const correction=c.corrections.find(x=>x.status!=='Resolved');assert(correction&&['CORRECTION_REQUESTED','CORRECTION_IN_PROGRESS'].includes(c.status),'No correction available to route.');assert(canAssign(data,action.doctorId),'Doctor is unavailable or training is incomplete.');c.doctorId=action.doctorId;c.status='CORRECTION_IN_PROGRESS';correction.status='Waiting doctor';c.reviewComment=correction.reason;log('Correction routed to assigned doctor');notify('doctor',action.doctorId,`Correction to review: ${c.id}`,c.id);
 }
 return data;
}
