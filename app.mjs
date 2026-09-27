import { makePlan, makeSession, dateKey, estimateTimeline } from './planner.mjs';
import { mealOptions, assessMeal, dayMealPlan } from './meal.mjs';
import { SOURCES, EXCLUSION_LABELS, RULES } from './catalog.mjs';
import { checkSchedule, moveSession } from './schedule.mjs';
import { STORAGE_KEY, packState, unpackState } from './storage.mjs';
import { reviewWeek } from './review.mjs';
import { searchFoods } from './food-search.mjs';

const $ = selector => document.querySelector(selector);
const form = $('#planner-form'), content = $('#result-content');
const initialContent = content.innerHTML;
const escape = value => String(value).replace(/[&<>"']/g,c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let plan = null, example = false, remember = false, context = 'home', variant = 0;
let moves = {};
let completed = new Set(), shortened = new Set(), startDate = dateKey(new Date()), lastSignature = '';
let shoppingChecked = new Set();
let foodRows = null;
const shortDate = key => new Date(`${key}T12:00:00`).toLocaleDateString('ko-KR',{month:'numeric',day:'numeric',weekday:'short'});
const currentSessions = () => {
  const checked=checkSchedule(plan.sessions,moves,startDate);
  const sessions=checked.status==='ok'?checked.sessions:plan.sessions.map(s=>({...s,originalDate:s.date}));
  return sessions.map(s=>({...s,...(shortened.has(s.date)?makeSession(s.mode,plan.p,s.day,true):{}),date:s.date,originalDate:s.originalDate,baseMinutes:s.minutes}));
};
const reveal = node => node.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});

$('#exclusions').innerHTML = Object.entries(EXCLUSION_LABELS).map(([value,label]) => `<label><input type="checkbox" name="exclusions" value="${value}">${label}</label>`).join('');
$('#source-list').innerHTML = SOURCES.map(s => `<div class="source-item"><a href="${escape(s.url)}" target="_blank" rel="noopener noreferrer">${escape(s.title)}</a><p>${escape(s.detail)}</p></div>`).join('');

function input() {
  const data = new FormData(form);
  return {...Object.fromEntries(data),modes:data.getAll('modes'),exclusions:data.getAll('exclusions'),hasGym:data.has('hasGym'),risk:data.get('riskAnswer')==='yes'};
}
function fill(profile) {
  for (const element of form.elements) {
    if (!element.name) continue;
    if (element.name==='riskAnswer') { element.value = profile.risk ? 'yes' : 'no'; continue; }
    if (element.type==='checkbox') element.checked = Array.isArray(profile[element.name]) ? profile[element.name].includes(element.value) : profile[element.name]===true;
    else if (element.type==='radio') element.checked = element.value===profile[element.name];
    else element.value = profile[element.name] ?? '';
  }
  syncOptions();
}
function syncOptions() {
  const data = input();
  $('#gym-options').hidden = !data.modes.includes('gym');
  form.elements.namedItem('facilityCost').disabled = data.hasGym;
  const older = Number(data.age) >= 65;
  $('#older-options').hidden = !older;
  form.elements.namedItem('balance').disabled = !older;
}
function showError(result) {
  $('#profile-editor').open=true;
  $('#form-error').textContent = result.message;
  $('#form-error').hidden = false;
  const target = form.querySelector(`[name="${result.field}"]`);
  if (target) {
    if (target.closest('details')) target.closest('details').open = true;
    target.setAttribute('aria-invalid','true'); target.focus();
  }
}
function build({scroll=true,keep=false}={}) {
  form.querySelectorAll('[aria-invalid]').forEach(e => e.removeAttribute('aria-invalid'));
  $('#form-error').hidden = true;
  if (!form.elements.namedItem('riskAnswer').value) { showError({field:'riskAnswer',message:'운동·식사 조절 전 확인 항목을 골라 주세요.'}); return; }
  const next = makePlan(input(),new Date(`${startDate}T12:00:00`));
  if (next.status==='error') { showError(next); return; }
  const signature = next.status==='ok' ? JSON.stringify(next.p) : '';
  if (!keep && signature!==lastSignature) { completed.clear(); shortened.clear(); moves={}; startDate=dateKey(new Date()); }
  plan = next.status==='ok' ? makePlan(next.p,new Date(`${startDate}T12:00:00`)) : next;
  if (plan.status==='caution') clearStoredForReview();
  if (plan.status==='ok' && checkSchedule(plan.sessions,moves,startDate).status!=='ok') { moves={}; completed.clear(); shortened.clear(); }
  lastSignature = signature;
  render(); renderMeal(); $('#meal-feedback').textContent='';
  if (remember && !example && plan.status==='ok') persist();
  if (plan.status==='ok' && window.innerWidth<=1000) $('#profile-editor').open=false;
  if (scroll) { reveal($('#result')); $('#result-title').focus({preventScroll:true}); }
}

