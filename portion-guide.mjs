// 보건복지부·한국영양학회, 2020 한국인 영양소 섭취기준 활용연구 (2021), 식사구성안 B형.
// 식품군의 '1회'는 개인별 한 끼 권장량이 아니다. 2025 KDRI의 새 식사구성안은 아직 발표 전이다.
export const PORTION_SOURCE = 'https://kns.or.kr/fileroom/fileroom_view.asp?BoardID=Kdr&idx=125';
export const PORTION_PATTERNS = Object.freeze({
  1600:{grain:3,protein:2.5,vegetable:6,fruit:1,dairy:1},
  1900:{grain:3,protein:4,vegetable:8,fruit:2,dairy:1},
  2000:{grain:3.5,protein:4,vegetable:8,fruit:2,dairy:1},
  2200:{grain:3.5,protein:5,vegetable:8,fruit:2,dairy:1},
  2400:{grain:4,protein:5,vegetable:8,fruit:3,dairy:1}
});

export function portionPattern(energy) {
  const key=Number(energy);
  if (!Object.hasOwn(PORTION_PATTERNS,key)) return null;
  const counts=PORTION_PATTERNS[key];
  return {energy:key,...counts,riceEquivalent:counts.grain*210};
}
