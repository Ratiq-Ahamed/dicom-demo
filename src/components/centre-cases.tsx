'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Download, Search } from 'lucide-react';
import type { CentreCaseView, CentreCategory } from '@/domain/types';
import { centreCases } from '@/domain/presentation';
import { formatTime } from '@/domain/workflow';
import { useDemo } from '@/store/demo';
import { downloadReport } from '@/lib/download';
import { Badge, Card, Empty, Field, Modal, PDFPreview, VoicePlayer } from './ui';

export function CentreCaseTable({ cases, compact = false, searched = false }: { cases: CentreCaseView[]; compact?: boolean; searched?: boolean }) {
  const user = useDemo(s => s.user);
  const [page, setPage] = useState(0);
  const sorted = [...cases].sort((a, b) => (b.submittedAt ?? '').localeCompare(a.submittedAt ?? ''));
  const safePage = Math.min(page, Math.max(0, Math.ceil(sorted.length / 8) - 1));
  const rows = compact ? sorted.slice(0, 5) : sorted.slice(safePage * 8, safePage * 8 + 8);
  if (!rows.length) return <Empty title={searched ? 'No matching cases' : 'No cases in this category'} text={searched ? 'Try a different case ID or patient reference.' : 'Your cases will appear here after you submit them.'}/>;
  const href = (c: CentreCaseView) => '/centre/cases/' + c.id;
  return <><div className="table-desktop"><table><thead><tr><th>Case / Patient</th><th>Study</th><th>Submitted</th><th>Category</th><th>Action</th></tr></thead><tbody>{rows.map(c => <tr key={c.id}><td><Link className="case-link" href={href(c)}>{c.id}</Link><small>{c.patient} · {c.patientRef}</small></td><td>{c.study}</td><td>{c.submittedAt ? formatTime(c.submittedAt, user?.timezone) : 'Not yet submitted'}</td><td><Badge status={c.category}/></td><td><Link className="row-action" href={href(c)}>{c.canEditDraft ? 'Continue' : c.category === 'Received' ? 'Open report' : 'View'} <ArrowRight size={13}/></Link></td></tr>)}</tbody></table></div>
    <div className="mobile-cases">{rows.map(c => <Link className="mobile-case" href={href(c)} key={c.id}><div><strong>{c.id}</strong><Badge status={c.category}/></div><h3>{c.patient}</h3><p>{c.patientRef} · {c.study}</p><div><small>{c.submittedAt ? formatTime(c.submittedAt, user?.timezone) : 'Not yet submitted'}</small><ArrowRight size={17}/></div></Link>)}</div>
    {!compact && sorted.length > 8 && <div className="pagination"><span>{safePage * 8 + 1}–{Math.min(safePage * 8 + 8, sorted.length)} of {sorted.length}</span><button className="icon-btn" aria-label="Previous cases" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}><ChevronLeft size={17}/></button><button className="icon-btn" aria-label="Next cases" disabled={(safePage + 1) * 8 >= sorted.length} onClick={() => setPage(safePage + 1)}><ChevronRight size={17}/></button></div>}
  </>;
}

export function CentreCaseList() {
  const { data, user } = useDemo();
  const params = useSearchParams();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<CentreCategory>(params.get('status') === 'Received' ? 'Received' : 'Pending');
  if (!data || !user) return <Card><p>Loading your cases…</p></Card>;
  const all = centreCases(data, user);
  const filtered = all.filter(c => c.category === category && `${c.id} ${c.patient} ${c.patientRef} ${c.study}`.toLowerCase().includes(search.toLowerCase()));
  return <><div className="page-heading"><div><h1>My Cases</h1><p>Your submissions and available reports.</p></div><Link className="btn primary" href="/centre/new">+ New Case</Link></div><Card>
    <div className="tabs category-tabs">{(['Pending', 'Received'] as const).map(value => <button key={value} className={category === value ? 'active' : ''} onClick={() => setCategory(value)}>{value}<span>{all.filter(c => c.category === value).length}</span></button>)}</div>
    <div className="search-box queue-search"><Search size={17}/><input aria-label="Search cases" placeholder="Search case or patient" value={search} onChange={e => setSearch(e.target.value)}/></div>
    <CentreCaseTable cases={filtered} searched={!!search}/>
  </Card></>;
}

