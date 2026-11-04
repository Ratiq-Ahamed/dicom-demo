import { Application } from '@/components/application';
import { Suspense } from 'react';
export default function Page(){return <Suspense fallback={<div className="loading">Preparing DICOM workspace…</div>}><Application/></Suspense>;}
