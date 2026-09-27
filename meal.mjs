import { PROTEINS } from './catalog.mjs';

const places = {home:'집',out:'외식·학식',store:'편의점'};
const habitActions = {
  balance:{title:'한 끼의 구성을 먼저 정해요',detail:'주식·먹을 수 있는 단백질 식품·채소나 과일을 함께 고를 수 있는 한 끼를 정해 보세요. 모든 끼니를 완벽히 맞출 필요는 없어요.'},
  drink:{title:'마시는 것 한 번을 바꿔요',detail:'평소 단 음료를 마시는 자리 한 번에서 물이나 무가당 음료를 골라 보세요. 단 음료를 마시지 않는다면 다른 실천을 고르세요.'},
  snack:{title:'자주 먹는 간식의 상황을 살펴요',detail:'간식이 필요한 시간과 배고픔을 살펴보고, 필요하다면 과일이나 먹을 수 있는 간식을 준비해요. 끼니를 굶어 간식을 억지로 줄이지는 마세요.'},
  portion:{title:'외식·포장 음식의 양을 살펴요',detail:'주문하거나 담을 때 제공량을 확인하고, 배가 부르면 남겨 두는 선택도 가능해요. 허기를 참고 정해진 양으로 줄이라는 뜻은 아니에요.'},
  regular:{title:'바쁜 날 먹을 수 있는 조합을 준비해요',detail:'식사 시간이 흔들리는 날을 위해 주식·먹을 수 있는 단백질 식품·채소나 과일을 마련해 두세요. 한 끼를 놓쳤다고 다음 끼니를 제한하지 마세요.'}
};

export function dayMealPlan(profile={},settings={}) {
  if(profile.risk)return {status:'caution',message:'건강상 확인이 필요한 경우에는 이미 안내받은 식사 계획을 우선해 주세요.'};
  const {morning='home',midday='out',evening='home',habit='balance'}=settings;
  const choices=[morning,midday,evening];
  if(choices.some(place=>!Object.hasOwn(places,place))||!Object.hasOwn(habitActions,habit)) return {status:'error',message:'식사 상황을 다시 골라 주세요.'};
  const exclusions=new Set(profile.exclusions||[]);
  const allowed=PROTEINS.filter(item=>(profile.diet!=='plant'||item.plant)&&!item.tags.some(tag=>exclusions.has(tag)));
  if(!allowed.length)return {status:'caution',message:'선택한 식품 제한에서 안전하게 제시할 단백질 예시가 없어요. 제한을 풀어 임의로 추천하지 않으며, 먹을 수 있는 대안을 영양 전문가와 확인해 주세요.'};
  const slots=['아침','점심','저녁'];
  const homeDish={'두부·콩':'두부 구이','달걀':'달걀찜','닭고기':'닭고기 구이','생선':'생선구이','렌틸콩·병아리콩':'렌틸콩·병아리콩 요리'};
  const meals=choices.map((place,index)=>{
    const protein=allowed[index%allowed.length].name;
    const menu=place==='home'
      ? `${index===0?'밥 또는 감자':'밥'} + ${homeDish[protein]||protein} + 채소나 과일`
      : place==='out' ? `백반·학식에서 밥 + 먹을 수 있는 단백질 반찬 + 채소 반찬`
      : `즉석밥 또는 고구마 + 원재료를 확인한 ${protein} 제품 + 채소나 과일`;
    const step=place==='home' ? '집에 있는 재료로 바꿔도 돼요.'
      : place==='out' ? `${protein}도 예시예요. 실제 메뉴에 없다면 다른 먹을 수 있는 반찬을 골라요.`
      : '제품의 원재료와 1회 제공량을 확인해요.';
    return {slot:slots[index],place:places[place],menu,step};
  });
  const shopping=[];
  const add=(label)=>{if(!shopping.includes(label))shopping.push(label);};
  choices.forEach((place,index)=>{
    if(place==='out')return;
    const protein=allowed[index%allowed.length].name;
    if(place==='home') {
      add('밥·감자 중 필요한 주식');
      add(protein);
      add('채소 또는 과일');
    } else {
      add('즉석밥 또는 고구마');
      add(`원재료 확인이 필요한 ${protein} 제품`);
      add('샐러드 또는 과일');
    }
  });
  const losing=profile.goal==='loss'||(!['muscle','recompose'].includes(profile.goal)&&profile.targetWeight!==null&&profile.targetWeight!==undefined&&String(profile.targetWeight).trim()!==''&&Number(profile.targetWeight)<Number(profile.weight));
  return {status:'ok',intro:losing?'체중을 줄이려면 먹고 마시는 양에도 지속 가능한 변화가 필요해요. 이 초안은 개인의 적정량을 계산하지 않으니 이번 주 바꾸기 쉬운 행동 하나를 골라 보세요.':'하루 전체를 똑같이 먹을 필요는 없어요. 상황에 맞춰 바꿔 보세요.',meals,shopping,action:habitActions[habit],note:'메뉴는 구성 예시예요. 분량·열량·가격과 실제 알레르기 안전을 계산하지 않아요. 식품 제한, 소스·가공품·교차접촉은 직접 확인해 주세요. 오늘의 식사 선택은 기기에 저장하지 않아요.'};
}

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
