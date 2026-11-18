import type { DemoData } from './types';
import { syncPeerAssignments } from './workflow';

/** Preserve legacy deliveries, but never invent verification for old reports. */
export function migrateData(input: DemoData): DemoData {
  if (input.schemaVersion === 2) return input;
  if (input.schemaVersion !== 1) throw new Error('Unsupported saved demo version.');
  const data = structuredClone(input);
  for (const c of data.cases) {
    c.peerReviews = [];
    c.reports = c.reports.map(v => ({ ...v, legacy: true, sample: true }));
    if (c.status === 'AWAITING_REVIEW') c.status = 'REVIEWER_REQUIRED';
    for (const event of c.audit) {
      if (event.message === 'Working note saved') event.privateDoctorId = c.doctorId;
    }
  }
  syncPeerAssignments(data, new Date().toISOString(), {
    id: 'admin-1', entityId: 'admin-1', role: 'admin', name: 'Demo migration', timezone: 'Asia/Kolkata',
  });
  data.schemaVersion = 2;
  return data;
}
