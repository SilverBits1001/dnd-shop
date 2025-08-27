import assert from 'assert';
import { parseExpr, rollExpr } from './dice.js';

const cases = [
  ['1d20', { num:1, sides:20, keep:null, reroll:null, explode:false, mod:0 }],
  ['2d20kh1', { num:2, sides:20, keep:{type:'h',count:1}, reroll:null, explode:false, mod:0 }],
  ['2d20kl1', { num:2, sides:20, keep:{type:'l',count:1}, reroll:null, explode:false, mod:0 }],
  ['3d6+2', { num:3, sides:6, keep:null, reroll:null, explode:false, mod:2 }],
  ['4d6kh3+1', { num:4, sides:6, keep:{type:'h',count:3}, reroll:null, explode:false, mod:1 }],
  ['1d8-1', { num:1, sides:8, keep:null, reroll:null, explode:false, mod:-1 }],
  ['1d6r=1', { num:1, sides:6, keep:null, reroll:1, explode:false, mod:0 }],
  ['1d6!', { num:1, sides:6, keep:null, reroll:null, explode:true, mod:0 }],
  ['2d10r=1+5', { num:2, sides:10, keep:null, reroll:1, explode:false, mod:5 }],
  ['1d20adv', { num:2, sides:20, keep:{type:'h',count:1}, reroll:null, explode:false, mod:0 }],
  ['1d20dis', { num:2, sides:20, keep:{type:'l',count:1}, reroll:null, explode:false, mod:0 }],
  ['2d4kl1-3', { num:2, sides:4, keep:{type:'l',count:1}, reroll:null, explode:false, mod:-3 }],
];

for (const [expr, expected] of cases) {
  assert.deepStrictEqual(parseExpr(expr), expected);
}

// Deterministic rolling
assert.strictEqual(rollExpr('1d20', 1).total, 13);
assert.strictEqual(rollExpr('2d6+3', 2).total, 10);

console.log('All tests passed');
