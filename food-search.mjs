export function searchFoodPage(foods, term, kind = 'general', limit = 12) {
  const query = String(term).trim().toLocaleLowerCase('ko').replace(/[\s_]+/g, '');
  if (query.length < 2) return { rows: [], total: 0 };
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
  return { rows: matches.slice(0, limit).map(item => item.food), total: matches.length };
}

export function searchFoods(foods, term, kind = 'general', limit = 12) {
  return searchFoodPage(foods, term, kind, limit).rows;
}

// The user supplies an actual amount. This does not infer a serving from the food name or photo.
export function estimatePortion(food, amount) {
  const quantity = Number(amount);
  if (!food || !Number.isFinite(quantity) || quantity < 1 || quantity > 2000) return null;
  const factor = quantity / 100;
  return {
    unit: food[2] === '100ml' ? 'ml' : 'g',
    amount: quantity,
    values: food.slice(3, 8).map(value => value === null ? null : value * factor)
  };
}
