import { MODE_LABELS, GOAL_LABELS, RULES, MOVES, EXCLUSION_LABELS } from './catalog.mjs';

const required = {age:[18,100,'나이'],height:[100,230,'키'],weight:[25,300,'현재 체중'],days:[1,7,'주당 가능한 횟수'],minutes:[10,180,'한 번에 가능한 시간'],budget:[0,500,'월 추가 운동 예산']};
const optional = {targetWeight:[25,300,'목표 체중'],fat:[3,70,'현재 체지방률'],muscle:[1,100,'현재 골격근량'],targetFat:[3,70,'목표 체지방률'],targetMuscle:[1,100,'목표 골격근량'],facilityCost:[0,500,'확인한 월 헬스장 요금']};
const blank = value => value === undefined || value === null || String(value).trim() === '';
const error = (field,message) => ({status:'error',field,message});

export function validateProfile(raw) {
  if (!raw || typeof raw !== 'object') return error('age','내 정보를 먼저 입력해 주세요.');
  const p = {};
  for (const [name,[min,max,label]] of Object.entries({...required,...optional})) {
    if (blank(raw[name])) {
      if (name in required) return error(name,`${label}을 입력해 주세요.${name === 'budget' ? ' 추가 지출이 없으면 0을 입력하세요.' : ''}`);
      p[name] = null;
      continue;
    }
    p[name] = Number(raw[name]);
    if (!Number.isFinite(p[name]) || p[name] < min || p[name] > max) return error(name,`${label}은 ${min}~${max} 범위로 입력해 주세요.`);
  }
  for (const key of ['age','days','minutes']) if (!Number.isInteger(p[key])) return error(key,`${required[key][2]}은 정수로 입력해 주세요.`);
  p.goal = raw.goal || 'habit'; p.experience = raw.experience || 'new'; p.pushups = raw.pushups || 'unknown'; p.walking = raw.walking || 'unknown'; p.diet = raw.diet || 'mixed';
  if (!Object.hasOwn(GOAL_LABELS,p.goal) || !['new','regular'].includes(p.experience) || !['unknown','none','few','some','many'].includes(p.pushups) || !['unknown','hard','comfortable','running'].includes(p.walking) || !['mixed','plant'].includes(p.diet)) return error('goal','선택 항목을 다시 확인해 주세요.');
  p.modes = [...new Set((Array.isArray(raw.modes) ? raw.modes : []).filter(m => Object.hasOwn(MODE_LABELS,m)))];
  p.exclusions = [...new Set((Array.isArray(raw.exclusions) ? raw.exclusions : []).filter(k => Object.hasOwn(EXCLUSION_LABELS,k)))];
  p.hasGym = raw.hasGym === true || raw.hasGym === 'on'; p.risk = raw.risk === true || raw.risk === 'on';
  if (!p.modes.length) return error('modes','하고 싶은 운동을 하나 이상 골라 주세요.');
  if (p.goal === 'loss' && p.targetWeight !== null && p.targetWeight >= p.weight) return error('targetWeight','체중 줄이기라면 현재 체중보다 작은 목표를 적거나 비워 두세요.');
  if (p.goal === 'recompose' && p.targetWeight !== null && Math.abs(p.targetWeight-p.weight) > 0.5) return error('targetWeight','체중 유지·체형 개선을 선택했어요. 목표 체중을 비우거나 현재 체중에 맞춰 주세요. 체중도 바꾸려면 목표를 바꿔 주세요.');
  for (const [w,f,m] of [['weight','fat','muscle'],['targetWeight','targetFat','targetMuscle']]) {
    const mass = p[w] ?? (w === 'targetWeight' && p.goal === 'recompose' ? p.weight : null);
    if (mass !== null && p[m] !== null && p[m] >= mass) return error(m,'골격근량은 체중보다 작아야 해요. 단위가 kg인지 확인해 주세요.');
    if (mass !== null && p[f] !== null && p[m] !== null && p[m] >= mass*(1-p[f]/100)) return error(m,'체지방을 제외한 몸무게보다 골격근량이 크거나 같아요. 같은 측정표의 체중·체지방률·골격근량인지 확인해 주세요.');
  }
  return {status:'ok',p};
}

