import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
const root=existsSync(new URL('./dist/planner.mjs',import.meta.url))?'./dist/':'./';
const {makePlan,dateKey}=await import(root+'planner.mjs');
const {checkSchedule,moveSession}=await import(root+'schedule.mjs');
const {packState,unpackState}=await import(root+'storage.mjs');
const base={age:30,height:170,weight:75,days:3,minutes:30,budget:0,modes:['bodyweight','running'],goal:'habit',experience:'new',walking:'comfortable',pushups:'unknown',risk:false};
const start='2026-09-28',today=start,plan=makePlan(base,new Date(start+'T12:00:00'));
const sessions=plan.sessions;
assert.equal(moveSession(sessions,{},start,sessions[0].date,'2026-09-29',today).status,'ok');
assert.equal(moveSession(sessions,{},start,sessions[0].date,sessions[1].date,today).status,'error');
assert.equal(moveSession(sessions,{},start,sessions[0].date,'2026-10-01',today).status,'error');
assert.equal(moveSession(sessions,{},start,sessions[0].date,'2026-10-04',today).status,'ok');
assert.equal(moveSession(sessions,{},start,sessions[0].date,'2026-10-05',today).status,'error');
assert.equal(moveSession(sessions,{},start,sessions[0].date,'2026-09-27',today).status,'error');
assert.equal(checkSchedule(sessions,{'bad-key':today},start).status,'error');
assert.equal(checkSchedule(sessions,null,start).status,'error');
let moves=moveSession(sessions,{},start,sessions[0].date,'2026-09-29',today).moves;
assert.equal(moveSession(sessions,moves,start,sessions[2].date,'2026-09-30',today).status,'error');
assert.equal(moveSession(sessions,moves,start,sessions[2].date,'2026-10-04',today).status,'ok');
const now=Date.parse('2026-09-28T00:00:00Z');
const state=unpackState(packState(base,new Set(['2026-09-29']),start,now,['2026-09-29'],moves),now);
assert.deepEqual(state.moves,moves);assert.deepEqual(state.completed,['2026-09-29']);assert.deepEqual(state.shortened,['2026-09-29']);
assert.equal(checkSchedule(sessions,state.moves,start).status,'ok');
const runPlan=makePlan({...base,modes:['running']},new Date(start+'T12:00:00'));
assert.equal(moveSession(runPlan.sessions,{},start,runPlan.sessions[0].date,'2026-09-29',today).status,'error');
assert.equal(moveSession(runPlan.sessions,{},start,runPlan.sessions[2].date,'2026-10-04',today).status,'error');
let count=0;
for(const modes of [['bodyweight','running'],['running'],['pilates']])for(const age of [30,69])for(const days of [1,2,3,4,5,6,7]){
 const p=makePlan({...base,modes,age,balance:'clear',days},new Date(start+'T12:00:00'));
 for(const s of p.sessions)for(let target=0;target<7;target++){
  const moved=moveSession(p.sessions,{},start,s.date,dateKey(new Date(start+'T12:00:00'),target),today);
  if(moved.status==='ok'){
   assert.equal(new Set(moved.sessions.map(x=>x.date)).size,p.sessions.length);
   assert.equal(moved.sessions.reduce((sum,x)=>sum+x.minutes,0),p.total);
   const loading=moved.sessions.filter(x=>['strength','mat'].includes(x.type));
   for(const a of loading)for(const b of loading)if(a!==b){const gap=Math.abs((new Date(a.date)-new Date(b.date))/86400000);assert.ok(Math.min(gap,7-gap)>1);}
   const running=moved.sessions.filter(x=>x.needsRunRecovery);
   for(const a of running)for(const b of running)if(a!==b){const gap=Math.abs((new Date(a.date)-new Date(b.date))/86400000);assert.ok(Math.min(gap,7-gap)>1);}
  }
  count++;
 }
}
console.log(`${count}개 날짜 변경 시도: 중복·회복 간격·범위·시간 보존·저장 복원 통과.`);
