import type { Case, CentreCaseView, DemoData, User } from './types';
import { centreStatus, latestReview, peerCases, reportingCases, visibleCases } from './workflow';

/** Centre screens consume this allowlist, never a full internal case. */
export function centreCases(data: DemoData, user: User): CentreCaseView[] {
  if (user.role !== 'centre') return [];
  return data.cases.filter(c => c.centreId === user.entityId).map(c => ({
    id: c.id, patient: c.patient, patientRef: c.patientRef, age: c.age, gender: c.gender,
    study: c.study, region: c.region, history: c.history, referrer: c.referrer,
    notes: c.notes, scanTakenAt: c.scanTakenAt, submittedAt: c.submittedAt,
    category: centreStatus(c), attachments: structuredClone(c.attachments),
    canEditDraft: c.status === 'DRAFT', canRequestCorrection: ['DELIVERED', 'REDELIVERED'].includes(c.status),
    correctionSent: c.corrections.some(r => r.status !== 'Resolved'),
    reports: c.deliveries.flatMap(d => {
      const v = c.reports.find(v => v.id === d.versionId);
      return v ? [{ id: v.id, number: v.number, filename: v.filename, createdAt: v.createdAt,
        pdfId: v.pdfId, sample: v.sample, legacy: v.legacy, releasedAt: d.deliveredAt }] : [];
    }),
  }));
}

export function needsAttention(c: Case) {
  return c.status === 'REVIEWER_REQUIRED' || c.status === 'REVISION_REQUESTED' || c.corrections.some(r => r.status !== 'Resolved');
}
export function matchesTask(c: Case, task: string) {
  if (task === 'All') return true;
  if (task === 'assignment') return c.status === 'SUBMITTED';
  if (task === 'approval') return c.status === 'AWAITING_REVIEW' && latestReview(c)?.status === 'Verified';
  if (task === 'attention') return needsAttention(c);
  if (task === 'active') return ['ASSIGNED', 'IN_PROGRESS', 'REVISION_REQUESTED'].includes(c.status) || c.status === 'CORRECTION_IN_PROGRESS' && c.corrections.some(r => r.status === 'Waiting doctor');
  if (task === 'submitted') return c.reports.length > 0;
  return c.status === task;
}
/** Operational queues deliberately have no rolling date cutoff. */
export function dashboardCases(data: DemoData, user: User) {
  return user.role === 'doctor' ? reportingCases(data, user.entityId) : visibleCases(data, user);
}
export function pendingPeerCases(data: DemoData, id: string) {
  return peerCases(data, id).filter(c => c.status === 'PENDING_PEER_REVIEW' && latestReview(c)?.reviewerId === id);
}
export function visibleNotifications(data: DemoData, user: User) {
  const own = data.notifications.filter(n => n.role === user.role && n.entityId === user.entityId);
  if (user.role !== 'centre') return own;
  const caseIds = new Set(centreCases(data, user).map(c => c.id));
  return own.filter(n => n.caseId && caseIds.has(n.caseId) && /^(Final|Corrected) report ready:/.test(n.title))
    .map(n => ({ ...n, title: `Report available: ${n.caseId}` }));
}
