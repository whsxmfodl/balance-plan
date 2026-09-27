export function assessMeal(input) {
  const foods = ['vegetable','protein','grain'].filter(k => input[k]);
  if (!foods.length && !input.sweetDrink) return { title:'음식 구성을 선택해 주세요', detail:'사진만으로 무엇을 얼마나 먹었는지 판정할 수 없습니다. 해당 식품군을 직접 선택하면 일반적인 균형을 점검합니다.' };
  const missing = {vegetable:'다음 식사에 채소나 과일을 더해 보세요.',protein:'다음 식사에 달걀·두부·콩·생선 등 단백질 식품을 더해 보세요.',grain:'활동량과 배고픔에 맞춰 밥·통곡물·감자류를 포함해 보세요.'};
  const suggestions = Object.entries(missing).filter(([k]) => !input[k]).map(([,v]) => v);
  if (input.sweetDrink) suggestions.push('단 음료·디저트는 매번 금지할 필요는 없지만 빈도와 양을 살펴보세요.');
  return { title:foods.length === 3 ? '주요 식품군을 고르게 포함했어요' : '다음 한 끼에서 균형을 보완해 보세요', detail:`${suggestions.join(' ') || '채소·단백질·곡물의 다양성을 유지해 보세요.'} 한 끼만으로 체중 목표에 미친 영향을 수치화할 수는 없습니다.` };
}