function render() {
  $('#result-tag').textContent = example ? '둘러보기용 예시' : plan.status==='ok' ? '입력한 조건 반영' : '확인이 필요해요';
  if (plan.status==='caution') {
    content.innerHTML=`<div class="panel caution"><h3>${escape(plan.title)}</h3><p>${escape(plan.message)}</p><ol>${plan.steps.map(s=>`<li>${escape(s)}</li>`).join('')}</ol></div>`;
    return;
  }
  const reviewMarkup = `<details class="week-review" id="week-review"><summary>이번 주를 돌아보고 다음 주 조정하기</summary><p id="review-progress" class="small-note"></p><form id="review-form"><div class="field-grid two"><label>가장 큰 걸림돌<select name="barrier"><option value="none">특별히 없었어요</option><option value="time">시간이 부족했어요</option><option value="food">식사가 어려웠어요</option><option value="energy">피로가 쌓였어요</option></select></label><label>운동 뒤 몸 상태<select name="discomfort"><option value="none">통증 없이 괜찮았어요</option><option value="unknown">운동하지 않았거나 잘 모르겠어요</option><option value="pain">통증이 있었어요</option></select></label></div><button type="submit" class="outline-button">다음 주 방향 보기</button></form><div id="review-feedback" role="status"></div><p class="small-note">이번 주 기록을 참고해 작은 조정만 제안해요. 건강 효과나 체력 변화를 측정하지는 않아요.</p></details>`;
  content.innerHTML = `<div id="workout-region"></div>${reviewMarkup}<div class="panel plan-card"><details class="fold"><summary>왜 이렇게 구성했나요?</summary><p>${escape(plan.budgetNote)}</p><ul class="reason-list">${plan.reasons.map(s=>`<li>${escape(s)}</li>`).join('')}</ul><p>유산소와 근력은 따로 살펴요. 모든 운동 시간을 더해 유산소 주 150분을 달성했다고 계산하지 않아요. 이 일정은 회복을 고려한 시작 예시이며 실제 가능한 요일로 옮길 때에도 근력·매트 운동 사이에 하루를 비워 주세요.</p></details><div class="goal-period"><h3>기간보다 먼저, 첫 2주를 정해요</h3><p>${escape(plan.timeline)}</p><p>${escape(plan.checkpoint)}</p>${plan.goalNotes.length ? `<div class="goal-tags">${plan.goalNotes.map(n=>`<span>${escape(n)}</span>`).join('')}</div>` : ''}<details class="fold"><summary>체중 변화 기록이 있다면 기간 참고하기</summary><p>비슷한 조건에서 잰 두 시점의 주간 평균이 필요해요. 하루 체중 두 개를 비교하지 마세요. 두 평균 시점은 2주 이상 떨어져 있어야 해요.</p>${plan.p.targetWeight===null ? '<p>먼저 입력 조건에 목표 체중을 적고 계획을 다시 만들어 주세요.</p>' : `<form id="trend-form" novalidate><div class="field-grid two"><label>이전 주간 평균 <span>kg</span><input type="number" name="earlier" min="25" max="300" step="0.1" inputmode="decimal" required></label><label>최근 주간 평균 <span>kg</span><input type="number" name="recent" min="25" max="300" step="0.1" inputmode="decimal" required></label><label>두 평균 시점 사이 <span>주</span><input type="number" name="weeks" min="2" max="26" step="0.1" placeholder="예: 4" inputmode="decimal" required></label></div><p>목표 체중 ${escape(plan.p.targetWeight)}kg 기준 · 추세 단순 연장</p><button class="outline-button" type="submit">기록으로 참고값 보기</button><div id="trend-feedback" role="status"></div></form>`}</details></div>${example ? '<p class="small-note">예시를 보고 있어요. 내 정보로 바꾼 뒤 계획을 만들어 주세요.</p>' : `<details class="save-box"><summary>다음에도 이어서 쓰고 싶다면</summary><p>저장하면 건강 입력값·완료 체크·10분 전환·변경한 날짜를 이 브라우저에 ${RULES.storageDays}일 보관해요. 사진은 제외돼요. 암호화된 보관함은 아니므로 공용기기에서는 저장하지 마세요.</p><div class="save-actions"><button type="button" id="save-plan" class="outline-button">이 기기에 기억하기</button><button type="button" id="forget-plan" class="text-button" ${remember ? '' : 'hidden'}>기기 저장 끄기</button></div><p id="save-message" role="status">${remember ? '기기 저장이 켜져 있어요. 완료 체크와 수정한 계획도 이 기기에만 반영돼요.' : '현재는 이 화면에서만 사용 중이에요.'}</p></details>`}</div>`;
  renderWorkouts();
}

