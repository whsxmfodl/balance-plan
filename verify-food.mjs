import assert from 'node:assert/strict';
import { FOOD_META, FOODS } from './dist/food-data.mjs';
import { searchFoods } from './dist/food-search.mjs';

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
console.log(`공식 음식 ${FOODS.length.toLocaleString()}건: 구조·검색·기준량·결측값 확인`);
