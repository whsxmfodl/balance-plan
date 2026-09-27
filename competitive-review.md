# 유사 서비스 비교와 이번 적용

확인일: 2026-09-28. 공식 제품 설명과 공공데이터 문서를 확인했습니다. 기능 존재 여부를 비교한 것이며 효능이나 정확도 우위를 입증한 비교 시험은 아닙니다.

| 서비스 | 확인한 강점 | 이 사이트에 맞춘 판단 |
| --- | --- | --- |
| [MyFitnessPal](https://support.myfitnesspal.com/hc/en-us/articles/34889191368077-The-difference-between-Free-Premium-and-Premium) | 음식·운동 기록과 이력, 유료 스캔·식사 계획 | 기록 자체보다 다음 한 끼 행동과 개인정보 보호가 우선. 음식 검색은 공식 정적 데이터로 구현 |
| [Eat This Much](https://help.eatthismuch.com/help/what-do-i-get-for-creating-an-account) | 조건별 하루 식사, 예산·조리 시간 조정, 식품 준비 | 집밥·외식·편의점별 하루 초안과 준비 식품 체크를 적용. 가격·분량은 근거 없이 추정하지 않음 |
| [Hevy](https://help.hevyapp.com/hc/en-us/articles/33106320824727-Everything-You-Need-to-Know-About-the-Hevy-App-2025-Features-Guide) | 루틴, 세트·횟수 기록, 진행 현황 | 지금 가능한 운동의 완료 체크와 한 주 점검을 적용. 중량 추적은 헬스 외 운동에 보편적이지 않아 보류 |
| [Cronometer](https://cronometer.com/features/) | 다양한 영양소와 식품 검색 | 한식 음식 영양정보 검색을 추가. 섭취량을 모르면 개인의 열량·영양소 섭취량으로 표시하지 않음 |

## 이번에 적용한 기능

- 하루 식사 초안에서 집밥·편의점에 필요한 식품 후보를 중복 없이 보여주고 현재 화면에서 체크합니다.
- 완료 횟수·시간/식사/피로 걸림돌·통증을 사용자가 입력하면 다음 주의 한 가지 조정을 안내합니다. 통증이 있으면 운동량 증가를 권하지 않습니다.
- [식약처 제공 전국통합식품영양성분정보(음식)표준데이터](https://www.data.go.kr/data/15100070/standard.do) CSV를 변환해 19,494개 음식 항목을 브라우저 안에서 검색합니다. 일반 음식과 브랜드·외식 항목을 나누고, 각 항목의 100g 또는 100ml 기준·출처·수집 방법·결측을 표시합니다.

## 자료 선택과 한계

- [K-FIND](https://various.foodsafetykorea.go.kr/nutrient/intro/nui/intro.do)는 원재료·가공식품·음식 데이터를 제공합니다. 이번 버전은 공식 포털에서 내려받을 수 있는 **음식 표준데이터**만 포함합니다. 가공식품 전체 DB를 포함한다고 표현하지 않습니다.
- [공공데이터포털의 식약처 API](https://www.data.go.kr/data/15127578/openapi.do)는 무료이지만 인증키가 필요합니다. 정적 공개 사이트의 자바스크립트에 키를 넣으면 모두에게 노출되므로 CSV를 사전에 변환했습니다. 검색어·건강정보·사진은 외부 API로 보내지 않습니다.
- [USDA FoodData Central](https://fdc.nal.usda.gov/api-guide/)도 데이터 다운로드와 API를 제공하지만, API 키가 필요하고 한식 선택에는 국내 자료가 먼저 적합합니다. [Open Food Facts](https://openfoodfacts.github.io/openfoodfacts-server/api/tutorials/license-be-on-the-legal-side/)는 개방형 가공식품 자료이나 ODbL 조건과 자원봉사 기반 품질을 별도로 검토해야 하므로 이번 데이터에 섞지 않았습니다.
- 동일 음식명에 여러 출처·조리법과 서로 다른 기준량이 있습니다. 실제 먹은 음식과 분량을 확인하지 못하면 검색 결과를 개인 섭취 열량이나 체중 목표 지연으로 바꿀 수 없습니다. 사진만으로 그 정보를 확정하지 않습니다.

다음에 보완할 가치가 큰 지점은 실제 사용자에게 검색 결과를 **어떤 식사 선택에 연결할지** 검증하는 일입니다. 제품별 영양표시, 가격, 알레르기 안전, 음식 사진 자동 분석은 현재 자료만으로 신뢰할 만하게 제공할 수 없습니다.
