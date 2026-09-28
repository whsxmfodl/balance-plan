// Deterministic fictional profiles for software QA. These are not people or outcome data.
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {makePlan, estimateTimeline} from './dist/planner.mjs';
import {dayMealPlan, mealOptions, assessMeal} from './dist/meal.mjs';
import {FOODS} from './dist/food-data.mjs';
import {sumPortions} from './dist/food-search.mjs';

let seed = 20260928;
const random = () => ((seed = (1664525 * seed + 1013904223) >>> 0) / 4294967296);
const pick = values => values[Math.floor(random() * values.length)];
const modes = ['gym','bodyweight','pilates','running','hiking'];
const date = new Date('2026-09-28T12:00:00');
const counts = {total:0,ok:0,caution:0,error:0,older:0,highRisk:0,optionalBodyUnknown:0,sexParityChecked:0,mealChecks:0,foodChecks:0};
const statusByGoal = {}, statusByAge = {}, issues = {}, examples = {};
function issue(code, data) {
  issues[code] = (issues[code] || 0) + 1;
  (examples[code] ||= []);
  if (examples[code].length < 5) examples[code].push(data);
}
function profileFor(index) {
  const age=pick([18,19,25,32,44,55,64,65,66,75,85,100]);
  const height=pick([145,155,165,175,185,195]);
  const bmi=pick([17.5,18.4,18.5,20,23,27,32,38,45]);
  const weight=Number((bmi*(height/100)**2).toFixed(1));
  const goal=pick(['habit','loss','muscle','recompose']);
  const change=pick([null,-0.3,-0.2,-0.08,0,0.08,0.3]);
  let targetWeight=change===null?null:Number((weight*(1+change)).toFixed(1));
  if (goal==='loss' && targetWeight!==null && targetWeight>=weight) targetWeight=null;
  if (goal==='recompose') targetWeight=pick([null,weight]);
  const chosen=modes.filter(()=>random()<0.34);
  if (!chosen.length) chosen.push(pick(modes));
  const fat=pick([null,null,20,28,35,45]);
  const muscle=pick([null,null,18,26,35]);
  return {age,height,weight,targetWeight,days:pick([1,2,3,4,5,6,7]),minutes:pick([10,15,20,30,45,90,180]),budget:pick([0,0,3,5,10]),facilityCost:pick([null,3,6,12]),hasGym:random()<0.2,modes:chosen,goal,experience:pick(['new','regular']),walking:pick(['unknown','hard','comfortable','running']),pushups:pick(['unknown','none','few','some','many']),risk:random()<0.06,balance:pick(['unknown','clear','concern']),avoidFloor:random()<0.2,diet:pick(['mixed','mixed','plant']),exclusions:random()<0.12?pick([['soy'],['legume'],['egg'],['soy','legume'],['soy','legume','egg','meat','fish']]):[],fat,muscle,targetFat:fat===null?null:pick([null,10,16,25,35]),targetMuscle:muscle===null?null:pick([null,19,27,36])};
}
for(let index=0;index<50000;index++) {
  const raw=profileFor(index),result=makePlan(raw,date);
  counts.total++;counts[result.status]++;
  if(raw.age>=65)counts.older++;
  if(raw.risk)counts.highRisk++;
  if(raw.fat===null&&raw.muscle===null)counts.optionalBodyUnknown++;
  (statusByGoal[raw.goal] ||= {ok:0,caution:0,error:0})[result.status]++;
  const ageGroup=raw.age<65?'18–64':'65–100';
  (statusByAge[ageGroup] ||= {ok:0,caution:0,error:0})[result.status]++;
  if(result.status!=='ok')continue;
  const p=result.p,s=result.sessions;
  if(raw.risk||p.weight/(p.height/100)**2<18.5||(p.targetWeight??p.weight)/(p.height/100)**2<18.5)issue('unsafe-start',{index,age:p.age});
  if(p.age>=65 && (p.balance!=='clear'||!['comfortable','running'].includes(p.walking)))issue('older-uncertain-start',{index,age:p.age});
  if(s.length!==p.days||result.total!==s.reduce((n,x)=>n+x.minutes,0))issue('session-count-or-total',{index});
  for(const x of s) {
    if(x.minutes>p.minutes||x.minutes>45||x.blocks.some(b=>b.minutes<=0)||x.blocks.reduce((n,b)=>n+b.minutes,0)!==x.minutes)issue('duration',{index,mode:x.mode});
    if(p.avoidFloor&&x.moves.some(m=>['bridge','bird','deadbug','side','floor'].includes(m.key)))issue('floor-preference',{index,mode:x.mode});
    if(p.age>=65&&x.balanceMinutes!==2)issue('older-balance',{index,mode:x.mode});
  }
  const loading=s.filter(x=>['strength','mat'].includes(x.type));
  for(let a=0;a<loading.length;a++)for(let b=a+1;b<loading.length;b++)if(Math.min(Math.abs(loading[a].day-loading[b].day),7-Math.abs(loading[a].day-loading[b].day))<=1)issue('recovery-gap',{index});
  const running=s.filter(x=>x.needsRunRecovery);
  for(let a=0;a<running.length;a++)for(let b=a+1;b<running.length;b++)if(Math.min(Math.abs(running[a].day-running[b].day),7-Math.abs(running[a].day-running[b].day))<=1)issue('run-gap',{index});
  if(p.modes.length===1&&p.days>=3&&!p.avoidFloor&&p.modes[0]==='pilates'&&!s.some(x=>x.mode==='pilates'))issue('pilates-preference-lost',{index,age:p.age,goal:p.goal,days:p.days});
  if(p.targetWeight===null&&p.targetMuscle!==null&&p.targetMuscle>=p.weight)issue('unbounded-muscle-target',{index,weight:p.weight,targetMuscle:p.targetMuscle});
  if(index%97===0) {
    const other=makePlan({...raw,sex:'여성'},date);
    assert.deepEqual(other,result);
    counts.sexParityChecked++;
  }
  const settings={morning:pick(['home','out','store']),midday:pick(['home','out','store']),evening:pick(['home','out','store']),habit:pick(['balance','drink','snack','portion','regular'])};
  const meal=dayMealPlan(p,settings),single=mealOptions(p,pick(['home','out','store']));
  counts.mealChecks++;
  if(meal.status==='ok'&&(meal.meals.length!==3||meal.meals.some(m=>!m.menu||!m.step)))issue('meal-shape',{index});
  if(meal.status==='caution'&&single.protein!==null)issue('meal-restriction-mismatch',{index});
  const feedback=assessMeal({grain:true,protein:true,vegetable:false,sweetDrink:false,amount:'more'},p);
  if(!feedback.actions[0]?.includes('굶거나 추가 운동'))issue('compensation-message',{index});
}
for(let index=0;index<1000;index++) {
  const entries=Array.from({length:1+Math.floor(random()*5)},()=>({food:pick(FOODS),amount:1+Math.floor(random()*800)}));
  const totals=sumPortions(entries);
  assert.ok(totals&&totals.length===5);
  for(let n=0;n<5;n++) {
    const values=entries.map(({food,amount})=>food[n+3]===null?null:food[n+3]*amount/100);
    assert.equal(totals[n]===null,values.includes(null));
    if(totals[n]!==null)assert.ok(Math.abs(totals[n]-values.reduce((a,b)=>a+b,0))<1e-7);
  }
  counts.foodChecks++;
}
const boundaries={
  pilatesOnlyMuscle:makePlan({age:40,height:165,weight:70,targetWeight:null,days:4,minutes:30,budget:0,modes:['pilates'],goal:'muscle',experience:'new',walking:'comfortable',pushups:'unknown',risk:false,diet:'mixed',exclusions:[],balance:'unknown',avoidFloor:false},date),
  impossibleMuscleTarget:makePlan({age:30,height:170,weight:70,targetWeight:null,targetMuscle:80,days:3,minutes:30,budget:0,modes:['bodyweight'],goal:'muscle',experience:'new',walking:'comfortable',pushups:'unknown',risk:false,diet:'mixed',exclusions:[],balance:'unknown',avoidFloor:false},date),
  longTrend:estimateTimeline({earlier:85,recent:84.6,weeks:4,target:65,height:175})
};
const summary={kind:'synthetic software QA; no actual users or clinical outcomes',seed:20260928,counts,statusByGoal,statusByAge,issues,examples,boundaries:{pilatesOnlyMuscle:{status:boundaries.pilatesOnlyMuscle.status,modes:boundaries.pilatesOnlyMuscle.sessions?.map(x=>x.mode)},impossibleMuscleTarget:{status:boundaries.impossibleMuscleTarget.status,field:boundaries.impossibleMuscleTarget.field},longTrend:{status:boundaries.longTrend.status,title:boundaries.longTrend.title}}};
const output=process.argv.indexOf('--output');
if(output>=0)writeFileSync(process.argv[output+1],JSON.stringify(summary,null,2));
console.log(JSON.stringify({seed:summary.seed,counts,statusByAge,issues,boundaries:summary.boundaries}));