const caution = (title,message) => ({status:'caution',title,message,steps:['최근 측정값과 바꾸고 싶은 목표를 메모해 주세요.','의료진 또는 자격 있는 전문가에게 운동 범위와 식사 조절 여부를 확인해 주세요.','이미 안내받은 계획이 있다면 그 계획을 우선하세요.']});

export function makePlan(raw,startDate = new Date()) {
  const checked = validateProfile(raw);
  if (checked.status !== 'ok') return checked;
  const p = checked.p;
  const bmi = p.weight/(p.height/100)**2;
  const targetBmi = (p.targetWeight ?? p.weight)/(p.height/100)**2;
  if (p.risk) return caution('내 상태를 먼저 확인해 주세요','임신·수유, 섭식 문제, 치료 중인 질환이나 운동을 제한하는 통증·부상은 이 도구가 평가할 수 없어요. 자동 운동·식사 계획을 보류합니다.');
  if (bmi < 18.5 || targetBmi < 18.5) return caution('체중 목표를 먼저 확인해 주세요','현재 또는 목표 체중이 성인 저체중 선별 범위에 있어요. BMI만으로 건강을 판단할 수 없으므로 상태와 목표를 함께 확인해야 합니다.');
  if (p.age >= 65) return caution('균형과 기능을 포함한 계획이 필요해요','자동 계획은 18~64세를 대상으로 만들었어요. 65세 이상은 균형·낙상 위험·질환 상태를 반영한 계획이 필요하며, 나이만으로 운동이 위험하다는 뜻은 아닙니다.');
  if (p.targetFat !== null && p.targetFat < RULES.minTargetFat) return caution('체지방률 목표는 별도 확인이 필요해요','성별·측정 방식·건강 상태를 충분히 확인하지 못해 15% 미만의 수치 목표는 자동 계획에서 다루지 않아요. 이는 서비스의 보수적인 범위 제한이며 의학적 경계가 아닙니다.');
  if (p.targetWeight !== null && Math.abs(p.targetWeight-p.weight) > p.weight*RULES.maxWeightChange) return caution('목표를 중간 단계로 나눠 주세요','현재 체중의 25%를 넘는 변화는 자동 계획 범위 밖이에요. 전체 목표와 중간 목표를 전문가와 함께 정해 주세요.');
  const reasons = [];
  const modes = [...new Set(p.modes.map(mode => {
    if (mode !== 'gym' || p.hasGym || (p.facilityCost !== null && p.facilityCost <= p.budget)) return mode;
    reasons.push(p.facilityCost === null ? '헬스장 요금이 확인되지 않아 우선 맨몸운동으로 구성했어요. 이용권이 있거나 예산 안의 요금을 입력하면 헬스로 바뀝니다.' : `헬스장 월 ${p.facilityCost}만원이 추가 예산 ${p.budget}만원을 넘어 맨몸운동으로 바꿨어요.`);
    return 'bodyweight';
  }))];
  const muscleIncrease = p.muscle !== null && p.targetMuscle !== null && p.targetMuscle > p.muscle;
  const fatDecrease = p.fat !== null && p.targetFat !== null && p.targetFat < p.fat;
  const strengthPriority = p.goal === 'muscle' || p.goal === 'recompose' || muscleIncrease || fatDecrease;
  if (strengthPriority && !modes.some(m => ['gym','bodyweight'].includes(m))) {
    modes.push('bodyweight');
    reasons.push('근육·체형 목표를 위해 선택한 운동에 맨몸 근력을 보완했어요. 가능한 횟수와 시간 안에 반영합니다.');
  }
  if (muscleIncrease || fatDecrease) reasons.push(`${muscleIncrease ? '골격근량 증가' : '체지방률 감소'} 목표를 반영해 근력 운동을 우선 배치했어요. 수치 달성을 보장하지는 않습니다.`);
  const cap = p.experience === 'new' ? RULES.beginnerCap : RULES.regularCap;
  if (p.minutes > cap) reasons.push(`한 번에 ${p.minutes}분이 가능해도 첫 주는 최대 ${cap}분으로 시작해요. 남는 시간을 채우려고 추가 운동을 할 필요는 없어요.`);
  if (p.goal === 'muscle' && p.targetWeight !== null && p.targetWeight < p.weight) reasons.push('체중 감량과 근육 증가를 함께 원하고 있어요. 근력 습관을 우선하고 식사를 크게 줄이지 않는 방향으로 잡았어요.');
  const active = {1:[0],2:[0,3],3:[0,2,4],4:[0,2,4,6],5:[0,1,2,4,5],6:[0,1,2,3,4,5],7:[0,1,2,3,4,5,6]}[p.days];
  const loading = modes.filter(m => ['gym','bodyweight','pilates'].includes(m));
  const cardio = modes.filter(m => ['running','hiking'].includes(m));
  const wanted = p.experience === 'regular' && strengthPriority ? 3 : 2;
  const loadDays = loading.length ? chooseSpaced(active,Math.min(wanted,active.length)) : [];
  let loadIndex = 0, cardioIndex = 0;
  const sessions = active.map(day => {
    let mode;
    if (loadDays.includes(day)) {
      const candidates = strengthPriority ? loading.filter(m => m !== 'pilates') : loading;
      mode = candidates[loadIndex++ % candidates.length];
    } else mode = cardio.length ? cardio[cardioIndex++ % cardio.length] : 'recovery';
    return {...makeSession(mode,p,day),date:dateKey(startDate,day)};
  });
  const used = new Set(sessions.map(s => s.mode));
  const notScheduled = modes.filter(m => !used.has(m));
  if (notScheduled.length) reasons.push(`이번 주 횟수 안에서 ${[...used].filter(m => m !== 'recovery').map(m => MODE_LABELS[m]).join('·')}을 먼저 배치했어요. ${notScheduled.map(m => MODE_LABELS[m]).join('·')}도 하려면 선택 조합이나 횟수를 바꿔 주세요.`);
  if (sessions.some(s => s.mode === 'recovery')) reasons.push('근력·매트 운동 사이에 회복 걷기를 넣었어요. 같은 전신 운동을 연속해서 반복하지 않습니다.');
  if (p.days === 1 && strengthPriority) reasons.push('이번 주에는 가능한 1회부터 시작해요. 근력 주 2일 권고에는 아직 못 미치므로 여건이 생기면 짧은 1회를 더해요.');
  const goalNotes = [];
  if (p.targetWeight !== null) goalNotes.push(`체중 ${p.weight} → ${p.targetWeight}kg`);
  if (p.targetFat !== null) goalNotes.push(p.fat === null ? `목표 체지방률 ${p.targetFat}% · 현재값 확인 후 비교` : `체지방률 ${p.fat} → ${p.targetFat}%`);
  if (p.targetMuscle !== null) goalNotes.push(p.muscle === null ? `목표 골격근량 ${p.targetMuscle}kg · 현재값 확인 후 비교` : `골격근량 ${p.muscle} → ${p.targetMuscle}kg`);
  return {status:'ok',p,modes,sessions,reasons,strengthPriority,goalNotes,total:sessions.reduce((n,s) => n+s.minutes,0),title:`${GOAL_LABELS[p.goal]}, 이번 주부터`,
    budgetNote:modes.includes('gym') ? (p.hasGym ? '이미 이용 가능한 헬스장을 기준으로 했어요.' : `확인한 월 요금 ${p.facilityCost}만원이 추가 예산 ${p.budget}만원 안에 있어요.`) : '운동 시설 추가 비용 없이 시작하는 구성이에요. 등산 교통비·장비 비용은 별도예요.',
    checkpoint:strengthPriority ? '2주 뒤, 같은 동작이 더 편해졌는지와 통증 없이 이어갔는지 확인해요. 횟수·무게·시간을 한꺼번에 늘리지 마세요.' : '2주 뒤, 실제 실천 횟수와 운동 후 컨디션을 확인해요. 편안히 이어갔다면 시간이나 횟수 중 하나만 조금 늘려요.',
    timeline:'아직 개인 예상 기간을 계산할 정보가 부족해요. 먼저 2주 동안 운동·식사 습관과 측정 추세를 확인하세요. 2주는 목표 달성 기간이 아니라 첫 점검 시점이에요.'};
}

