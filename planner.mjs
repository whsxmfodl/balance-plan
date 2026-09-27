const labels = { gym: '헬스', pilates: '필라테스', running: '러닝', hiking: '등산', bodyweight: '맨몸운동' };
const needsFacility = new Set(['gym', 'pilates']);

export function makePlan(raw) {
  const names = ['age','height','weight','targetWeight','days','minutes','budget'];
  const optional = ['fat','muscle','targetFat','targetMuscle'];
  const p = Object.fromEntries(names.map(k => [k, Number(raw[k])]));
  for (const key of optional) p[key] = raw[key] === '' || raw[key] === undefined || raw[key] === null ? null : Number(raw[key]);
  const ranges = { age:[18,100],height:[100,230],weight:[25,300],fat:[3,70],muscle:[1,100],targetWeight:[25,300],targetFat:[3,70],targetMuscle:[1,100],days:[1,7],minutes:[10,180],budget:[0,500] };
  for (const [key, [min,max]] of Object.entries(ranges)) if (p[key] !== null && (!Number.isFinite(p[key]) || p[key] < min || p[key] > max) || p[key] === null && names.includes(key)) return { status:'error', message:'입력 범위를 확인해 주세요. 나이는 18세 이상, 운동 시간은 10~180분이어야 합니다.' };
  if (!Number.isInteger(p.age) || !Number.isInteger(p.days) || p.muscle !== null && p.muscle >= p.weight || p.targetMuscle !== null && p.targetMuscle >= p.targetWeight) return { status:'error', message:'나이·운동일은 정수로, 골격근량은 체중보다 작게 입력해 주세요.' };
  const modes = [...new Set((raw.modes || []).filter(m => labels[m]))];
  if (!modes.length) return { status:'error', message:'선호하는 운동을 하나 이상 선택해 주세요.' };
  const pushups = raw.pushups ?? 'unknown';
  if (!['unknown','none','few','some','many'].includes(pushups)) return { status:'error', message:'푸시업 수행 수준을 다시 선택해 주세요.' };
  const bmi = p.weight / (p.height / 100) ** 2;
  const targetBmi = p.targetWeight / (p.height / 100) ** 2;
  if (raw.risk || bmi < 18.5 || targetBmi < 18.5 || p.age >= 65 || p.targetFat !== null && p.targetFat < 15) return { status:'caution', message:'이 조건에서는 자동으로 체중·운동 목표를 제안하지 않습니다. 의료진 또는 자격 있는 전문가와 현재 상태, 안전한 운동 범위, 목표를 먼저 확인해 주세요.', reason: raw.risk ? '건강·통증 정보 확인 필요' : p.age >= 65 ? '65세 이상은 기능·균형·질환 상태 확인 필요' : p.targetFat !== null && p.targetFat < 15 ? '체지방률 목표가 매우 낮아 전문가 확인 필요' : '현재 또는 목표 체중이 저체중 범위에 해당' };
  if (p.days * p.minutes > 600) return { status:'caution', message:'운동 이력과 회복 상태를 모르는 상황에서 주간 운동 시간이 매우 깁니다. 운동일·시간을 낮춰 시작하거나 전문가와 강도·휴식 계획을 확인해 주세요.', reason:'주간 운동 시간이 600분을 초과' };
  if (Math.abs(p.targetWeight - p.weight) > p.weight * 0.25) return { status:'caution', message:'체중 변화 폭이 커서 자동 기간 계산을 보류했습니다. 단계별 목표를 전문가와 함께 정해 주세요.', reason:'현재 체중의 25%를 넘는 변화' };
  const selected = p.budget === 0 ? modes.filter(m => !needsFacility.has(m)) : modes;
  if (!selected.length) selected.push('bodyweight');
  const budgetNote = p.budget === 0 && modes.some(m => needsFacility.has(m))
    ? '운동 예산이 0원이어서 유료 시설이 필요한 운동은 제외하고 맨몸운동을 대안으로 사용합니다.'
    : selected.some(m => needsFacility.has(m))
      ? `시설 이용료는 지역·업체마다 달라 예산 적합성을 확인하지 못했습니다. 월 ${p.budget}만원 안에서 이용 가능한지 확인하고, 어렵다면 맨몸운동으로 바꿔 진행하세요.`
      : '현재 선택한 운동은 시설 이용료 없이 시작할 수 있습니다. 등산 교통비 등은 별도로 확인하세요.';
  const sessions = Array.from({length:p.days}, (_, i) => {
    const mode = selected[i % selected.length];
    return session(mode,p.minutes,i,pushups);
  });
  const total = p.days * p.minutes;
  const direction = p.targetWeight < p.weight ? 'loss' : p.targetWeight > p.weight ? 'gain' : 'maintain';
  let timeline;
  const delta = Math.abs(p.targetWeight-p.weight);
  if (direction === 'loss') {
    const slow = Math.max(0.15, Math.min(0.25, p.weight * 0.0025));
    const fast = Math.min(0.5, p.weight * 0.005);
    timeline = { title:`참고 시나리오 ${Math.ceil(delta/fast)}~${Math.ceil(delta/slow)}주`, detail:`${delta.toFixed(1)}kg 감량을 주당 ${slow.toFixed(2)}~${fast.toFixed(2)}kg으로 단순 나눈 값입니다. 이 속도는 CDC의 일반적인 점진적 감량 범위보다 보수적으로 잡은 제품 가정이며, 개인의 실제 변화 속도를 예측한 결과가 아닙니다.` };
  } else if (direction === 'gain') {
    const slow = Math.max(0.1, p.weight * 0.001);
    const fast = Math.max(slow, p.weight * 0.0025);
    timeline = { title:`참고 시나리오 ${Math.ceil(delta/fast)}~${Math.ceil(delta/slow)}주`, detail:`주당 ${slow.toFixed(2)}~${fast.toFixed(2)}kg 증가를 임시 가정해 단순 계산했습니다. 이 속도는 검증된 개인별 근육 증가 예측이 아닙니다. 훈련·식사·수면·체수분 변화에 따라 실제 기간은 크게 달라집니다.` };
  } else timeline = { title:'체중 유지 목표', detail:'체중은 유지하면서 운동·식사 습관과 측정 추세를 확인하는 계획입니다.' };
  const fatNote = p.fat === null && p.targetFat === null ? '체지방률은 입력하지 않아 비교하지 않습니다.' : p.fat === null ? `체지방률 목표 ${p.targetFat}%를 기록했습니다. 현재 수치를 몰라 변화량은 비교할 수 없습니다.` : p.targetFat === null ? `현재 체지방률 ${p.fat}%를 기록했습니다. 목표를 정하지 않아 변화량은 비교하지 않습니다.` : `체지방률 ${p.fat}% → ${p.targetFat}%`;
  const muscleNote = p.muscle === null && p.targetMuscle === null ? '골격근량은 입력하지 않아 비교하지 않습니다.' : p.muscle === null ? `골격근량 목표 ${p.targetMuscle}kg을 기록했습니다. 현재 수치를 몰라 변화량은 비교할 수 없습니다.` : p.targetMuscle === null ? `현재 골격근량 ${p.muscle}kg을 기록했습니다. 목표를 정하지 않아 변화량은 비교하지 않습니다.` : `골격근량 ${p.muscle}kg → ${p.targetMuscle}kg`;
  const targetNote = `${fatNote} ${muscleNote} 알고 있는 수치는 같은 측정 조건에서 추세를 확인하세요. 달성 기간은 이 입력만으로 신뢰할 수 있게 예측할 수 없습니다.`;
  const meal = direction === 'loss'
    ? '매 끼니 채소·과일, 단백질 식품, 통곡물·밥을 고르게 담고, 단 음료와 잦은 간식부터 조정해 보세요. 끼니를 건너뛰거나 극단적으로 줄이지 마세요.'
    : direction === 'gain'
      ? '기본 식사에 단백질 식품과 곡물·감자류를 충분히 포함하고, 부족하면 요거트·과일·견과류처럼 간편한 간식을 더해 보세요.'
      : '채소·과일, 다양한 단백질 식품, 통곡물·밥을 고르게 선택하고 현재 식사 패턴을 꾸준히 유지해 보세요.';
  return { status:'ok', p, modes:selected, sessions, total, budgetNote, direction, timeline, targetNote, meal,
    pushupNote: pushups === 'unknown' ? '푸시업 정보가 없어 상체 밀기 동작은 가장 쉬운 단계부터 제안했습니다.' : '푸시업 수행 수준은 상체 밀기 동작의 시작 난이도에만 반영했습니다. 체지방률·골격근량 추정에는 사용하지 않았습니다.',
    activityNote: `계획은 주 ${total}분입니다. WHO의 주 150분 기준은 중강도 유산소 활동 시간에 적용되므로 모든 운동 시간을 그대로 합산해 달성했다고 볼 수 없습니다. 대화 가능한 빠른 걷기 등을 점진적으로 더하고, 근력 활동은 주 2일을 목표로 하세요. 같은 부위의 힘든 근력 운동 사이에는 회복 시간을 두세요.` };
}

