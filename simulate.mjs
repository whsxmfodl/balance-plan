// All twenty personas are fictional fixtures, not real users or clinical trial data.
import assert from 'node:assert/strict';
import { existsSync, writeFileSync } from 'node:fs';
const root=existsSync(new URL('./dist/planner.mjs',import.meta.url))?'./dist/':'./';
const {makePlan,makeSession,dateKey}=await import(root+'planner.mjs');
const {mealOptions,assessMeal}=await import(root+'meal.mjs');
const {packState,unpackState}=await import(root+'storage.mjs');
const baseline=process.argv.includes('--before');
const base={age:30,height:170,weight:75,targetWeight:null,days:3,minutes:30,budget:0,modes:['bodyweight'],goal:'habit',experience:'new',walking:'comfortable',pushups:'unknown',risk:false,diet:'mixed',exclusions:[],balance:'unknown',avoidFloor:false};
const persona=(id,sex,life,profile,context,disruption)=>({id,sex,life,profile:{...base,...profile},context,disruption});
export const personas=[
 persona('M01','남성','19세 대학생 · 기숙사·학식',{age:19,height:174,weight:66,goal:'muscle',minutes:10},'out','시험 주간에도 10분만 가능'),
 persona('M02','남성','25세 야간근무 · 편의점 식사',{age:25,height:178,weight:92,targetWeight:84,goal:'loss',days:4,minutes:40,budget:3,facilityCost:6,modes:['gym','running']},'store','예산 밖 헬스장·퇴근 후 피로'),
 persona('M03','남성','31세 개발자 · 야근·사무실 운동',{age:31,height:181,weight:84,targetWeight:78,goal:'loss',days:5,modes:['bodyweight','gym'],hasGym:true,avoidFloor:true},'out','운동복 없이 바닥 동작을 피하고 싶음'),
 persona('M04','남성','38세 돌봄 제공자 · 채식',{age:38,height:170,weight:73,days:2,minutes:15,diet:'plant',avoidFloor:true,walking:'unknown'},'home','돌봄으로 운동 시간이 10분으로 줄어듦'),
 persona('M05','남성','43세 운전직 · 오래 걷기 부담',{age:43,height:175,weight:102,targetWeight:92,goal:'loss',minutes:20,modes:['running'],walking:'hard'},'store','오래 앉아 지내며 러닝은 아직 어려움'),
 persona('M06','남성','49세 운동 경력자 · 헬스장 이용',{age:49,height:180,weight:90,targetWeight:92,goal:'muscle',days:4,minutes:45,modes:['gym'],hasGym:true,experience:'regular',pushups:'many'},'home','숙련자에게도 실질적인 훈련 계획인지 확인'),
 persona('M07','남성','56세 주말 등산 · 평일 시간 없음',{age:56,height:171,weight:78,days:1,minutes:180,modes:['hiking']},'out','긴 산행 시간과 시작용 운동 분량이 다름'),
 persona('M08','남성','64세 사무직 · 운동 복귀',{age:64,height:169,weight:74,avoidFloor:true},'home','바닥에 눕지 않고 다시 시작'),
 persona('M09','남성','67세 은퇴자 · 낙상 걱정 없음',{age:67,height:173,weight:75,modes:['hiking'],balance:'clear',avoidFloor:true},'home','산책 선호에 근력·균형 보완 필요'),
 persona('M10','남성','76세 고령자 · 최근 넘어짐',{age:76,height:166,weight:67,minutes:15,modes:['hiking'],walking:'hard',balance:'concern',avoidFloor:true},'home','낙상·보행 부담은 자동 진행하면 안 됨'),
 persona('F01','여성','20세 대학생 · 체성분 모름',{age:20,height:162,weight:52,minutes:20,modes:['running']},'out','건강 수치 없이 운동 습관부터 시작'),
 persona('F02','여성','27세 러너 · 꾸준히 운동',{age:27,height:168,weight:62,days:5,minutes:45,modes:['running'],experience:'regular',walking:'running',pushups:'few'},'store','성별로 임의로 운동량을 줄이지 않는지 확인'),
 persona('F03','여성','33세 임신 중 · 건강 확인 필요',{age:33,height:164,weight:65,minutes:20,risk:true},'home','일반 계획을 임신 중 처방으로 적용하면 안 됨'),
 persona('F04','여성','36세 육아·직장 병행',{age:36,height:160,weight:61,targetWeight:57,goal:'loss',days:2,minutes:15,avoidFloor:true},'store','육아로 10분만 가능·바닥 동작 제외'),
 persona('F05','여성','42세 교대근무 · 필라테스 선호',{age:42,height:165,weight:70,targetWeight:64,goal:'loss',days:4,minutes:20,modes:['pilates']},'out','근무가 바뀌면 날짜를 옮겨야 함'),
 persona('F06','여성','48세 자영업 · 콩류 제외',{age:48,height:170,weight:74,goal:'muscle',budget:4,facilityCost:4,modes:['gym'],exclusions:['soy','legume']},'store','매장 근처에서 먹을 수 있는 단백질 대안'),
 persona('F07','여성','55세 교사 · 체형 개선',{age:55,height:158,weight:60,goal:'recompose',fat:33,targetFat:29,muscle:22,targetMuscle:23},'home','중년이라는 이유로 감량 속도를 단정하지 않기'),
 persona('F08','여성','63세 가족 돌봄 · 바닥 운동 어려움',{age:63,height:155,weight:62,days:2,minutes:10,modes:['pilates'],avoidFloor:true},'home','매트 선호와 바닥 동작 회피 조건이 충돌'),
 persona('F09','여성','69세 활동적인 동호인',{age:69,height:163,weight:63,days:4,modes:['hiking','bodyweight'],experience:'regular',balance:'clear'},'out','나이만으로 모든 운동을 보류하지 않기'),
 persona('F10','여성','78세 혼자 생활 · 보행 상태 불명',{age:78,height:154,weight:54,days:2,minutes:15,walking:'unknown',balance:'unknown',avoidFloor:true},'home','균형 상태를 모르면 먼저 확인하기')
];
assert.equal(personas.filter(p=>p.sex==='남성').length,10);
assert.equal(personas.filter(p=>p.sex==='여성').length,10);
const start=new Date('2026-09-28T12:00:00');
const now=Date.parse('2026-09-28T00:00:00Z');
const floorKeys=new Set(['bridge','bird','floor','deadbug','side']);
const results=personas.map(person=>{
 const p=makePlan(person.profile,start);
 const issue=[];
 let week=null;
 if(p.status==='ok'){
  const s=p.sessions;
  if(person.profile.avoidFloor && s.some(x=>x.moves.some(m=>floorKeys.has(m.key))))issue.push('바닥 회피 미반영');
  if(person.profile.age>=65 && !s.some(x=>x.balanceMinutes>0))issue.push('고령 균형 활동 없음');
  const complete=new Set(),shortened=new Set();
  // A fictional week: first session squeezed to ten minutes, second missed, later session resumed.
  for(const [i,x] of s.entries()){
   if(i===1)continue;
   const actual=i===0?makeSession(x.mode,p.p,x.day,true):x;
   assert.ok(actual.minutes<=person.profile.minutes);
   assert.equal(actual.minutes,actual.blocks.reduce((n,b)=>n+b.minutes,0));
   complete.add(x.date);if(i===0&&x.minutes>10)shortened.add(x.date);
  }
  const restored=unpackState(packState(p.p,complete,dateKey(start),now,shortened),now+86400000);
  assert.deepEqual(restored.completed,[...complete]);
  assert.deepEqual(restored.shortened,[...shortened]);
  const meal=mealOptions(p.p,person.context);
  const feedback=assessMeal({grain:true,protein:true,vegetable:false,sweetDrink:true,amount:'more'},p.p);
  assert.match(feedback.actions[0],/굶거나 추가 운동/);
  if(person.profile.diet==='plant')assert.ok(!/달걀|닭고기|생선/.test(meal.protein||''));
  if(person.profile.exclusions.includes('soy'))assert.notEqual(meal.protein,'두부·콩');
  // Sex is test metadata, deliberately not a dosage input.
  assert.deepEqual(makePlan({...person.profile,sex:person.sex==='남성'?'여성':'남성'},start),p);
  week={planned:s.length,completed:complete.size,minutes:p.total,strength:s.filter(x=>x.type==='strength').length,balance:s.filter(x=>x.balanceMinutes>0).length,protein:meal.protein,days:s.map(x=>({day:x.day,mode:x.mode,minutes:x.minutes})),reasons:p.reasons};
 }else if(['M09','F09'].includes(person.id))issue.push('건강한 65세 이상 일괄 보류');
 if(!baseline){
  const expected=['M10','F03','F10'].includes(person.id)?'caution':'ok';
  assert.equal(p.status,expected,person.id+' status');
  assert.deepEqual(issue,[],person.id+' unresolved issue');
 }
 return {id:person.id,sex:person.sex,life:person.life,disruption:person.disruption,status:p.status,reason:p.message||'',issues:issue,week};
});
const output={kind:'fictional software scenario simulation, not clinical evidence',mode:baseline?'before':'after',count:results.length,ok:results.filter(r=>r.status==='ok').length,caution:results.filter(r=>r.status==='caution').length,issues:results.filter(r=>r.issues.length).map(r=>({id:r.id,issues:r.issues})),results};
const flag=process.argv.indexOf('--output');
if(flag>=0)writeFileSync(process.argv[flag+1],JSON.stringify(output,null,2));
console.log(JSON.stringify({mode:output.mode,count:output.count,ok:output.ok,caution:output.caution,issues:output.issues}));
