import assert from 'node:assert/strict';
import {portionPattern,PORTION_PATTERNS,GRAIN_EXCHANGES} from './dist/portion-guide.mjs';

for (const [energy,counts] of Object.entries(PORTION_PATTERNS)) {
  const result=portionPattern(energy);
  assert.equal(result.energy,Number(energy));
  assert.equal(result.riceEquivalent,counts.grain*210);
  assert.ok(result.protein>0 && result.vegetable>0 && result.fruit>0 && result.dairy>0);
}
assert.deepEqual(portionPattern(1900),{energy:1900,grain:3,protein:4,vegetable:8,fruit:2,dairy:1,riceEquivalent:630});
assert.equal(portionPattern(''),null);
assert.equal(portionPattern(1800),null);
assert.equal(portionPattern('bad'),null);
assert.deepEqual(GRAIN_EXCHANGES.map(item=>[item.grams,item.servings]),[[210,1],[90,1],[140,0.3],[70,0.3],[35,0.3]]);
assert.equal(new Set(GRAIN_EXCHANGES.map(item=>item.name)).size,GRAIN_EXCHANGES.length);
console.log('공식 식사구성안 분량과 미지원 열량 처리 확인');