function session(mode, minutes, i, pushups) {
  const low = minutes < 25;
  const warm = low ? 3 : 5;
  const cool = low ? 2 : 5;
  const work = minutes-warm-cool;
  const push = pushups === 'some' || pushups === 'many' ? '바닥 푸시업' : pushups === 'few' ? '높은 지지대 푸시업' : '벽 푸시업';
  const plans = {
    gym: ['전신 근력', `워밍업 ${warm}분 → 스쿼트·로우·${push}·힙힌지 중 3~4동작을 편한 강도로 ${work}분 → 정리 ${cool}분. 각 동작 2세트, 8~12회부터 시작.`],
    pilates: ['필라테스', `호흡·가동성 ${warm}분 → 브리지·데드버그·사이드 플랭크 등 매트 동작 ${work}분 → 정리 ${cool}분. 통증 없는 범위에서 천천히 진행.`],
    running: ['걷기+러닝', `걷기 ${warm}분 → 편하게 대화 가능한 속도로 걷기 2분·가벼운 달리기 1분을 ${work}분 반복 → 걷기 ${cool}분. 처음에는 속도보다 지속성을 우선.`],
    hiking: ['등산 또는 경사 걷기', `평지 걷기 ${warm}분 → 낮은 경사 길이나 계단·경사 걷기 ${work}분 → 정리 ${cool}분. 미끄럼과 하산 시간을 고려하고 긴 산행은 별도 여유 시간이 있을 때.`],
    bodyweight: ['맨몸 전신', `관절 풀기 ${warm}분 → 의자 스쿼트·${push}·버드독·브리지 ${work}분 → 가벼운 정리 ${cool}분. 각 동작 2세트, 무리 없는 횟수로.`]
  };
  return { day:i+1, mode:labels[mode], title:plans[mode][0], detail:plans[mode][1] };
}
