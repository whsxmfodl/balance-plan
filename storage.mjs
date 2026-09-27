import { RULES } from './catalog.mjs';
import { validateProfile } from './planner.mjs';
export const STORAGE_KEY = 'balance-plan-v2';
export function packState(profile,completed,startDate,now=Date.now(),shortened=[]) {
  const checked = validateProfile(profile);
  if (checked.status !== 'ok') throw new Error('invalid-profile');
  return JSON.stringify({version:2,expires:now+RULES.storageDays*86400000,profile:checked.p,startDate,completed:[...completed].filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d)),shortened:[...shortened].filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d))});
}
export function unpackState(text,now=Date.now()) {
  try {
    const state = JSON.parse(text);
    if (!state || state.version!==2 || !Number.isFinite(state.expires) || state.expires<=now || state.expires>now+31*86400000 || typeof state.startDate!=='string' || !/^\d{4}-\d{2}-\d{2}$/.test(state.startDate)) return null;
    const checked = validateProfile(state.profile);
    if (checked.status!=='ok' || !Array.isArray(state.completed)) return null;
    return {...state,profile:checked.p,completed:state.completed.filter(d => typeof d==='string' && /^\d{4}-\d{2}-\d{2}$/.test(d)),shortened:(Array.isArray(state.shortened) ? state.shortened : []).filter(d => typeof d==='string' && /^\d{4}-\d{2}-\d{2}$/.test(d))};
  } catch { return null; }
}
