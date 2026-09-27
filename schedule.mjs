import {dateKey} from './planner.mjs';
const loading=s=>['strength','mat'].includes(s.type);
export function checkSchedule(sessions,moves,startDate){
  const days=Array.from({length:7},(_,i)=>dateKey(new Date(startDate+'T12:00:00'),i));
  if(!moves || typeof moves!=='object' || Array.isArray(moves))return {status:'error',message:'저장된 날짜를 읽을 수 없어요.'};
  const keys=new Set(sessions.map(s=>s.date));
  if(Object.keys(moves).some(key=>!keys.has(key)))return {status:'error',message:'현재 계획에 없는 운동 날짜예요.'};
  const next=sessions.map(s=>({...s,originalDate:s.date,date:moves[s.date]||s.date}));
  if(next.some(s=>!days.includes(s.date)))return {status:'error',message:'이번 7일 안의 날짜를 골라 주세요.'};
  if(new Set(next.map(s=>s.date)).size!==next.length)return {status:'error',message:'그날에는 다른 운동이 있어요. 비어 있는 날을 골라 주세요.'};
  const strength=next.filter(loading);
  for(const a of strength)for(const b of strength)if(a!==b){
    const gap=Math.abs(days.indexOf(a.date)-days.indexOf(b.date));
    if(Math.min(gap,7-gap)<=1)return {status:'error',message:'근력·매트 운동 사이에 하루를 비워 주세요. 다음 주에 반복할 때의 회복 간격도 확인해요.'};
  }
  const running=next.filter(s=>s.needsRunRecovery);
  for(const a of running)for(const b of running)if(a!==b){
    const gap=Math.abs(days.indexOf(a.date)-days.indexOf(b.date));
    if(Math.min(gap,7-gap)<=1)return {status:'error',message:'처음·복귀 러닝 사이에는 하루를 비워 주세요. 다른 빈 날짜를 골라 주세요.'};
  }
  return {status:'ok',sessions:next.sort((a,b)=>a.date.localeCompare(b.date)),moves:Object.fromEntries(Object.entries(moves).filter(([key,value])=>key!==value))};
}
export function moveSession(sessions,moves,startDate,originalDate,targetDate,today=dateKey(new Date())){
  if(!sessions.some(s=>s.date===originalDate))return {status:'error',message:'변경할 운동을 찾지 못했어요.'};
  if(typeof targetDate!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(targetDate)||targetDate<today)return {status:'error',message:'오늘 이후의 날짜를 골라 주세요.'};
  return checkSchedule(sessions,{...moves,[originalDate]:targetDate},startDate);
}
