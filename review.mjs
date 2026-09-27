const BARRIERS = new Set(['none','time','food','energy']);
const DISCOMFORT = new Set(['none','unknown','pain']);

export function reviewWeek({done,total,barrier='none',discomfort='none'}={}) {
  if(!Number.isInteger(done)||!Number.isInteger(total)||total<1||done<0||done>total||!BARRIERS.has(barrier)||!DISCOMFORT.has(discomfort))
    return {status:'error',title:'점검 정보를 다시 확인해 주세요.',actions:[]};

  const note='완료 횟수만으로 체력 변화나 건강 효과를 판단할 수 없어요. 이번 점검은 다음 주 계획을 조정하기 위한 참고예요.';
  if(discomfort==='pain')return {status:'caution',title:'통증이 있었다면 운동량을 늘리지 마세요.',actions:['통증을 일으킨 운동을 중단하고, 상태에 맞는 의료진이나 자격을 갖춘 전문가의 도움을 받아요.'],note};
  if(discomfort==='unknown')return {status:'ok',title:'몸 상태를 먼저 확인해요.',actions:['몸 상태와 지난주에 부담이 있었는지 살펴보고, 불확실하다면 다음 주도 무리 없이 할 수 있는 양으로 시작해요.'],note};

  const actions=[];
  if(done===0)actions.push('다음 주에는 가장 가능한 하루를 골라 10분만 시작해 보세요. 못 한 운동을 한꺼번에 만회할 필요는 없어요.');
  else if(done<total)actions.push('실천한 횟수를 바탕으로 다음 주 가능한 요일과 횟수를 다시 골라 보세요. 일정이 바쁜 날은 10분 계획을 써도 돼요.');
  else actions.push('이번 주 분량이 편안했다면 다음 주에도 같은 계획을 이어가 보세요. 한 주 기록만으로 운동량을 자동으로 늘리지는 않아요.');
  if(barrier==='time')actions.push('시간이 걸림돌이었다면 가능한 횟수·시간을 입력에서 낮추고 다시 계획을 만들어 보세요.');
  if(barrier==='food')actions.push('식사가 어려웠다면 오늘의 식사에서 한 끼 상황과 이번 주 행동 하나만 골라 보세요.');
  if(barrier==='energy')actions.push('피로가 걸림돌이었다면 쉬는 날을 먼저 확보하고, 지속되는 피로나 통증은 전문가와 상의해요.');
  return {status:'ok',title:done===0?'작게 다시 시작해요.':done===total?'지속 가능한지 살펴요.':'다음 주를 생활에 맞게 조정해요.',actions,note};
}