function chooseSpaced(days,count) {
  const choices = [];
  function visit(picked,index) {
    if (picked.length === count) { choices.push(picked); return; }
    for (let i=index;i<days.length;i++) if (picked.every(d => Math.min(Math.abs(d-days[i]),7-Math.abs(d-days[i])) > 1)) visit([...picked,days[i]],i+1);
  }
  visit([],0);
  if (!choices.length) return count > 0 ? chooseSpaced(days,count-1) : [];
  const score = list => list.length < 2 ? 7 : Math.min(...list.map((d,i) => (list[(i+1)%list.length]-d+7)%7));
  return choices.sort((a,b) => score(b)-score(a) || a[0]-b[0])[0];
}

export function dateKey(start,offset=0) {
  const date = new Date(start); date.setDate(date.getDate()+offset);
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}

export function makeSession(mode,p,day=0,short=false) {
  let minutes = Math.min(short ? 10 : p.minutes,p.experience === 'new' ? RULES.beginnerCap : RULES.regularCap);
  if (mode === 'recovery') minutes = Math.min(minutes,20);
  if (p.walking === 'hard' && ['running','hiking'].includes(mode)) minutes = Math.min(minutes,10);
  const warm = minutes <= 15 ? 2 : 5, cool = minutes <= 15 ? 2 : 5, work = minutes-warm-cool;
  const blocks = [{name:'몸풀기',minutes:warm,detail:'천천히 걷고 어깨·발목을 편하게 움직여요.'}];
  let moves = [],title,type,strengthSets = 0;
  const push = p.pushups === 'many' ? 'floor' : p.pushups === 'some' ? 'incline' : 'wall';
  if (['gym','bodyweight','pilates'].includes(mode)) {
    type = mode === 'pilates' ? 'mat' : 'strength';
    title = {gym:'헬스장 근력 기초',bodyweight:'집에서 근력 기초',pilates:'매트에서 천천히'}[mode];
    const alternatives = mode === 'pilates' ? [['bridge','deadbug','side'],['deadbug','side','bridge']] : mode === 'gym' ? [['squat','row',push,'bridge'],['row','bridge',push,'squat']] : [['squat',push,'bridge','bird'],['bird','bridge',push,'squat']];
    const keys = alternatives[day%2].slice(0,Math.max(1,Math.min(4,Math.floor(work/RULES.slotMinutes))));
    const sets = work >= keys.length*2*RULES.slotMinutes ? 2 : 1;
    moves = keys.map(key => ({...MOVES[key],...(p.experience==='regular' && ['squat','row','bridge'].includes(key) ? {reps:'자세를 유지하며 8~12회'} : {}),key,sets,minutes:sets*RULES.slotMinutes}));
    strengthSets = moves.reduce((n,m) => n+m.sets,0);
    blocks.push(...moves.map(m => ({name:m.name,minutes:m.minutes,detail:`${m.sets}세트 · ${m.reps}. 한 세트 뒤 약 60초 쉬어요. ${m.cue}`})));
    const left = work-moves.reduce((n,m) => n+m.minutes,0);
    if (left > 0) blocks.push({name:'편하게 걷기·동작 복습',minutes:left,detail:'낯선 동작을 가볍게 연습해요. 세트를 더 채우려고 서두르지 않아요.'});
  } else {
    type = mode === 'recovery' ? 'recovery' : 'cardio';
    title = mode === 'recovery' ? '회복 걷기' : mode === 'hiking' ? '가까운 길 걷기' : '걷기부터 시작';
    let detail = '편한 평지에서 문장으로 대화할 수 있는 속도로 걸어요. 숨이 많이 차면 속도를 낮춰요.';
    if (mode === 'running' && ['comfortable','running'].includes(p.walking) && (p.experience === 'regular' || [0,2,4].includes(day))) {
      title = '걷기와 가벼운 러닝';
      const cycles = Math.floor(work/3),rest = work%3;
      detail = `걷기 2분 + 가벼운 달리기 1분을 ${cycles}번${rest ? `, 마지막 ${rest}분은 걷기` : ''}. 힘들면 달리기 구간도 걸어도 괜찮아요.`;
    } else if (mode === 'hiking' && ['comfortable','running'].includes(p.walking)) detail = '가까운 평지·완만한 경사 길을 골라요. 이 시간 안에 왕복하고 날씨·미끄럼·하산 시간을 먼저 확인하세요.';
    if (mode === 'recovery') detail = '편안한 속도로 산책해요. 피곤하거나 근육통이 심하면 오늘은 완전히 쉬어도 괜찮아요.';
    blocks.push({name:title,minutes:work,detail});
  }
  blocks.push({name:'마무리',minutes:cool,detail:'걸음을 늦추고 호흡을 가라앉혀요. 통증이 생기면 동작을 중단하세요.'});
  return {day,mode,type,title,minutes,blocks,moves,strengthSets,short,note:'분량은 시작용 예시예요. 자세가 무너지기 전에 멈추고, 시간이 끝나면 남은 세트를 몰아서 하지 마세요.'};
}