function renderWorkouts() {
  const container = $('#workout-region');
  const opened = [...container.querySelectorAll('details[open]')].map(d=>d.id);
  const sessions = currentSessions();
  const done = sessions.filter(s=>completed.has(s.date)).length;
  const next = sessions.find(s=>!completed.has(s.date) && s.date>=dateKey(new Date())) || sessions.find(s=>!completed.has(s.date));
  const total = sessions.reduce((n,s)=>n+s.minutes,0);
  const endDate=dateKey(new Date(startDate+'T12:00:00'),6),today=dateKey(new Date()),expired=today>endDate;
  container.innerHTML = `<div class="start-card">${example ? '<span class="example-label">가상 입력으로 보는 예시</span>' : ''}<h3>${expired ? '새 한 주를 시작해 볼까요?' : next ? `${escape(next.title)}, 약 ${next.minutes}분` : '이번 주도 수고했어요.'}</h3><p>${expired ? '이 계획의 기간이 지났어요. 오늘부터 새 일정을 만들 수 있어요.' : next ? `${shortDate(next.date)} 일정이에요. 시간이 부족하면 10분으로 줄이고, 필요하면 날짜를 바꿔 보세요.` : '더 채우기보다 회복하고, 다음 주에도 이어갈 수 있는지 컨디션을 살펴요.'}</p><div class="start-actions">${expired ? '<button type="button" id="new-week">오늘부터 새 한 주</button>' : next ? `<button type="button" data-open="${next.day}">동작과 순서 보기</button>` : '<span>작은 실행이 쌓이고 있어요.</span>'}<span class="progress-text">${done} / ${sessions.length}회 완료<span class="progress-caption">이번 주 계획 ${total}분</span></span></div></div><div class="panel plan-card"><div class="section-title"><h3>${escape(plan.title)}</h3><span>${shortDate(startDate)} — ${shortDate(endDate)}</span></div><p class="small-note">${escape(plan.ageNote)}</p><div class="week-strip">${Array.from({length:7},(_,i)=>{
    const key=dateKey(new Date(`${startDate}T12:00:00`),i), s=sessions.find(s=>s.date===key), dayName=new Date(`${key}T12:00:00`).toLocaleDateString('ko-KR',{weekday:'short'});
    return `<${s?'button':'div'} ${s?`type="button" data-open="${s.day}" aria-label="${shortDate(key)} ${escape(s.title)} 보기"`:''} class="week-day ${s ? 'active' : ''} ${completed.has(key) ? 'done' : ''}"><small>${dayName}</small><strong>${key.slice(-2)}</strong><small>${s ? completed.has(key) ? '완료' : s.type==='strength' ? '근력' : s.type==='mat' ? '매트' : s.type==='recovery' ? '회복' : s.mode==='hiking' ? '걷기' : '유산소' : '휴식'}</small></${s?'button':'div'}>`;
  }).join('')}</div>${sessions.map((s,i)=>`<details class="workout" id="session-${s.day}" ${opened.includes(`session-${s.day}`) || (!opened.length && s===next) || (!opened.length && !next && i===0) ? 'open' : ''}><summary><span class="date-label">${shortDate(s.date)}</span><span>${escape(s.title)}</span><span class="minutes">${s.minutes}분</span></summary><div class="workout-body"><div class="workout-tools"><label class="complete-label"><input type="checkbox" data-complete="${s.date}" ${completed.has(s.date) ? 'checked' : ''}>${completed.has(s.date) ? '오늘도 해냈어요' : '실천했어요'}</label>${s.baseMinutes>10 ? `<button type="button" class="outline-button" data-short="${s.date}">${s.short ? '원래 분량으로' : '바쁜 날은 10분만'}</button>` : ''}</div>${!completed.has(s.date)&&!expired?`<details class="reschedule"><summary>운동 날짜 바꾸기</summary><form data-reschedule="${s.originalDate}"><label>이번 주 안에서 이동<input type="date" name="sessionDate" value="${s.date}" min="${startDate>today?startDate:today}" max="${endDate}" required></label><button type="submit" class="outline-button">날짜 변경</button><p role="alert" class="schedule-error"></p></form></details>`:'<p class="small-note">완료했거나 기간이 지난 운동 날짜는 유지해요.</p>'}<ol class="workout-steps">${s.blocks.map(b=>`<li><span class="duration">약 ${b.minutes}분</span><strong>${escape(b.name)}</strong><p>${escape(b.detail)}</p></li>`).join('')}</ol><p class="small-note">${escape(s.note)}</p></div></details>`).join('')}<p class="safety-note">날카로운 통증·흉통·심한 어지럼이나 평소와 다른 숨참이 있으면 운동을 중단하고 상태에 맞는 도움을 받으세요.</p>${!sessions.some(s=>s.type==='strength') ? '<p class="small-note">이번 조합에는 전신 근력 운동이 없어요. 가능하다면 주 2일 근력을 함께 챙겨요.</p><button type="button" class="outline-button" id="add-strength">맨몸운동도 포함해 다시 짜기</button>' : ''}</div>`;
  $('#review-progress').textContent=`이번 주 계획 ${sessions.length}회 중 ${done}회 완료로 표시했어요. 완료 표시는 직접 선택한 기록이에요.`;
  $('#review-feedback').replaceChildren();
}

