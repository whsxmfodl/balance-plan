import assert from 'node:assert/strict';
import { FOOD_META, FOODS } from './dist/food-data.mjs';
import { searchFoods, searchFoodPage, estimatePortion } from './dist/food-search.mjs';

assert.equal(FOODS.length, FOOD_META.included);
assert.ok(FOODS.length > 19000);
assert.equal(new Set(FOODS.map(food => food[0])).size, FOODS.length);
for (const food of FOODS) {
  assert.equal(food.length, 11);
  assert.ok(['100g', '100ml'].includes(food[2]));
  assert.ok(Number.isFinite(food[3]) && food[3] >= 0);
  assert.ok(!food.some(value => String(value).includes('\uFFFD')));
  for (const value of food.slice(4, 8)) assert.ok(value === null || Number.isFinite(value));
}
assert.deepEqual(searchFoods(FOODS, '김'), []);
const general = searchFoods(FOODS, '김치찌개');
assert.ok(general.length > 0 && general.every(food => !food[9]));
assert.equal(general[0][1], '김치찌개');
assert.equal(general[0][2], '100g');
assert.ok(searchFoods(FOODS, '피자', 'brand').every(food => food[9]));
assert.ok(searchFoods(FOODS, '비빔밥', 'all').length >= general.length / 2);
assert.ok(FOODS.some(food => food.slice(4, 8).includes(null)));
const page = searchFoodPage(FOODS, '김치찌개', 'general', 12);
assert.equal(page.rows.length, Math.min(12, page.total));
assert.ok(page.total >= page.rows.length);
assert.equal(searchFoodPage(FOODS, '김치찌개', 'general', 24).rows.length, Math.min(24, page.total));
assert.deepEqual(searchFoodPage(FOODS, '김', 'all'), {rows:[], total:0});
const sample = ['test', '샘플', '100g', 100, 10, null, 2, 100, '출처', '', '방법'];
assert.deepEqual(estimatePortion(sample, 250), {unit:'g', amount:250, values:[250,25,null,5,250]});
assert.deepEqual(estimatePortion([...sample.slice(0,2),'100ml',...sample.slice(3)], 50), {unit:'ml', amount:50, values:[50,5,null,1,50]});
for (const amount of ['', 0, -1, 2001, 'abc']) assert.equal(estimatePortion(sample, amount), null);
console.log(`공식 음식 ${FOODS.length.toLocaleString()}건: 구조·검색·기준량·결측값 확인`);
