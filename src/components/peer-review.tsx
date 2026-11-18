'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Check, ArrowRight, Search } from 'lucide-react';
import type { Case, Doctor } from '@/domain/types';
import { formatTime, latestReview, peerCases } from '@/domain/workflow';
import { useDemo } from '@/store/demo';
import { Badge, Card, Empty } from './ui';

export function PeerReviews() {
  const { data, user } = useDemo();
  const [tab, setTab] = useState('Pending');
  const [search, setSearch] = useState('');
  if (!data || !user || user.role !== 'doctor') return null;
  const rows = peerCases(data, user.entityId).flatMap(c => (c.peerReviews ?? [])
    .filter(r => r.reviewerId === user.entityId && r.status !== 'Superseded')
    .map(r => ({ c, r, v: c.reports.find(v => v.id === r.versionId)! })))
    .filter(({ c, r }) => (tab === 'All' || r.status === tab) &&
      `${c.id} ${c.patient} ${c.patientRef} ${data.doctors.find(d => d.id === c.doctorId)?.name}`.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.r.submittedAt.localeCompare(a.r.submittedAt));
  return <><div className="page-heading"><div><div className="eyebrow">DOCTOR WORKSPACE</div><h1>Peer Reviews</h1><p>Verify your colleagues’ reports before they reach Admin approval.</p></div></div><Card>
    <div className="search-box"><Search size={17}/><input aria-label="Search peer reviews" placeholder="Search case, patient or reporting doctor" value={search} onChange={e => setSearch(e.target.value)}/></div>
    <div className="tabs peer-tabs">{['Pending', 'Verified', 'Correction requested', 'All'].map(t => <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>{t}</button>)}</div>
    {!rows.length ? <Empty title="No peer reviews in this view" text="Reports mapped to you will appear here when submitted."/> : <>
      <div className="table-desktop"><table><thead><tr><th>Case / Patient</th><th>Reporting doctor</th><th>Report</th><th>Submitted</th><th>Review status</th><th>Action</th></tr></thead><tbody>{rows.map(({ c, r, v }) => <tr key={r.id}><td><Link className="case-link" href={'/doctor/cases/' + c.id + '?version=' + v.id}>{c.id}</Link><small>{c.patient} · {c.patientRef}</small></td><td>{data.doctors.find(d => d.id === c.doctorId)?.name}</td><td>V{v.number}<small>{v.authorRole === 'admin' ? 'Admin revision' : 'Doctor report'}</small></td><td>{formatTime(v.createdAt, user.timezone)}</td><td><Badge status={r.status === 'Pending' ? 'PENDING_PEER_REVIEW' : r.status === 'Verified' ? 'DELIVERED' : 'REVISION_REQUESTED'}>{r.status}</Badge></td><td><Link className="row-action" href={'/doctor/cases/' + c.id + '?version=' + v.id}>Open report <ArrowRight size={14}/></Link></td></tr>)}</tbody></table></div>
      <div className="mobile-cases">{rows.map(({ c, r, v }) => <Link className="mobile-case" key={r.id} href={'/doctor/cases/' + c.id + '?version=' + v.id}><div><strong>{c.id} · V{v.number}</strong><Badge status={r.status === 'Pending' ? 'PENDING_PEER_REVIEW' : 'DELIVERED'}>{r.status}</Badge></div><h3>{c.patient}</h3><p>{data.doctors.find(d => d.id === c.doctorId)?.name}<br/>{formatTime(v.createdAt, user.timezone)}</p><span>Open report →</span></Link>)}</div>
    </>}
  </Card></>;
}

export function WorkflowProgress({ c, doctors }: { c: Case; doctors: Doctor[] }) {
  const v = c.reports.at(-1), review = latestReview(c);
  const delivery = c.deliveries.find(d => d.versionId === v?.id);
  const correcting = ['REVISION_REQUESTED', 'CORRECTION_REQUESTED', 'CORRECTION_IN_PROGRESS'].includes(c.status);
  const stage = !c.doctorId ? 0 : correcting ? 1 : delivery ? 5 : review?.status === 'Verified' ? 3 : v ? 2 : 1;
  const name = (id?: string) => doctors.find(d => d.id === id)?.name ?? 'Assignment required';
  const steps = [
    ['Case Assigned', c.doctorId ? name(c.doctorId) : 'Awaiting Admin'],
    ['Report Uploaded', correcting ? 'Correction required · upload next version' : v ? 'V' + v.number + ' · ' + (v.authorRole === 'admin' ? 'Admin' : name(v.authorId)) : 'Prepare and upload PDF'],
    ['Peer Review', c.status === 'REVIEWER_REQUIRED' ? 'Reviewer assignment required' : review?.reviewerId ? name(review.reviewerId) : 'Awaiting report'],
    ['Admin Approval', stage >= 5 ? 'Approved & released' : 'Final approval by Admin'],
    ['Report Released', delivery && !correcting ? 'Available to originating centre' : 'Available after approval'],
  ];
  return <Card title="Reporting workflow"><ol className="workflow-stepper">{steps.map(([label, detail], i) => <li key={label} className={i < stage ? 'complete' : i === stage ? 'current' : ''} aria-current={i === stage ? 'step' : undefined}><span>{i < stage ? <Check size={15}/> : i + 1}</span><div><strong>{label}</strong><small>{detail}</small></div></li>)}</ol></Card>;
}

export function ReportHistory({ c, doctors, timezone }: { c: Case; doctors: Doctor[]; timezone: string }) {
  return <Card title="Report & review history"><div className="report-history">{c.reports.slice().reverse().map(v => <section key={v.id}><div className="report-history-heading"><strong>V{v.number} · {v.filename}</strong><span>{v.authorRole === 'admin' ? 'Admin' : doctors.find(d => d.id === v.authorId)?.name}</span></div><small>Uploaded {formatTime(v.createdAt, timezone)}</small>{v.legacy && <p className="muted">Legacy sample · original PDF bytes were not stored.</p>}{(c.peerReviews ?? []).filter(r => r.versionId === v.id).map(r => <div className="review-record" key={r.id}><Badge status={r.status === 'Verified' ? 'DELIVERED' : r.status === 'Correction requested' ? 'REVISION_REQUESTED' : 'PENDING_PEER_REVIEW'}>{r.status}</Badge><span>{doctors.find(d => d.id === r.reviewerId)?.name ?? 'Reviewer assignment required'}</span><small>{formatTime(r.decidedAt ?? r.submittedAt, timezone)}</small>{r.reason && <p>{r.reason}</p>}</div>)}{c.audit.filter(a => a.versionId === v.id && /Admin requested changes|Approved by Admin|Sent for Admin approval/.test(a.message)).map(a => <p className="muted" key={a.id}>{a.message} · {formatTime(a.at, timezone)}</p>)}</section>)}</div></Card>;
}
