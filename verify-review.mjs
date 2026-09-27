import assert from 'node:assert/strict';
import {reviewWeek} from './dist/review.mjs';

assert.equal(reviewWeek({done:0,total:3}).status,'ok');
assert.match(reviewWeek({done:0,total:3}).actions.join(' '),/10분/);
assert.match(reviewWeek({done:1,total:3,barrier:'time'}).actions.join(' '),/횟수·시간/);
assert.match(reviewWeek({done:3,total:3}).actions.join(' '),/자동으로 늘리지는/);
assert.match(reviewWeek({done:2,total:3,barrier:'food'}).actions.join(' '),/오늘의 식사/);
assert.equal(reviewWeek({done:3,total:3,discomfort:'pain'}).status,'caution');
assert.doesNotMatch(reviewWeek({done:3,total:3,discomfort:'pain'}).actions.join(' '),/운동량을 늘리/);
assert.match(reviewWeek({done:0,total:3,discomfort:'unknown'}).actions.join(' '),/몸 상태/);
assert.equal(reviewWeek({done:4,total:3}).status,'error');
assert.equal(reviewWeek({done:1,total:3,barrier:'bogus'}).status,'error');
console.log('주간 점검: 실행 횟수, 걸림돌, 통증 우선 처리, 잘못된 입력 검사 통과.');
