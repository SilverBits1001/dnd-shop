export function parseExpr(expr) {
  if (typeof expr !== 'string') throw new Error('Expression must be a string');
  let cleaned = expr.replace(/\s+/g, '').toLowerCase();
  if (cleaned.endsWith('adv')) {
    cleaned = cleaned.slice(0, -3) || '1d20';
    const m = cleaned.match(/^(\d*)d(\d+)$/);
    if (!m) throw new Error(`Invalid expression: ${expr}`);
    const c = m[1] ? parseInt(m[1], 10) : 1;
    const s = m[2];
    cleaned = `${c * 2}d${s}kh${c}`;
  } else if (cleaned.endsWith('dis')) {
    cleaned = cleaned.slice(0, -3) || '1d20';
    const m = cleaned.match(/^(\d*)d(\d+)$/);
    if (!m) throw new Error(`Invalid expression: ${expr}`);
    const c = m[1] ? parseInt(m[1], 10) : 1;
    const s = m[2];
    cleaned = `${c * 2}d${s}kl${c}`;
  }
  const regex = /^(\d*)d(\d+)(kh(\d+)|kl(\d+))?(r=(\d+))?(!)?([+-]\d+)?$/;
  const m = cleaned.match(regex);
  if (!m) throw new Error(`Invalid expression: ${expr}`);
  const num = m[1] ? parseInt(m[1], 10) : 1;
  const sides = parseInt(m[2], 10);
  let keep = null;
  if (m[3]) {
    keep = { type: m[3].startsWith('kh') ? 'h' : 'l', count: parseInt(m[4] || m[5], 10) };
  }
  const reroll = m[7] ? parseInt(m[7], 10) : null;
  const explode = !!m[8];
  const mod = m[9] ? parseInt(m[9], 10) : 0;
  return { num, sides, keep, reroll, explode, mod };
}

function mulberry32(a) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export function rollExpr(expr, seed = Date.now()) {
  const cfg = parseExpr(expr);
  const rnd = mulberry32(seed >>> 0);
  const rolls = [];
  for (let i = 0; i < cfg.num; i++) {
    let r = Math.floor(rnd() * cfg.sides) + 1;
    if (cfg.reroll !== null && r === cfg.reroll) {
      r = Math.floor(rnd() * cfg.sides) + 1;
    }
    rolls.push(r);
    if (cfg.explode && r === cfg.sides) {
      let e;
      do {
        e = Math.floor(rnd() * cfg.sides) + 1;
        rolls.push(e);
      } while (e === cfg.sides);
    }
  }
  let kept = rolls.slice();
  if (cfg.keep) {
    const sorted = rolls.slice().sort((a, b) => cfg.keep.type === 'h' ? b - a : a - b);
    kept = sorted.slice(0, cfg.keep.count);
  }
  const total = kept.reduce((a, b) => a + b, 0) + cfg.mod;
  const parts = kept.concat(cfg.mod ? [cfg.mod] : []);
  return { total, rolls, kept, parts, seed };
}
