export function searchFoods(foods, term, kind = 'general', limit = 12) {
  const query = String(term).trim().toLocaleLowerCase('ko').replace(/[\s_]+/g, '');
  if (query.length < 2) return [];
  const matches = [];
  for (const food of foods) {
    if (kind === 'general' && food[9]) continue;
    if (kind === 'brand' && !food[9]) continue;
    const name = food[1].toLocaleLowerCase('ko').replace(/[\s_]+/g, '');
    const position = name.indexOf(query);
    if (position < 0) continue;
    const rank = position === 0 ? (name.length === query.length ? 0 : 1) : 2;
    matches.push({ food, rank });
  }
  matches.sort((a, b) => a.rank - b.rank || Number(b.food[2] === '100g') - Number(a.food[2] === '100g') || a.food[1].length - b.food[1].length || a.food[1].localeCompare(b.food[1], 'ko'));
  return matches.slice(0, limit).map(item => item.food);
}