form.addEventListener('submit',e=>{e.preventDefault();example=false;build();});
form.addEventListener('input',()=>{
  syncOptions(); $('#form-error').hidden=true;
  const latest=input();
  if (latest.risk || (Number(latest.age)>=65 && (latest.balance!=='clear' || !['comfortable','running'].includes(latest.walking)))) clearStoredForReview();
  if (plan) { plan=null; example=false; $('#result-tag').textContent='조건 수정 중'; content.innerHTML='<div class="panel dirty"><h3>조건이 바뀌었어요.</h3><p>입력을 마치고 ‘내 한 주 만들기’를 누르면 바뀐 조건을 반영할게요.</p></div>'; }
  renderMeal(); $('#meal-feedback').textContent='';
});
$('#example').addEventListener('click',()=>{
  example=true; completed.clear(); shortened.clear(); moves={}; startDate=dateKey(new Date());
  fill({goal:'habit',age:30,height:170,weight:75,targetWeight:null,days:3,minutes:30,budget:0,experience:'new',modes:['bodyweight','running'],walking:'comfortable',pushups:'unknown',diet:'mixed',exclusions:[],risk:false,hasGym:false});
  build();
});
content.addEventListener('click',e=>{
  const target=e.target.closest('button');
  if (!target || plan?.status!=='ok') return;
  if (target.dataset.open!==undefined) { const card=$(`#session-${target.dataset.open}`); card.open=true; reveal(card); card.querySelector('summary').focus({preventScroll:true}); return; }
  if (target.dataset.short) { const key=target.dataset.short; shortened.has(key) ? shortened.delete(key) : shortened.add(key); completed.delete(key); renderWorkouts(); persistIfEnabled(); $(`[data-short="${key}"]`)?.focus(); return; }
  if (target.id==='new-week') { startDate=dateKey(new Date());completed.clear();shortened.clear();moves={};build({scroll:false,keep:true});return; }
  if (target.id==='add-strength') { form.querySelector('[name="modes"][value="bodyweight"]').checked=true; build({scroll:false}); return; }
  if (target.id==='save-plan') { remember=true; persist(); $('#forget-plan').hidden=!remember; return; }
  if (target.id==='forget-plan') {
    try { localStorage.removeItem(STORAGE_KEY); remember=false; target.hidden=true; $('#save-message').textContent='기기 저장을 지웠어요. 지금 화면은 계속 사용할 수 있어요.'; }
    catch { $('#save-message').textContent='브라우저가 저장소 접근을 막고 있어 삭제를 확인하지 못했어요. 브라우저의 사이트 데이터 설정을 확인해 주세요.'; }
  }
});
content.addEventListener('change',e=>{
  const key=e.target.dataset.complete;
  if (!key || plan?.status!=='ok') return;
  e.target.checked ? completed.add(key) : completed.delete(key);
  renderWorkouts(); persistIfEnabled(); $(`[data-complete="${key}"]`)?.focus();
});
content.addEventListener('submit',e=>{
  if (e.target.id==='review-form') {
    e.preventDefault();
    const sessions=currentSessions();
    const values=Object.fromEntries(new FormData(e.target));
    const result=reviewWeek({done:sessions.filter(s=>completed.has(s.date)).length,total:sessions.length,...values});
    $('#review-feedback').innerHTML=`<strong>${escape(result.title)}</strong>${result.actions.length?`<ul>${result.actions.map(a=>`<li>${escape(a)}</li>`).join('')}</ul>`:''}${result.note?`<p>${escape(result.note)}</p>`:''}${values.barrier==='food'&&result.status==='ok'?'<a href="#meal-section">오늘의 식사로 이동</a>':''}`;
    $('#review-feedback').className=result.status==='caution'?'review-caution':'review-result';
    return;
  }
  if (e.target.matches('[data-reschedule]')) {
    e.preventDefault();
    const original=e.target.dataset.reschedule;
    const oldDate=moves[original]||original;
    const result=moveSession(plan.sessions,moves,startDate,original,new FormData(e.target).get('sessionDate'));
    if(result.status!=='ok'){e.target.querySelector('.schedule-error').textContent=result.message;return;}
    const changed=result.moves[original]||original;
    if(shortened.delete(oldDate))shortened.add(changed);
    moves=result.moves; renderWorkouts(); persistIfEnabled();
    $('#result-tag').textContent=shortDate(changed)+'로 날짜를 바꿨어요';
    const session=plan.sessions.find(s=>s.date===original);
    $(`#session-${session.day} > summary`)?.focus();
    return;
  }
  if (e.target.id!=='trend-form') return;
  e.preventDefault();
  const result=estimateTimeline({...Object.fromEntries(new FormData(e.target)),target:plan.p.targetWeight,height:plan.p.height});
  $('#trend-feedback').className='timeline-feedback';
  $('#trend-feedback').innerHTML=result.status==='error' ? escape(result.message) : `<strong>${escape(result.title)}</strong><p>${escape(result.detail)}</p>`;
});

