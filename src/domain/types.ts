export type Role = 'centre' | 'admin' | 'doctor';
export type Status = 'DRAFT' | 'SUBMITTED' | 'ASSIGNED' | 'IN_PROGRESS' | 'REVIEWER_REQUIRED' | 'PENDING_PEER_REVIEW' | 'AWAITING_REVIEW' | 'DELIVERED' | 'REVISION_REQUESTED' | 'CORRECTION_REQUESTED' | 'CORRECTION_IN_PROGRESS' | 'REDELIVERED';
export type Priority = 'Normal' | 'Urgent' | 'STAT';
export interface User { id: string; role: Role; name: string; timezone: string; entityId: string }
export interface Centre { id: string; name: string; city: string; country_code: string; timezone: string; email: string; contact: string; active: boolean; international?: boolean }
export interface Doctor { id: string; name: string; speciality: string; email: string; availability: 'Available' | 'Busy' | 'Offline'; active: boolean; reviewerId?: string }
export interface Attachment { id: string; name: string; kind: 'scan' | 'prescription' | 'voice' | 'report'; sizeMB: number; simulated: true; duration?: number }
export interface ReportVersion { id: string; number: number; authorId: string; authorRole: Role; createdAt: string; filename: string; note: string; pdfId?: string; sample?: boolean; legacy?: boolean }
export interface PeerReview { id: string; versionId: string; reviewerId?: string; submittedAt: string; status: 'Waiting assignment' | 'Pending' | 'Verified' | 'Correction requested' | 'Superseded'; decidedAt?: string; reason?: string }
export interface Delivery { versionId: string; approvedAt: string; deliveredAt: string; actorId: string }
export interface Correction { id: string; category: string; reason: string; requestedAt: string; status: 'New' | 'In progress' | 'Waiting doctor' | 'Resolved'; resolvedAt?: string; priorVersionId: string }
export interface AuditEvent { id: string; at: string; actorId: string; role: Role; message: string; internal?: boolean; versionId?: string; privateDoctorId?: string }
export interface Case {
  id: string; centreId: string; patient: string; patientRef: string; age: number; gender: string; referrer: string; study: string; region: string; history: string; priority: Priority; notes: string;
  scanTakenAt: string; submittedAt?: string; assignedAt?: string; startedAt?: string; doctorSubmittedAt?: string; approvedAt?: string; deliveredAt?: string;
  doctorId?: string; status: Status; attachments: Attachment[]; reports: ReportVersion[]; deliveries: Delivery[]; corrections: Correction[]; audit: AuditEvent[]; peerReviews?: PeerReview[]; reviewComment?: string; reviewSource?: string; workingNote?: string;
}
export interface TrainingModule { id: string; title: string; category: string; duration: number; description: string }
export interface TrainingProgress { doctorId: string; moduleId: string; intervals: [number, number][]; position: number; updatedAt: string }
export interface Notification { id: string; role: Role; entityId: string; title: string; caseId?: string; at: string; read: boolean }
export interface Settings { requireTraining: boolean; targets: Record<Priority, number>; voiceExpiry: 'After approval' | 'After redelivery' | 'Pending scope confirmation' }
export interface DemoData { schemaVersion: number; anchor: string; centres: Centre[]; doctors: Doctor[]; cases: Case[]; modules: TrainingModule[]; training: TrainingProgress[]; notifications: Notification[]; settings: Settings; nextCase: number }
export type Action =
  | { type: 'SAVE_CASE'; value: Case; submit: boolean }
  | { type: 'ASSIGN'; caseId: string; doctorId: string; reason?: string }
  | { type: 'START'; caseId: string }
  | { type: 'NOTE'; caseId: string; note: string }
  | { type: 'REPORT'; caseId: string; filename: string; note: string; pdfId: string; sample?: boolean; expectedVersionId?: string }
  | { type: 'PEER_VERIFY'; caseId: string; versionId: string; reviewId: string }
  | { type: 'PEER_CORRECT'; caseId: string; versionId: string; reviewId: string; reason: string }
  | { type: 'RETURN'; caseId: string; versionId: string; comment: string }
  | { type: 'APPROVE'; caseId: string; versionId: string }
  | { type: 'CORRECT'; caseId: string; category: string; reason: string }
  | { type: 'ROUTE_CORRECTION'; caseId: string; doctorId: string }
  | { type: 'TAKE_CORRECTION'; caseId: string }
  | { type: 'TRAIN'; moduleId: string; from: number; to: number; position: number }
  | { type: 'READ'; notificationId?: string }
  | { type: 'CENTRE'; value: Centre }
  | { type: 'DOCTOR'; value: Doctor }
  | { type: 'SETTINGS'; value: Settings };
