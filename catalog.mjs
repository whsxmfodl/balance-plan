// General recommendations and conservative product choices are distinct.
export const SOURCES = [
  { title:'CDC · 65세 이상 활동', url:'https://www.cdc.gov/physical-activity-basics/guidelines/older-adults.html', detail:'유산소·근력·균형 활동을 함께 권고하며 개인의 능력과 상태에 맞춰 시작합니다. 나이만으로 모든 운동을 보류하지 않습니다.' },
  { title:'WHO · 연령별 신체활동 지침', url:'https://www.who.int/publications/i/item/9789240015128', detail:'65세 이상은 기능적 균형과 근력을 강조하는 복합 활동을 주 3일 이상 권고합니다. 이 사이트의 짧은 첫 주 연습이 권고 강도·분량을 충족한다는 뜻은 아닙니다.' },
  { title:'CDC STEADI · 낙상 확인', url:'https://www.cdc.gov/steadi/pdf/Steadi-Coordinated-Care-Plan.pdf', detail:'최근 낙상, 서거나 걸을 때 불안정함, 낙상 걱정은 추가 확인이 필요한 신호입니다. 이 사이트는 전문 낙상 평가를 수행하지 않습니다.' },
  { title:'NHS · 균형 동작 예시', url:'https://www.nhs.uk/live-well/exercise/balance-exercises/', detail:'안정적인 지지물 가까이에서 하는 균형 연습 예시를 참고했습니다. 2분 배분은 서비스의 시작용 선택입니다.' },
  { title:'NHS · 의자·서서 하는 근력 동작', url:'https://www.nhs.uk/live-well/exercise/strength-exercises/', detail:'의자에서 일어나기, 지지물을 잡고 뒤꿈치·다리 들기, 벽 푸시업 예시. 바닥 동작을 원하지 않을 때 대체에 사용합니다.' },
  { title:'CDC · 유산소와 근력', url:'https://www.cdc.gov/physical-activity-basics/adding-adults/what-counts.html', detail:'중강도 유산소 주 150분, 주요 근육군의 근력 주 2일 이상. 8~12회는 일반 예시이며 시작 횟수는 능력에 맞춥니다.' },
  { title:'NIDDK · 운동 시작과 회복', url:'https://www.niddk.nih.gov/health-information/weight-management/staying-active-at-any-size', detail:'짧게 시작하고 점진적으로 늘리기. 같은 근육의 근력 운동을 연속된 날에 배치하지 않기.' },
  { title:'WHO · 건강한 식사', url:'https://www.who.int/news-room/fact-sheets/detail/healthy-diet', detail:'채소·과일·콩류·통곡물과 다양한 단백질 식품을 포함하고 당류·나트륨 섭취 살피기.' },
  { title:'CDC · 체중 관리의 식사와 활동', url:'https://www.cdc.gov/healthy-weight-growth/physical-activity/', detail:'체중 변화에는 먹고 마시는 것과 신체활동이 함께 작용합니다. 90% 같은 고정 기여 비율은 사용하지 않으며 운동의 독립적인 건강 효과와 유지 역할도 설명합니다.' },
  { title:'NIDDK · 안전한 체중 관리 계획', url:'https://www.niddk.nih.gov/health-information/weight-management/choosing-a-safe-successful-weight-loss-program', detail:'지속할 수 있는 식사 선택, 활동, 장벽을 다루는 구체적 실천과 경과 확인을 권고합니다. 이 사이트의 하루 메뉴는 개인 영양 처방이나 효과가 검증된 치료 프로그램은 아닙니다.' },
  { title:'NIDDK · 음식 분량 이해하기', url:'https://www.niddk.nih.gov/health-information/weight-management/just-enough-food-portions', detail:'메뉴와 포장 식품의 제공량을 살피는 방법을 참고했습니다. 개인의 적정 분량·열량을 계산한 것은 아닙니다.' },
  { title:'NIDDK · 체중 계획', url:'https://www.niddk.nih.gov/health-information/weight-management/body-weight-planner', detail:'개인별 체중 계획에는 식사와 활동량이 함께 필요합니다. 이 사이트는 해당 예측 모델을 구현하지 않았습니다.' },
  { title:'푸시업 연구 · 적용 범위', url:'https://pubmed.ncbi.nlm.nih.gov/30363033/', detail:'대학생 남성 31명의 상대 근력 관련 연구. 체성분 추정이나 이 사이트의 난이도 구간을 검증한 연구는 아닙니다.' },
  { title:'사진 체성분 연구 · 한계', url:'https://pubmed.ncbi.nlm.nih.gov/31334579/', detail:'특정 2D·3D 도구의 오차 연구이며 모든 최신 도구를 대표하지 않습니다. 이 사이트에는 신체 사진 측정 모델이 없습니다.' }
];
// First-week caps, time slots and refusal limits below are product policies, not medical thresholds.
export const RULES = Object.freeze({ beginnerCap:30, regularCap:45, slotMinutes:2, minTargetFat:15, maxWeightChange:0.25, storageDays:30 });
export const MODE_LABELS = Object.freeze({gym:'헬스',bodyweight:'맨몸운동',pilates:'매트 필라테스',running:'걷기·러닝',hiking:'등산·경사 걷기'});
export const GOAL_LABELS = Object.freeze({habit:'운동 습관 만들기',loss:'체중 줄이기',muscle:'근력·근육 키우기',recompose:'체중 유지·체형 개선'});
export const MOVES = {
  calf:{name:'지지물을 잡고 뒤꿈치 들기',reps:'천천히 5회',cue:'움직이지 않는 의자 등받이를 잡고 두 뒤꿈치를 편한 높이까지 들었다 내려요. 지지를 유지하고 통증·흔들림이 있으면 멈춰요.'},
  hip:{name:'지지물을 잡고 옆으로 다리 들기',reps:'좌우 각각 5회',cue:'움직이지 않는 의자를 잡고 한쪽 다리를 옆으로 작게 들어요. 몸통을 기울이지 말고 흔들리면 멈춰요.'},
  squat:{name:'의자 스쿼트',reps:'편안하게 6~8회',cue:'움직이지 않는 의자에 앉았다 일어나요. 무릎과 발끝 방향을 맞춰요.'},
  wall:{name:'벽 푸시업',reps:'편안하게 4~6회',cue:'미끄럽지 않은 벽에 손을 짚고 몸을 일직선으로 유지해요. 힘들면 벽 가까이 서세요.'},
  incline:{name:'높은 지지대 푸시업',reps:'편안하게 4~6회',cue:'움직이지 않는 높은 지지대를 사용해요. 자세가 무너지면 벽 푸시업으로 바꿔요.'},
  floor:{name:'바닥 푸시업',reps:'편안하게 6~8회',cue:'허리가 처지지 않게 몸을 일직선으로 유지해요. 힘들면 높은 지지대나 벽으로 바꿔요.'},
  bridge:{name:'브리지',reps:'편안하게 6~8회',cue:'누워 무릎을 세우고 엉덩이를 천천히 들어요. 허리를 과하게 꺾지 마세요.'},
  bird:{name:'버드독',reps:'좌우 각각 3~4회',cue:'네발 자세에서 반대쪽 팔과 다리를 뻗어요. 흔들리면 팔 또는 다리만 움직여요.'},
  row:{name:'시티드 로우 머신',reps:'가벼운 무게로 6~8회',cue:'가슴을 펴고 손잡이를 당겨요. 기구 조절과 사용법을 모르면 직원에게 먼저 확인하세요.'},
  deadbug:{name:'데드버그',reps:'좌우 각각 3~4회',cue:'누워 무릎을 올리고 반대쪽 팔과 다리를 내려요. 허리가 뜨면 다리를 덜 뻗어요.'},
  side:{name:'옆으로 누워 다리 들기',reps:'좌우 각각 5~6회',cue:'옆으로 누워 골반이 뒤로 넘어가지 않게 위쪽 다리를 작게 들어요.'}
};
export const PROTEINS = [
  {name:'두부·콩',tags:['soy'],plant:true}, {name:'달걀',tags:['egg'],plant:false},
  {name:'닭고기',tags:['meat'],plant:false}, {name:'생선',tags:['fish'],plant:false},
  {name:'렌틸콩·병아리콩',tags:['legume'],plant:true}
];
export const EXCLUSION_LABELS = Object.freeze({soy:'대두',legume:'기타 콩류',egg:'달걀',meat:'육류',fish:'생선',dairy:'유제품',wheat:'밀',nuts:'견과류',shellfish:'갑각·조개류'});