function clearStoredForReview() {
  if (!remember) return;
  try {
    localStorage.removeItem(STORAGE_KEY); remember=false;
    $('#restore-message').textContent='새 조건을 먼저 확인해야 해서 이전 기기 저장 계획을 지웠어요. 다시 사용할 계획은 확인 후 직접 저장해 주세요.';
  } catch {
    remember=false;
    $('#restore-message').textContent='새 조건은 확인이 필요하지만 이전 기기 저장을 지우지 못했어요. 브라우저의 사이트 데이터 설정에서 삭제해 주세요.';
  }
  $('#restore-message').hidden=false;
}
function persist() {
  if (example || plan?.status!=='ok') return;
  try { localStorage.setItem(STORAGE_KEY,packState(plan.p,completed,startDate,Date.now(),shortened,moves)); if ($('#save-message')) $('#save-message').textContent='이 브라우저에 30일 동안 기억할게요. 다른 기기와 공유되지 않으며 사진은 저장하지 않아요.'; }
  catch { remember=false; if ($('#save-message')) $('#save-message').textContent='브라우저에 저장하지 못했어요. 현재 화면은 계속 사용할 수 있어요.'; }
}
function persistIfEnabled() { if (remember && !example) persist(); }

function mealProfile() { return plan?.status==='ok' ? plan.p : input(); }
function todayMealSettings() { return {morning:$('#meal-morning').value,midday:$('#meal-midday').value,evening:$('#meal-evening').value,habit:$('#meal-habit').value}; }
function renderDayMeal(profile) {
  const target=$('#day-meal-plan');
  const shopping=$('#shopping-list');
  if(!form.elements.namedItem('riskAnswer').value) { target.innerHTML='<p class="day-meal-note">식사 초안을 보기 전에 내 조건의 ‘운동·식사 조절 전 확인’을 골라 주세요.</p>'; shopping.hidden=true; return; }
  if(profile.risk||plan?.status==='caution') { target.innerHTML='<p class="day-meal-note">건강상 확인이 필요한 경우에는 이미 안내받은 식사 계획을 우선해 주세요.</p>'; shopping.hidden=true; return; }
  const result=dayMealPlan(profile,todayMealSettings());
  if(result.status!=='ok') { target.innerHTML=`<p class="day-meal-note">${escape(result.message)}</p>`; shopping.hidden=true; return; }
  target.innerHTML=`<p class="day-meal-intro">${escape(result.intro)}</p><div class="day-meal-rows">${result.meals.map(m=>`<div class="day-meal-row"><strong>${escape(m.slot)}</strong><small>${escape(m.place)}</small><p>${escape(m.menu)}</p><span>${escape(m.step)}</span></div>`).join('')}</div><div class="day-meal-action"><strong>이번 주의 한 가지 · ${escape(result.action.title)}</strong><p>${escape(result.action.detail)}</p></div><p class="day-meal-note">${escape(result.note)}</p>`;
  shopping.hidden=false;
  shoppingChecked=new Set([...shoppingChecked].filter(item=>result.shopping.includes(item)));
  $('#shopping-items').innerHTML=result.shopping.length?result.shopping.map(item=>`<label><input type="checkbox" data-shopping="${escape(item)}" ${shoppingChecked.has(item)?'checked':''}><span>${escape(item)}</span></label>`).join(''):'<p class="small-note">집밥·편의점 식사로 정한 끼니가 없어 준비 후보가 없어요.</p>';
}
$('#shopping-items').addEventListener('change',e=>{
  const item=e.target.dataset.shopping;
  if(!item)return;
  e.target.checked?shoppingChecked.add(item):shoppingChecked.delete(item);
});
const foodLookup = $('#food-lookup');
const foodQuery = $('#food-query');
const foodKind = $('#food-kind');
const foodResults = $('#food-results');
const foodStatus = $('#food-status');
let foodLoad;
function renderFoodResults() {
  if (!foodRows) return;
  const query = foodQuery.value.trim();
  if (query.replace(/\s/g, '').length < 2) {
    foodResults.replaceChildren();
    foodStatus.textContent = '음식 이름을 두 글자 이상 입력해 주세요.';
    return;
  }
  const found = searchFoods(foodRows, query, foodKind.value);
  foodStatus.textContent = found.length ? `일치하는 항목 중 ${found.length}개를 보여드려요. 이름·출처와 기준량을 확인해 주세요.` : '일치하는 항목이 없어요. 다른 이름이나 자료 범위를 선택해 보세요.';
  const nutrient = (value, unit) => value === null ? '자료 없음' : `${escape(value)}${unit}`;
  foodResults.innerHTML = found.map(([code,name,basis,kcal,carb,protein,fat,sodium,origin,brand,method]) =>
    `<article class="food-result"><div><h4>${escape(name)}</h4><p>${escape(brand || origin)} · ${escape(method || '수집 방법 미표기')} · ${escape(code)}</p></div><strong>${escape(basis)} 기준 ${escape(kcal)}kcal</strong>${basis==='100ml'?'<small>자료의 부피 기준이에요. 음식 100g과 같게 계산할 수 없어요.</small>':''}<p>탄수화물 ${nutrient(carb,'g')} · 단백질 ${nutrient(protein,'g')} · 지방 ${nutrient(fat,'g')} · 나트륨 ${nutrient(sodium,'mg')}</p></article>`
  ).join('');
}
foodLookup.addEventListener('toggle', async () => {
  if (!foodLookup.open || foodRows) return;
  foodStatus.textContent = '식약처 음식 자료를 불러오는 중이에요…';
  try {
    foodLoad ||= import('./food-data.mjs');
    const data = await foodLoad;
    foodRows = data.FOODS;
    foodStatus.textContent = `음식 ${data.FOOD_META.included.toLocaleString('ko-KR')}건을 불러왔어요. 이름을 두 글자 이상 입력해 주세요.`;
    renderFoodResults();
  } catch {
    foodLoad = null;
    foodStatus.textContent = '자료를 불러오지 못했어요. 연결을 확인한 뒤 이 항목을 닫았다가 다시 열어 주세요.';
  }
});
foodQuery.addEventListener('input', renderFoodResults);
foodKind.addEventListener('change', renderFoodResults);
function renderMeal() {
  const profile=mealProfile();
  renderDayMeal(profile);
  if (!form.elements.namedItem('riskAnswer').value) { $('#meal-suggestion').innerHTML='<p>먼저 내 조건의 ‘운동·식사 조절 전 확인’을 골라 주세요.</p>'; return; }
  if (profile.risk || plan?.status==='caution') { $('#meal-suggestion').innerHTML='<p>건강상 확인이 필요한 경우에는 일반 식사 예시를 적용하기 전에 이미 안내받은 식사 계획을 우선해 주세요.</p>'; return; }
  const meal=mealOptions(profile,context,variant);
  $('#meal-suggestion').innerHTML=`<h3>${escape(meal.title)}</h3><p>${escape(meal.focus)}</p><ul class="food-parts">${meal.parts.map(p=>`<li>${escape(p)}</li>`).join('')}</ul>${meal.canSwap ? '<button type="button" id="swap-food" class="outline-button">다른 단백질 식품으로 바꾸기</button>' : ''}<p>${escape(meal.tip)}</p><details class="fold"><summary>피할 식품과 분량 안내</summary><p>${escape(meal.caution)}</p><p>구성 예시이며 개인별 열량·영양소 처방이 아니에요. 매 끼니 이 메뉴를 맞출 필요는 없어요.</p></details>`;
}
document.querySelectorAll('#meal-morning,#meal-midday,#meal-evening,#meal-habit').forEach(select=>select.addEventListener('change',()=>{renderDayMeal(mealProfile()); $('#meal-feedback').textContent='';}));
document.querySelectorAll('[data-context]').forEach(button=>button.addEventListener('click',()=>{
  context=button.dataset.context; variant=0;
  document.querySelectorAll('[data-context]').forEach(b=>b.setAttribute('aria-pressed',String(b===button))); renderMeal();
}));
$('#meal-suggestion').addEventListener('click',e=>{if(e.target.closest('#swap-food')){variant++;renderMeal();$('#swap-food')?.focus();}});
$('#meal-form').addEventListener('input',()=>{$('#meal-feedback').textContent='';});
$('#meal-form').addEventListener('submit',e=>{
  e.preventDefault();
  if (!form.elements.namedItem('riskAnswer').value) { $('#meal-feedback').textContent='먼저 내 조건의 ‘운동·식사 조절 전 확인’을 골라 주세요.'; return; }
  if (mealProfile().risk || plan?.status==='caution') { $('#meal-feedback').textContent='현재 상태에 맞는 식사 계획은 의료진·영양 전문가의 안내를 우선해 주세요.'; return; }
  const data=new FormData(e.currentTarget);
  const result=assessMeal({...Object.fromEntries(['vegetable','protein','grain','sweetDrink'].map(k=>[k,data.has(k)])),amount:data.get('amount')},mealProfile());
  const day=dayMealPlan(mealProfile(),todayMealSettings());
  const slot=data.get('mealSlot'),index={morning:1,midday:2,evening:0}[slot];
  const next=result.actions.length&&day.status==='ok'&&index!==undefined?day.meals[index]:null;
  $('#meal-feedback').innerHTML=`<strong>${escape(result.title)}</strong><ul>${result.actions.map(a=>`<li>${escape(a)}</li>`).join('')}</ul><p>${escape(result.detail)}</p>${next?`<div class="meal-next"><strong>${slot==='evening'?'내일 아침':`다음 ${next.slot}`}에 고를 수 있는 조합</strong><p>${escape(next.menu)}</p><small>${escape(next.step)}</small></div>`:''}`;
});

