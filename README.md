# 밸런스 플랜

[사이트 열기](https://whsxmfodl.github.io/balance-plan/)

성인의 시간·예산·선호 운동을 바탕으로 일반적인 운동·식사 계획을 제안하는 정적 웹사이트입니다. 모든 계산은 방문자의 브라우저에서 실행됩니다. 계정, 서버 저장, 외부 분석 API, 유료 기능이 없습니다.

## 기능과 한계

- 체중 목표의 기간은 명시된 가정으로 계산한 참고 시나리오입니다. 개인별 달성 시점 예측이나 의료 처방이 아닙니다.
- 체지방률·골격근량의 현재값과 목표값은 선택 입력입니다. 미입력값을 키·체중·사진·푸시업 수행 여부로 추정하지 않습니다.
- 푸시업 정보는 상체 밀기 운동의 시작 난이도에만 쓰입니다.
- 식사 사진은 브라우저 메모리에서만 미리 봅니다. 사진 자동 분석은 없으며, 사용자가 선택한 식품군으로 식사 균형을 살펴봅니다.
- 신체 사진·영상 분석, 서버 저장, 회원가입은 구현하지 않았습니다. 안전상 주의가 필요한 입력은 자동 추천을 보류합니다.

## 구조와 수정 방법

| 파일 | 역할 |
| --- | --- |
| `index.html` | 입력 폼, 안내 문구, 화면 구조 |
| `styles.css` | 디자인, 모바일 반응형 |
| `planner.mjs` | 입력 검증, 안전 규칙, 기간 가정, 운동·식사 계획 |
| `meal.mjs` | 식사 체크 결과 |
| `app.mjs` | 화면 이벤트와 사진의 로컬 미리보기 |
| `verify.mjs` | 핵심 시나리오 점검 |

운동 종류를 바꾸면 `planner.mjs`의 `labels`, `needsFacility`, `session()`을 함께 고칩니다. 입력을 바꾸면 `index.html`의 `name`과 `planner.mjs`의 검증을 함께 고칩니다. 식사 체크 기준은 `meal.mjs`에서 수정합니다. 디자인은 `styles.css`에서 수정합니다. 변경 후 `node --check app.mjs`, `node --check planner.mjs`, `node --check meal.mjs`, `node verify.mjs`를 실행하고 공개 페이지의 핵심 흐름을 확인합니다.

## 근거와 개인정보

- [WHO 성인 신체활동](https://www.who.int/initiatives/behealthy/physical-activity)
- [CDC 근력 운동 예시](https://www.cdc.gov/physical-activity-basics/adding-adults/what-counts.html)
- [WHO 건강한 식사](https://www.who.int/news-room/fact-sheets/detail/healthy-diet)
- [CDC 점진적 체중 감량](https://www.cdc.gov/healthy-weight-growth/losing-weight/index.html)
- [푸시업 점수와 상체 상대 근력 연구](https://pubmed.ncbi.nlm.nih.gov/30363033/)
- [사진 기반 체지방률 추정의 정확도 한계 연구](https://pubmed.ncbi.nlm.nih.gov/31334579/)

운동 순서·시간 배분, 기간 계산 속도, 일부 안전상 보류 기준은 제품의 보수적 가정입니다. 새 건강 주장이나 사진·영상 분석을 추가하려면 1차 근거와 전문가 검토가 필요합니다. 현재 페이지는 연결 요청을 막는 CSP를 사용하고 건강 입력값·사진을 전송하지 않습니다. 호스팅 제공자는 일반적인 접속 기록을 처리할 수 있습니다.
