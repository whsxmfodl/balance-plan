import { makePlan } from './planner.mjs';
import { assessMeal } from './meal.mjs';

const form = document.querySelector('#planner-form');
const content = document.querySelector('#result-content');
const error = document.querySelector('#form-error');
const tag = document.querySelector('.result-tag');

function escapeHtml(value) { return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function getInput() { const data = new FormData(form); return {...Object.fromEntries(data.entries()), modes:data.getAll('modes'), risk:data.has('risk')}; }
function render(plan, example=false) {
  error.hidden = true;
  tag.textContent = example ? '예시 입력' : plan.status === 'ok' ? '맞춤 제안' : '안전 확인';
  if (plan.status === 'error') { error.textContent=plan.message; error.hidden=false; content.innerHTML='<div class="empty-state">입력값을 확인하면 계획을 볼 수 있습니다.</div>'; return; }
  if (plan.status === 'caution') { content.innerHTML=`<div class="caution"><span class="micro">안전 확인이 먼저예요</span><h3>${escapeHtml(plan.reason)}</h3><p>${escapeHtml(plan.message)}</p></div><p class="small-note">일반적인 신체활동은 개인의 상태에 맞춰 조정해야 합니다. 통증이 생기면 운동을 멈추세요.</p>`; return; }
  content.innerHTML=`<div class="summary-card"><p class="micro">체중 목표 기간 · 계산 예시</p><strong>${escapeHtml(plan.timeline.title)}</strong><p>${escapeHtml(plan.timeline.detail)}</p></div>
    <div class="metric-row"><div><span>주간 운동</span><strong>${plan.p.days}일 · ${plan.total}분</strong></div><div><span>추천 방식</span><strong>${escapeHtml(plan.modes.map(m=>({gym:'헬스',pilates:'필라테스',running:'러닝',hiking:'등산',bodyweight:'맨몸운동'}[m])).join(' + '))}</strong></div></div>
    ${plan.budgetNote ? `<p class="budget-note">${escapeHtml(plan.budgetNote)}</p>` : ''}
    <h3 class="result-section-title">운동 일정</h3><div class="session-list">${plan.sessions.map(s=>`<article class="session"><span class="day">DAY ${s.day}</span><div><h4>${escapeHtml(s.title)} <span>${escapeHtml(s.mode)}</span></h4><p>${escapeHtml(s.detail)}</p></div></article>`).join('')}</div>
    <p class="activity-note">${escapeHtml(plan.activityNote)} ${escapeHtml(plan.pushupNote)}</p>
    <h3 class="result-section-title">식사 방향</h3><p class="meal-text">${escapeHtml(plan.meal)}</p><div class="meal-examples"><div><span>아침</span>오트밀 또는 밥 + 달걀·두부 + 과일</div><div><span>점심</span>밥 + 채소 반찬 + 생선·콩·고기 중 하나</div><div><span>저녁</span>밥·통곡물 + 채소 + 단백질 식품</div></div>
    <div class="uncertainty"><h3>기간을 읽을 때</h3><p>${escapeHtml(plan.targetNote)}</p><p>체중은 수분·측정 시각·약물·질환·생활 변화에 따라 달라집니다. 이 범위는 보장이나 날짜 약속이 아닙니다. 2~4주 추세와 컨디션을 보며 조정하세요.</p></div>`;
}
form.addEventListener('submit', e => { e.preventDefault(); const plan=makePlan(getInput()); render(plan); if (window.innerWidth < 960) document.querySelector('#result').scrollIntoView({behavior:'smooth',block:'start'}); });
render(makePlan(getInput()), true);

const photoInput = document.querySelector('#meal-photo');
const preview = document.querySelector('#photo-preview');
const mealImage = document.querySelector('#meal-image');
const photoMessage = document.querySelector('#photo-message');
let photoUrl;
function clearPhoto() { if (photoUrl) URL.revokeObjectURL(photoUrl); photoUrl=undefined; mealImage.removeAttribute('src'); preview.hidden=true; photoInput.value=''; photoMessage.textContent='사진 없이도 식사 점검을 할 수 있습니다.'; }
photoInput.addEventListener('change', () => {
  const file=photoInput.files?.[0];
  clearPhoto();
  if (!file) return;
  if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 8*1024*1024) { photoMessage.textContent='JPG·PNG·WebP 파일을 8MB 이하로 선택해 주세요.'; return; }
  photoUrl=URL.createObjectURL(file); mealImage.src=photoUrl; preview.hidden=false; photoMessage.textContent='사진은 현재 화면에서만 보이며 전송하거나 저장하지 않습니다.';
});
document.querySelector('#remove-photo').addEventListener('click',clearPhoto);
window.addEventListener('pagehide',() => { if(photoUrl) URL.revokeObjectURL(photoUrl); });
document.querySelector('#meal-form').addEventListener('submit',e => { e.preventDefault(); const data=new FormData(e.currentTarget); const advice=assessMeal(Object.fromEntries(['vegetable','protein','grain','sweetDrink'].map(k=>[k,data.has(k)]))); document.querySelector('#meal-feedback').innerHTML=`<strong>${escapeHtml(advice.title)}</strong><p>${escapeHtml(advice.detail)}</p>`; });