export function estimateTimeline({earlier,recent,weeks,target,height}) {
  if ([earlier,recent,weeks,target].some(blank)) return {status:'error',message:'두 시점의 주간 평균 체중, 시점 사이의 주 수, 목표 체중을 모두 입력해 주세요.'};
  const [a,b,w,t] = [earlier,recent,weeks,target].map(Number);
  if (![a,b,w,t].every(Number.isFinite) || [a,b,t].some(n => n<25 || n>300) || w<2 || w>26) return {status:'error',message:'체중은 25~300kg, 두 평균값의 시점 차이는 2~26주로 입력해 주세요.'};
  if (Number.isFinite(Number(height)) && Number(height)>0 && Math.min(b,t)/(Number(height)/100)**2<18.5) return {status:'caution',title:'체중과 목표를 먼저 확인해 주세요',detail:'최근 평균 또는 목표가 저체중 선별 범위에 있어 기간 계산을 보류해요. 입력값과 목표를 전문가와 함께 확인해 주세요.'};
  if (Math.abs(t-b)<0.1) return {status:'ok',title:'최근 평균이 목표 체중에 가까워요',detail:'하루 수치보다 이후의 평균과 컨디션을 함께 확인해 주세요.'};
  const rate = (b-a)/w;
  if (Math.abs(rate)<0.1 || Math.sign(rate)!==Math.sign(t-b)) return {status:'caution',title:'지금 추세로는 기간을 계산하기 어려워요',detail:'변화가 작거나 목표와 방향이 달라요. 식사를 급하게 줄이지 말고 측정 조건과 실제 생활 변화를 살펴보세요.'};
  if (Math.abs(rate)>Math.min(1,a*0.01)) return {status:'caution',title:'변화 원인을 먼저 확인해 주세요',detail:'체수분·측정 차이가 섞였을 수 있어 빠른 변화 속도를 그대로 연장하지 않아요. 의도하지 않은 변화나 불편한 증상이 있으면 의료진과 확인하세요.'};
  return {status:'ok',title:`같은 추세가 이어진다면 약 ${Math.ceil(Math.abs((t-b)/rate))}주`,detail:`입력한 평균은 주당 ${Math.abs(rate).toFixed(2)}kg ${rate<0 ? '감소' : '증가'}했어요. 남은 체중 차이를 이 속도로 나눈 조건부 계산이며, 이 운동 계획의 효과 예측은 아닙니다. 정체기·체수분·생활 변화에 따라 달라지고 체지방·근육의 달성 시점은 알 수 없어요.`};
}

