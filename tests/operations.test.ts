import { test } from 'node:test';
import assert from 'node:assert/strict';
import { seed } from '../src/domain/seed';
import { generateSimulation, resetSimulation } from '../src/domain/simulation';
import { isValidMonth, monthDates, operationsTransition } from '../src/domain/operations';
import type { User } from '../src/domain/types';
process.env.NEXT_PUBLIC_APP_ENV='demo';
process.env.NEXT_PUBLIC_DEMO_SIMULATION_ENABLED='true';
const admin:User={id:'admin-1',entityId:'admin-1',name:'Admin',role:'admin',timezone:'Asia/Kolkata'};
test('connected simulation uses /30 payroll, first-delivery invoices, immutable snapshots and safe reset',()=>{
 const original=seed(),result=generateSimulation(original,admin,'2026-09'),d=result.data,op=d.operations!;
 assert.equal(op.attendance.length,90);assert.equal(op.payroll[0].status,'Approved');
 const a=op.payroll[0].lines[0];assert.equal(a.base,2500000);assert.equal(a.dailyRate,83333);assert.equal(a.deduction,166667);assert.equal(a.net,2333333);
 assert(op.leaves.some(l=>l.status==='Rejected'));assert(op.leaves.some(l=>l.status==='Pending'));assert(op.payroll[0].lines.some(l=>l.overtime>0));
 for(const i of op.invoices)assert.equal(i.total,i.lines.length*i.rate);
 const invoice=op.invoices[0],snapshot=structuredClone(invoice);const updated=operationsTransition(d,admin,{type:'RATE',centreId:invoice.centreId,rate:99900});assert.deepEqual(updated.operations!.invoices[0],snapshot);
 const regenerated=operationsTransition(updated,admin,{type:'INVOICES',month:invoice.month});assert.equal(regenerated.operations!.invoices.filter(i=>i.centreId===invoice.centreId&&i.month===invoice.month).length,1);
 assert.throws(()=>operationsTransition(d,{...admin,role:'doctor',entityId:d.doctors[0].id},{type:'PAYROLL',month:'2026-09'}));
 assert.throws(()=>operationsTransition(d,admin,{type:'APPROVE_PAYROLL',id:op.payroll[0].id}));
 const reset=resetSimulation(d,admin,result.batchId).data;assert.deepEqual(reset.cases,original.cases);assert.deepEqual(reset.doctors,original.doctors);assert.deepEqual(reset.centres,original.centres);assert.equal(reset.operations!.invoices.length,0);
 process.env.NEXT_PUBLIC_APP_ENV='production';assert.throws(()=>generateSimulation(original,admin,'2026-09'));process.env.NEXT_PUBLIC_APP_ENV='demo';
});

test('month validation rejects incomplete input and preserves leap-year dates',()=>{for(const value of ['',undefined,'2026-1','2026-13','12026-11','0000-01'])assert.equal(isValidMonth(value),false);assert.equal(monthDates('2026-02').length,28);assert.equal(monthDates('2024-02').length,29);assert.throws(()=>monthDates('2026-13'));});
