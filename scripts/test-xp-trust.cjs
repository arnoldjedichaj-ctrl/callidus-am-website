const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../functions/index.js'), 'utf8');

function setup(initial = {}) {
  const state = new Map(Object.entries(initial));
  let serial = 0;
  let queue = Promise.resolve();
  const ref = path => ({ path, collection: name => collection(`${path}/${name}`),
    get: async () => ({ exists: state.has(path), data: () => structuredClone(state.get(path)) }) });
  const collection = path => ({ doc: id => ref(`${path}/${id || `auto${++serial}`}`) });
  const db = { collection, runTransaction(fn) {
    const run = queue.then(async () => {
      const writes = [];
      const result = await fn({ get: r => r.get(), set: (r, data) => writes.push([r.path, data]) });
      for (const [path, data] of writes) {
        const next = { ...state.get(path) };
        for (const [key, value] of Object.entries(data)) {
          next[key] = value?.increment !== undefined ? (next[key] || 0) + value.increment : value;
        }
        state.set(path, next);
      }
      return result;
    });
    queue = run.catch(() => {});
    return run;
  } };
  class HttpsError extends Error { constructor(code, message) { super(message); this.code = code; } }
  const ctx = { exports: {}, db, onCall: (_, fn) => fn, HttpsError,
    requireAuth: r => { if (!r.auth?.uid) throw new HttpsError('unauthenticated', 'login'); return r.auth.uid; },
    cleanString: v => String(v || '').trim(), numberValue: (v, d) => Number.isFinite(Number(v)) ? Number(v) : d,
    valusFromSources: b => b.valus || 0, CALLABLE_CORS: [], XP_PER_VALUS: 10000,
    MONTHLY_VALUS_LIMIT: 10, DAILY_TASK_XP: 100, DAILY_TASK_MILESTONES: [],
    monthKey: () => '2026-09', publicFoodDateKey: () => '2026-09-28',
    FieldValue: { serverTimestamp: () => 'now', increment: n => ({ increment: n }) },
    logger: { info() {} },
  };
  vm.createContext(ctx);
  for (const [start, end] of [
    ['function xpFromSources(', '// Fuer offene Rabattcodes'],
    ['function verifiedXp(', 'function publicBalance('],
    ['exports.convertNexusXpToValus =', '// Compatibility endpoint'],
    ['exports.creditMomusXp =', '// Verschiebt einen'],
    ['function shiftDateKey(', 'exports.getDailyTaskState ='],
  ]) {
    const a = source.indexOf(start), b = source.indexOf(end, a);
    assert.ok(a >= 0 && b > a, `production segment ${start}`);
    vm.runInContext(source.slice(a, b), ctx);
  }
  const request = data => ({ auth: { uid: 'u' }, data });
  return { ctx, state, request, ref };
}
const userPath = 'users/u';
const balancePath = 'users/u/balances/current';
const rewardPath = 'users/u/valus_xp_rewards/current';
const conversionPath = 'users/u/valus_conversions/2026-09';

test('self-reported app totals and forged legacy balance do not create convertible XP', async () => {
  const { ctx, state, request, ref } = setup({
    [userPath]: { total_xp: 99999999, momus_xp_total: 99999999 },
    [balancePath]: { xp: 99999999, redeemable_xp: 99999999, valus: 5 },
  });
  const before = structuredClone([...state]);
  assert.equal((await ctx.reconcileEarnedXp(ref(userPath))).balance.redeemable_xp, 0);
  assert.equal((await ctx.exports.creditMomusXp(request({}))).credited, 0);
  await assert.rejects(ctx.exports.convertNexusXpToValus(request({ xpAmount: 10000 })), { code: 'failed-precondition' });
  assert.deepEqual([...state], before);
});

test('verified XP can be spent once across simultaneous requests, preserving app levels', async () => {
  const { ctx, state, request } = setup({ [userPath]: { total_xp: 500000, current_xp: 123 },
    [balancePath]: { xp: 600000, valus: 5 }, [rewardPath]: { xp: 10000 } });
  const results = await Promise.allSettled([1, 2].map(() => ctx.exports.convertNexusXpToValus(request({ xpAmount: 10000 }))));
  assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
  assert.equal(state.get(rewardPath).xp, 0);
  assert.equal(state.get(balancePath).valus, 6);
  assert.equal(state.get(balancePath).xp, 590000);
  assert.deepEqual(state.get(userPath), { total_xp: 500000, current_xp: 123 });
});

test('monthly cap is shared by both app source labels', async () => {
  const { ctx, state, request } = setup({ [balancePath]: { xp: 30000 },
    [rewardPath]: { xp: 30000 }, [conversionPath]: { valus: 9 } });
  await ctx.exports.convertNexusXpToValus(request({ xpAmount: 10000, source: 'momus' }));
  await assert.rejects(ctx.exports.convertNexusXpToValus(request({ xpAmount: 10000, source: 'nexus' })), { code: 'resource-exhausted' });
  assert.equal(state.get(rewardPath).xp, 20000);
});

test('daily reward is server-calculated and issued only once, ignoring client-supplied awards', async () => {
  const { ctx, state, request } = setup({ [balancePath]: { xp: 999999 } });
  const results = await Promise.all([1, 2].map(() => ctx.exports.claimDailyTaskXp(request({ award: 900000, streak: 999 }))));
  assert.equal(results.filter(r => r.alreadyClaimed).length, 1);
  assert.equal(state.get(rewardPath).xp, 100);
  assert.equal(state.get(balancePath).xp, 1000099);
});

test('invalid amounts and unauthenticated requests cannot change rewards', async () => {
  const { ctx, state, request } = setup({ [rewardPath]: { xp: 100000 } });
  for (const xpAmount of ['10000junk', 10000.5, -10000, Infinity, null]) {
    await assert.rejects(ctx.exports.convertNexusXpToValus(request({ xpAmount })));
  }
  await assert.rejects(ctx.exports.convertNexusXpToValus({ data: { xpAmount: 10000 } }), { code: 'unauthenticated' });
  assert.equal(state.get(rewardPath).xp, 100000);
});

test('missing or corrupt verified balance fails closed', () => {
  const { ctx } = setup();
  for (const xp of [undefined, -1, Infinity, NaN, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
    assert.equal(ctx.verifiedXp({ xp }), 0);
  }
});