export function CentreCaseDetail({ id }: { id: string }) {
  const { data, user, act, message } = useDemo();
  const [correction, setCorrection] = useState(false);
  const [reason, setReason] = useState('');
  const [category, setCategory] = useState('Patient details');
  const [attachment, setAttachment] = useState('');
  if (!data || !user) return <Card><p>Loading your case…</p></Card>;
  const c = centreCases(data, user).find(c => c.id === id);
  if (!c) return <Empty title="Case unavailable" text="This case is not available to your centre."/>;
  const finalReport = c.reports.at(-1);
  return <><Link className="back-link" href={'/centre/cases?status=' + c.category}><ArrowLeft size={15}/> Back to cases</Link>
    <div className="page-heading"><div><h1>{c.id}</h1><p>{c.patient} · {c.study}</p></div><div className="heading-actions"><Badge status={c.category}/>{c.canEditDraft && <Link className="btn primary" href={'/centre/new?draft=' + c.id}>Continue draft</Link>}</div></div>
    <Card title="Patient & study"><dl className="simple-case-summary"><div><dt>Patient</dt><dd>{c.patient} · {c.patientRef}</dd></div><div><dt>Age / Gender</dt><dd>{c.age} / {c.gender}</dd></div><div><dt>Study / Region</dt><dd>{c.study} / {c.region}</dd></div><div><dt>Referring doctor</dt><dd>{c.referrer}</dd></div><div><dt>Submitted</dt><dd>{c.submittedAt ? formatTime(c.submittedAt, user.timezone) : 'Not yet submitted'}</dd></div></dl><details className="disclosure"><summary>Submitted details & attachments</summary><p>{c.history}</p>{c.notes && <p>{c.notes}</p>}{c.attachments.map(a => <div className="attachment" key={a.id}><div><strong>{a.name}</strong><small>{a.sizeMB} MB</small></div><button className="btn subtle" onClick={() => setAttachment(a.kind)}>View</button></div>)}</details></Card>
    {finalReport ? <Card title="Final report"><PDFPreview c={c} versions={[finalReport]} audience="centre"/><div className="report-actions"><button className="btn primary" onClick={() => { downloadReport(c, finalReport).catch(e => message(e.message)); }}><Download size={17}/> Download final report</button>{c.canRequestCorrection && <button className="btn" onClick={() => setCorrection(true)}>Request Correction</button>}</div>{c.correctionSent && <p className="muted">Your correction request has been sent. Your available report remains accessible.</p>}{c.reports.length > 1 && <details className="disclosure"><summary>Previous reports</summary><PDFPreview c={c} versions={c.reports.slice(0, -1)} audience="centre"/></details>}</Card> : <Card title="Report"><Empty title="Pending" text="Your final report will appear here when it is available."/></Card>}
    <Modal open={correction} onClose={() => setCorrection(false)} title="Request a correction" description="Tell us what needs to be corrected."><Field label="Category"><select value={category} onChange={e => setCategory(e.target.value)}>{['Patient details', 'Referrer details', 'Report clarification', 'Missing information', 'Other'].map(value => <option key={value}>{value}</option>)}</select></Field><Field label="Explanation" required><textarea value={reason} onChange={e => setReason(e.target.value)}/></Field><div className="modal-actions"><button className="btn" onClick={() => setCorrection(false)}>Cancel</button><button className="btn primary" disabled={!reason.trim()} onClick={() => { if (act({ type: 'CORRECT', caseId: c.id, category, reason })) { setCorrection(false); setReason(''); message('Your correction request has been sent.'); } }}>Submit correction</button></div></Modal>
    <Modal open={!!attachment} onClose={() => setAttachment('')} title="Submitted attachment">{attachment === 'voice' ? <VoicePlayer/> : <><p>{c.attachments.find(a => a.kind === attachment)?.name}</p><p>{attachment === 'prescription' ? c.history : 'This demo represents the submitted study with sample attachment information.'}</p></>}</Modal>
  </>;
}
