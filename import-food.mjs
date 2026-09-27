// Convert the official public-data portal dish CSV into a self-contained module.
// Usage: node import-food.mjs <downloaded CSV path>
import fs from 'node:fs';
import path from 'node:path';

const sourcePath = process.argv[2];
if (!sourcePath) throw new Error('공공데이터포털 음식 CSV 경로가 필요합니다.');

function parseCsv(source) {
  const rows = [];
  let row = [], field = '', quoted = false;
  for (let index = 0; index < source.length; index++) {
    const char = source[index];
    if (char === '"') {
      if (quoted && source[index + 1] === '"') { field += '"'; index++; }
      else quoted = !quoted;
    } else if (char === ',' && !quoted) {
      row.push(field); field = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && source[index + 1] === '\n') index++;
      row.push(field);
      if (row.some(value => value !== '')) rows.push(row);
      row = []; field = '';
    } else field += char;
  }
  if (quoted) throw new Error('닫히지 않은 CSV 따옴표가 있습니다.');
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

const raw = new TextDecoder('euc-kr').decode(fs.readFileSync(sourcePath));
const [headers, ...lines] = parseCsv(raw);
const required = ['식품코드', '식품명', '영양성분함량기준량', '에너지(kcal)', '탄수화물(g)', '단백질(g)', '지방(g)', '나트륨(mg)', '식품기원명', '업체명', '데이터생성방법명'];
for (const key of required) if (!headers.includes(key)) throw new Error(`필수 열 누락: ${key}`);
const index = Object.fromEntries(required.map(key => [key, headers.indexOf(key)]));
const number = value => value === '' || value === '해당없음' ? null : Number(value);
const foods = [];
let skipped = 0;
const codes = new Set();
for (const row of lines) {
  if (row.length !== headers.length) throw new Error(`CSV 열 개수 불일치: ${row.length}/${headers.length}`);
  if (row.some(value => value.includes('\uFFFD'))) { skipped++; continue; }
  const get = key => row[index[key]].trim();
  const code = get('식품코드'), name = get('식품명');
  const basis = get('영양성분함량기준량');
  const kcal = number(get('에너지(kcal)'));
  if (!code || !name || !['100g', '100ml'].includes(basis) || !Number.isFinite(kcal) || kcal < 0) { skipped++; continue; }
  if (codes.has(code)) throw new Error(`중복 식품코드: ${code}`);
  codes.add(code);
  const nutrients = ['탄수화물(g)', '단백질(g)', '지방(g)', '나트륨(mg)'].map(key => {
    const value = number(get(key));
    return Number.isFinite(value) && value >= 0 ? value : null;
  });
  const brand = get('업체명');
  foods.push([code, name, basis, kcal, ...nutrients, get('식품기원명'), brand === '해당없음' ? '' : brand, get('데이터생성방법명')]);
}
foods.sort((a, b) => a[1].localeCompare(b[1], 'ko'));
const metadata = {
  title: '전국통합식품영양성분정보(음식)표준데이터',
  provider: '식품의약품안전처 · 공공데이터포털',
  source: 'https://www.data.go.kr/data/15100070/standard.do',
  sourceDate: '2026-08-28',
  included: foods.length,
  excluded: skipped,
};
const output = path.join(import.meta.dirname, 'dist', 'food-data.mjs');
fs.writeFileSync(output, `// Source: ${metadata.source}\n// Nutrition values are per basis (100g or 100ml), never personal intake.\nexport const FOOD_META = ${JSON.stringify(metadata)};\nexport const FOODS = ${JSON.stringify(foods)};\n`);
console.log(JSON.stringify({ ...metadata, bytes: fs.statSync(output).size, general: foods.filter(row => !row[9]).length, branded: foods.filter(row => row[9]).length }));
