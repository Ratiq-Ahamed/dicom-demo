import type { Invoice, Payroll, PayrollLine } from '@/domain/operations';
import { money } from '@/domain/operations';

export async function invoicePDF(i:Invoice){
 const {jsPDF}=await import('jspdf');const pdf=new jsPDF();let y=20;
 const row=(text:string,bold=false)=>{if(y>270){pdf.addPage();y=20;}pdf.setFont('helvetica',bold?'bold':'normal');pdf.setFontSize(bold?13:10);pdf.text(pdf.splitTextToSize(text,178),16,y);y+=bold?11:8;};
 row('DICOM Reporting Services - INVOICE',true);row('SYNTHETIC DEMO DOCUMENT');row(i.number,true);row(i.centreName);row('Billing period: '+i.periodStart+' through '+new Date(new Date(i.periodEnd).getTime()-86400000).toISOString().slice(0,10));row('Generated: '+i.generatedAt.slice(0,10)+' | Due: '+i.dueDate);row('Case / Study / First delivery / Unit rate',true);
 for(const l of i.lines)row(`${l.caseId} | ${l.study} | ${l.deliveredAt.slice(0,10)} | INR ${(l.rate/100).toFixed(2)}`);
 row('Billable scans: '+i.lines.length,true);row('Per-scan rate: INR '+(i.rate/100).toFixed(2));row('TOTAL: INR '+(i.total/100).toFixed(2),true);row('First approved case deliveries only. Corrections are not charged again.');return pdf.output('blob');
}
export async function payslipPDF(p:Payroll,l:PayrollLine){
 const {jsPDF}=await import('jspdf');const pdf=new jsPDF();pdf.setFontSize(17);pdf.text('DICOM - Doctor Payslip',18,22);pdf.setFontSize(10);const lines=['SYNTHETIC DEMO DOCUMENT',l.name,`Month: ${p.month} | Revision: ${p.revision}`,`Approved: ${p.approvedAt??'Draft'}`,'',`Base salary: INR ${(l.base/100).toFixed(2)}`,`Daily rate (fixed divisor 30): INR ${(l.dailyRate/100).toFixed(2)}`,`Present: ${l.present} | Absent: ${l.absent} | Half-days: ${l.halfDays}`,`Paid leave: ${l.paidLeave} | Unpaid leave: ${l.unpaidLeave}`,`Deduction: INR ${(l.deduction/100).toFixed(2)}`,`Approved overtime: INR ${(l.overtime/100).toFixed(2)}`,`Adjustments: INR ${(l.adjustments/100).toFixed(2)}`,`Adjustment reason: ${l.adjustmentReason||'None'}`,'',`NET PAYABLE: INR ${(l.net/100).toFixed(2)}`,'',`Unpaid deduction = base / 30 x unpaid day equivalents.`, 'Amounts rounded to paise on the total deduction.'];pdf.text(lines,18,37);return pdf.output('blob');
}