let photoUrl;
function clearPhoto(message='사진은 전송하거나 기기에 저장하지 않아요.') {
  if (photoUrl) URL.revokeObjectURL(photoUrl); photoUrl=undefined;
  $('#meal-image').removeAttribute('src'); $('#photo-preview').hidden=true; $('#meal-photo').value=''; $('#photo-message').textContent=message;
}
$('#meal-photo').addEventListener('change',()=>{
  const file=$('#meal-photo').files?.[0]; clearPhoto();
  if (!file) return;
  if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size>8*1024*1024) { clearPhoto('JPG·PNG·WebP 파일을 8MB 이하로 선택해 주세요.'); return; }
  photoUrl=URL.createObjectURL(file); $('#meal-image').src=photoUrl; $('#photo-preview').hidden=false; $('#photo-message').textContent='이 사진은 현재 화면에서만 보여요. 자동 분석·전송·저장은 하지 않아요.';
});
$('#meal-image').addEventListener('error',()=>{if(photoUrl) clearPhoto('이미지를 읽지 못했어요. 다른 JPG·PNG·WebP 파일을 선택해 주세요.');});
$('#remove-photo').addEventListener('click',()=>clearPhoto());
window.addEventListener('pagehide',()=>clearPhoto());

$('#clear-all').addEventListener('click',()=>{
  let removed=true;
  try { localStorage.removeItem(STORAGE_KEY); } catch { removed=false; }
  remember=false; plan=null; example=false; completed.clear(); shortened.clear(); shoppingChecked.clear(); moves={}; lastSignature='';startDate=dateKey(new Date());
  $('#profile-editor').open=true;
  form.reset(); form.querySelectorAll('[aria-invalid]').forEach(e=>e.removeAttribute('aria-invalid')); $('#meal-form').reset(); clearPhoto(); syncOptions(); variant=0;
  $('#meal-morning').value='home'; $('#meal-midday').value='out'; $('#meal-evening').value='home'; $('#meal-habit').value='balance';
  foodQuery.value=''; foodKind.value='general'; foodResults.replaceChildren(); if(foodRows)foodStatus.textContent='음식 이름을 두 글자 이상 입력해 주세요.';
  content.innerHTML=initialContent; $('#result-tag').textContent='준비 중'; $('#form-error').hidden=true; $('#restore-message').hidden=true; $('#meal-feedback').textContent=''; renderMeal();
  $('#clear-message').textContent=removed ? '입력·사진·기기 저장 정보를 모두 지웠어요.' : '현재 입력과 사진은 지웠지만 저장소 삭제는 확인하지 못했어요. 브라우저의 사이트 데이터 설정에서 삭제해 주세요.';
});

