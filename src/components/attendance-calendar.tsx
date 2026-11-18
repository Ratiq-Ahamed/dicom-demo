'use client';

interface CalendarEntry { date:string; label:string; late?:boolean; overtimeMinutes?:number; finalized?:boolean }
const colors:Record<string,string>={Present:'#eef9f3',Absent:'#fff1f2','Half-Day':'#fff8e8','Approved Leave':'#f1eeff','Weekly Off':'#f0f3f7',Holiday:'#f0f3f7','Pending Permission':'#fff8e8'};

/** Native table layout and inline essentials keep the calendar usable without CSS. */
export function AttendanceCalendar({entries,onSelect,readOnly}:{entries:CalendarEntry[];onSelect:(date:string)=>void;readOnly:boolean}){
 const leading=entries.length?new Date(entries[0].date+'T12:00:00Z').getUTCDay():0;
 const cells:(CalendarEntry|null)[]=[...Array.from({length:leading},()=>null),...entries];
 while(cells.length%7)cells.push(null);
 return <table className="attendance-calendar-table" aria-label="Monthly attendance calendar" style={{width:'100%',tableLayout:'fixed',borderCollapse:'separate',borderSpacing:4,marginTop:20}}>
  <thead><tr>{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(day=><th key={day} scope="col" style={{textAlign:'center',padding:'8px 2px',fontSize:11,color:'#7889a3',background:'transparent'}}>{day}</th>)}</tr></thead>
  <tbody>{Array.from({length:cells.length/7},(_,week)=><tr key={week}>{cells.slice(week*7,week*7+7).map((entry,column)=><td key={column} style={{padding:0,border:0,verticalAlign:'top',background:'transparent'}}>{entry&&<button type="button" className="calendar-date" disabled={readOnly} aria-label={entry.date+' '+entry.label} onClick={()=>onSelect(entry.date)} style={{display:'flex',flexDirection:'column',gap:5,alignItems:'flex-start',textAlign:'left',width:'100%',minWidth:0,minHeight:108,padding:'clamp(4px, .8vw, 12px)',border:'1px solid #dce5f1',borderRadius:8,background:colors[entry.label]??'#fbfdff',color:'#132854',opacity:1,cursor:readOnly?'default':'pointer',overflowWrap:'anywhere'}}><strong style={{display:'block',fontSize:14}}>{Number(entry.date.slice(-2))}</strong><span style={{display:'block',fontSize:'clamp(9px, .85vw, 12px)',lineHeight:1.4}}>{entry.label}</span>{entry.late&&<small style={{display:'block',fontSize:9}}>Late</small>}{!!entry.overtimeMinutes&&<small style={{display:'block',fontSize:9}}>OT {entry.overtimeMinutes} min</small>}{entry.finalized&&<small style={{display:'block',fontSize:9}}>Finalized</small>}</button>}</td>)}</tr>)}</tbody>
 </table>;
}
