import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
const root=existsSync(new URL('./dist/meal.mjs',import.meta.url))?'./dist/':'./';
const {dayMealPlan}=await import(root+'meal.mjs');
const places=['home','out','store'],habits=['balance','drink','snack','portion','regular'];
let count=0;
for(const goal of ['loss','muscle'])for(const diet of ['mixed','plant'])for(const morning of places)for(const midday of places)for(const evening of places)for(const habit of habits){
  const profile={goal,diet,weight:75,exclusions:['egg','fish','meat']};
  const result=dayMealPlan(profile,{morning,midday,evening,habit});
  assert.equal(result.status,'ok');
  assert.equal(result.meals.length,3);
  assert.deepEqual(result.meals.map(m=>m.place),[morning,midday,evening].map(p=>({home:'집',out:'외식·학식',store:'편의점'})[p]));
  assert.ok(result.meals.every(m=>!/(달걀|생선|닭고기)/.test(m.menu)));
  assert.ok(result.meals.every(m=>m.menu.includes('채소')));
  assert.ok(result.shopping.every(item=>!/(달걀|생선|닭고기)/.test(item)));
  assert.deepEqual(result.shopping.length===0, [morning,midday,evening].every(place=>place==='out'));
  assert.equal(new Set(result.shopping).size,result.shopping.length);
  assert.ok(!/(정확한 열량|목표 달성일|90%)/.test(JSON.stringify(result)));
  count++;
}
assert.equal(dayMealPlan({diet:'plant',exclusions:['soy','legume']}).status,'caution');
assert.equal(dayMealPlan({diet:'mixed',exclusions:['soy','legume','egg','meat','fish']}).status,'caution');
assert.equal(dayMealPlan({risk:true}).status,'caution');
assert.equal(dayMealPlan({}, {morning:'unknown'}).status,'error');
assert.equal(dayMealPlan({goal:'muscle',weight:75,targetWeight:70}).intro.includes('체중을 줄이려면'),false);
assert.equal(dayMealPlan({goal:'loss',weight:75}).intro.includes('체중을 줄이려면'),true);
console.log(`${count}개 식사 상황·선호 조합: 제한 식품 제외, 실제 선택과 준비 목록 반영, 과도한 숫자 추정 없음.`);