try {
  const text=localStorage.getItem(STORAGE_KEY);
  if (text) {
    const state=unpackState(text);
    if (state) {
      remember=true; fill(state.profile);
      const age=(new Date(`${dateKey(new Date())}T12:00:00`)-new Date(`${state.startDate}T12:00:00`))/86400000;
      startDate=age>=0 && age<7 ? state.startDate : dateKey(new Date());
      completed=new Set(age>=0 && age<7 ? state.completed : []); shortened=new Set(age>=0 && age<7 ? state.shortened : []);
      moves=age>=0&&age<7?state.moves:{};
      lastSignature=JSON.stringify(state.profile); build({scroll:false,keep:true});
      $('#restore-message').textContent=age>=7 ? '기억해 둔 조건으로 새 한 주를 준비했어요. 컨디션이 달라졌다면 입력을 수정해 주세요.' : '이 기기에 기억해 둔 계획을 불러왔어요. 이어서 시작해 보세요.'; $('#restore-message').hidden=false;
    } else { localStorage.removeItem(STORAGE_KEY); $('#restore-message').textContent='기기 저장 정보가 만료됐거나 읽을 수 없어 지웠어요. 새로 시작할 수 있어요.'; $('#restore-message').hidden=false; }
  }
} catch { /* Storage is optional; the core planner works without it. */ }
document.querySelectorAll('[href="#planner-form"]').forEach(link=>link.addEventListener('click',()=>{ $('#profile-editor').open=true; }));
syncOptions(); renderMeal();
