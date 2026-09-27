import { PROTEINS } from './catalog.mjs';

export function mealOptions(profile,context='home',variant=0) {
  const exclusions = new Set(profile.exclusions || []);
  const allowed = PROTEINS.filter(item => (profile.diet !== 'plant' || item.plant) && !item.tags.some(tag => exclusions.has(tag)));
  const protein = allowed.length ? allowed[variant % allowed.length].name : null;
  const goal = profile.goal || 'habit';
  const losing = goal === 'loss' || (profile.targetWeight !== null && profile.targetWeight !== undefined && String(profile.targetWeight).trim() !== '' && Number(profile.targetWeight) < Number(profile.weight));
  const focus = goal === 'muscle' || goal === 'recompose'
    ? '오늘은 끼니를 거르지 않고, 먹을 수 있는 단백질 반찬을 함께 챙겨요. 체중 감량과 근육 증가를 동시에 서두르지 않아요.'
    : losing ? '평소 식사를 바탕으로 단 음료·잦은 간식 중 하나부터 조정해요. 밥이나 끼니를 통째로 빼지는 마세요.'
    : '주식·단백질 반찬·채소를 한 끼에 함께 챙기는 것부터 시작해요.';
  const meals = {
    home: {title:'집밥으로 먹는다면',parts:['밥 또는 잡곡밥',protein || '먹을 수 있는 단백질 식품 확인','채소 반찬 1~2가지'],tip:'냉장고에 있는 재료로 바꿔도 괜찮아요. 처음에는 평소 먹는 양에서 시작하고 배고픔·포만감과 생활 패턴을 살펴요.'},
    out: {title:'외식·학식이라면',parts:['밥이 포함된 메뉴',protein ? `${protein} 반찬이 있는지 확인` : '먹을 수 있는 단백질 반찬 확인','채소 반찬 또는 샐러드'],tip:'정해진 메뉴를 그대로 먹어도 괜찮아요. 부족한 식품군은 다음 끼니에 보완하고 소스·국물은 입맛과 양을 살펴 선택해요.'},
    store: {title:'편의점에서 고른다면',parts:['즉석밥·고구마 중 하나',protein ? `${protein} 제품의 원재료 확인` : '먹을 수 있는 단백질 제품 확인','샐러드·과일 중 하나'],tip:'제품의 원재료와 1회 제공량을 확인해요. 한 번에 완벽히 갖추기 어렵다면 가능한 구성을 먼저 고르고 다음 끼니에 보완해요.'}
  };
  return {...(meals[context] || meals.home),focus,protein,canSwap:allowed.length>1,
    caution:allowed.length ? '피할 식품을 고른 경우에도 소스·가공품의 원재료와 교차접촉 여부는 직접 확인해야 해요. 선택 목록 밖의 알레르기는 자동으로 판별하지 못합니다.' : '선택한 제한에 맞는 단백질 예시가 없어요. 제한을 무시해 추천하지 않으며, 먹을 수 있는 대안을 영양 전문가와 확인해 주세요.'};
}

export function assessMeal(input,profile={}) {
  const selected = ['vegetable','protein','grain'].filter(k => input[k]);
  if (!selected.length && !input.sweetDrink) return {title:'먹은 음식 구성을 먼저 골라 주세요',detail:'사진은 참고용이에요. 어떤 음식이 있었는지 선택하면 다음 한 끼에서 할 일을 제안해요.',actions:[]};
  const actions = [];
  if (!input.vegetable) actions.push('다음 끼니에 채소 반찬이나 과일을 함께 챙겨요.');
  if (!input.protein) actions.push('다음 끼니에는 식사 제한에 맞는, 내가 먹을 수 있는 단백질 반찬을 함께 챙겨요.');
  if (!input.grain) actions.push('배고픔과 활동량을 보며 밥·감자 같은 주식도 챙겨요.');
  if (input.sweetDrink) actions.push('다음 음료는 물이나 무가당 음료로 바꿔 보는 정도면 충분해요.');
  if (input.amount === 'more') actions.unshift('다음 끼니를 굶거나 추가 운동으로 만회하려 하지 말고, 평소 식사로 돌아와요.');
  if (input.amount === 'less') actions.unshift('배가 고프거나 식사를 충분히 못 했다면 먹을 수 있는 음식으로 보충해요.');
  return {title:input.amount === 'more' ? '한 끼 때문에 계획을 처음부터 다시 할 필요는 없어요' : selected.length === 3 ? '기본 구성이 들어간 한 끼예요' : '다음 한 끼에서 하나만 보완해 봐요',actions:actions.length ? actions : ['지금의 다양한 구성을 이어가요. 양은 포만감과 실제 변화 추세를 함께 살펴요.'],detail:'분량·재료·조리법을 알 수 없어 칼로리나 목표가 늦어진 날짜를 계산하지 않아요. 한 끼를 성공·실패로 나누지 않고 다음 선택을 돕습니다.'};
}

