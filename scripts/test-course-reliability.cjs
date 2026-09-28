// Isolated tests of the production functions. No Firebase/Brevo network calls.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../functions/index.js'), 'utf8');

function setup(initial = {}, fetchImpl = async () => ({ ok: true })) {
  const state = new Map(Object.entries(initial));
  let failCommit = false;
  const ref = path => ({ id: path.split('/').pop(), path,
    collection: name => collection(`${path}/${name}`),
    get: async () => snapshot(path),
  });
  const snapshot = path => ({ id: path.split('/').pop(), ref: ref(path),
    exists: state.has(path), data: () => structuredClone(state.get(path)),
  });
  function collection(path) {
    const filters = []; let count = Infinity; let cursor = '';
    return {
      doc: id => ref(`${path}/${id}`),
      where(key, op, value) { filters.push([key, op, value]); return this; },
      orderBy() { return this; }, limit(n) { count = n; return this; },
      startAfter(doc) { cursor = doc.id; return this; },
      async get() {
        const docs = [...state.keys()].filter(k => k.startsWith(`${path}/`) && !k.slice(path.length + 1).includes('/'))
          .sort().map(snapshot).filter(d => d.id > cursor && filters.every(([k, op, v]) =>
            op === 'in' ? v.includes(d.data()[k]) : d.data()[k] === v)).slice(0, count);
        return { docs, empty: !docs.length, size: docs.length };
      },
    };
  }
  const db = { collection, async runTransaction(fn) {
    const pending = [];
    const result = await fn({ get: r => r.get(), set: (r, data) => pending.push([r.path, data]) });
    if (failCommit) { failCommit = false; throw new Error('simulated commit failure'); }
    for (const [path, data] of pending) state.set(path, { ...state.get(path), ...data });
    return result;
  } };
  const course = JSON.parse(fs.readFileSync(require('node:path').join(__dirname, '../functions/data/stress-reset-course.json'), 'utf8'));
  const ctx = { db, fetch: fetchImpl, AbortSignal, Date, Set, Map, console,
    FieldValue: { serverTimestamp: () => 'server-time' }, FieldPath: { documentId: () => '__name__' },
    numberValue: (v, d) => Number.isFinite(Number(v)) ? Number(v) : d,
    reservedValusCents: b => Number(b.valus_reserved_cents || 0),
    normalizeEmail: v => String(v || '').trim().toLowerCase(),
    cleanString: (v, n) => String(v || '').trim().slice(0, n),
    digistoreProductIdNumber: v => String(v),
    stressResetCourse: course,
    STRESS_RESET_BY_DIGISTORE_ID: new Map(course.products.map(p => [String(p.digistoreProductId), p])),
    IPN_PAID_EVENTS: new Set(['payment']), IPN_REVERSAL_EVENTS: new Set(['refund', 'chargeback']),
    COURSE_ORDERS: 'course_orders', BREVO_BUYER_LIST_ID: 8, brevoApiKey: { value: () => 'mock-secret' },
    logger: { error() {}, warn() {}, info() {} },
  };
  vm.createContext(ctx);
  for (const [start, end] of [
    ['async function releaseValusReservation(', '// Stuendlich'],
    ['async function syncCourseBuyer(', 'exports.syncCourseBuyerToBrevo'],
    ['function courseOrderDocId(', '// Kaeufe, die vor dieser Funktion'],
    ['async function courseOrdersFor(', 'async function signedCourseUrl('],
  ]) vm.runInContext(source.slice(source.indexOf(start), source.indexOf(end, source.indexOf(start))), ctx);
  return { ctx, state, ref, failNextCommit: () => { failCommit = true; } };
}

function reservation(status = 'coupon_failed') {
  return {
    'users/u/balances/current': { valus_reserved_cents: 900 },
    'users/u/kurs_redemptions/sr-test': { status, reserved_cents: 400 },
    'digistore_redemptions/sr-test': { status, uid: 'u', redemption_collection: 'kurs_redemptions', voucher_expires_at: '2099-01-01' },
  };
}

test('failed voucher releases immediately; repeating cannot subtract twice', async () => {
  const { ctx, state } = setup(reservation());
  assert.equal(await ctx.releaseExpiredReservations('digistore_redemptions'), 1);
  assert.equal(await ctx.releaseExpiredReservations('digistore_redemptions'), 0);
  assert.equal(state.get('users/u/balances/current').valus_reserved_cents, 500);
  assert.equal(state.get('digistore_redemptions/sr-test').reservation_released, true);
});
test('transaction failure leaves all records recoverable by the next run', async () => {
  const { ctx, state, failNextCommit } = setup(reservation());
  failNextCommit();
  assert.equal(await ctx.releaseExpiredReservations('digistore_redemptions'), 0);
  assert.equal(state.get('users/u/balances/current').valus_reserved_cents, 900);
  assert.equal(state.get('digistore_redemptions/sr-test').status, 'coupon_failed');
  assert.equal(await ctx.releaseExpiredReservations('digistore_redemptions'), 1);
});
test('a payment received after selection prevents release and status overwrite', async () => {
  const initial = reservation('paid'); const { ctx, state } = setup(initial);
  assert.equal(await ctx.releaseValusReservation('u', 'kurs_redemptions', 'sr-test', 'expired', 'digistore_redemptions'), false);
  assert.equal(state.get('digistore_redemptions/sr-test').status, 'paid');
  assert.equal(state.get('users/u/balances/current').valus_reserved_cents, 900);
});
test('pagination releases 501 expired reservations beyond finished historical records', async () => {
  const initial = { 'users/u/balances/current': { valus_reserved_cents: 501 } };
  for (let i = 0; i < 1001; i++) {
    const id = String(i).padStart(4, '0');
    initial[`digistore_redemptions/${id}`] = { status: i < 500 ? 'expired' : 'coupon_created', uid: 'u', voucher_expires_at: '2020-01-01' };
    initial[`users/u/kinderbuch_redemptions/${id}`] = { status: 'coupon_created', reserved_cents: 1 };
  }
  const { ctx, state } = setup(initial);
  assert.equal(await ctx.releaseExpiredReservations('digistore_redemptions'), 501);
  assert.equal(state.get('users/u/balances/current').valus_reserved_cents, 0);
});
test('unexpired voucher is not released', async () => {
  const { ctx } = setup(reservation('coupon_created'));
  assert.equal(await ctx.releaseExpiredReservations('digistore_redemptions'), 0);
});
test('Brevo error remains unsynced; retry succeeds without changing newsletter status', async () => {
  let count = 0; let body;
  const { ctx, state, ref } = setup({ 'course_orders/order': { status: 'paid', email: 'buyer@example.test' } }, async (_, options) => {
    body = JSON.parse(options.body); return ++count === 1 ? { ok: false, status: 503 } : { ok: true };
  });
  await assert.rejects(ctx.syncCourseBuyer(ref('course_orders/order')), /503/);
  assert.equal(state.get('course_orders/order').brevo_buyer_synced_at, undefined);
  assert.equal(await ctx.syncCourseBuyer(ref('course_orders/order')), true);
  assert.equal(await ctx.syncCourseBuyer(ref('course_orders/order')), false);
  assert.equal(count, 2);
  assert.deepEqual(body, { email: 'buyer@example.test', listIds: [8], updateEnabled: true });
});
test('stale event does not sync a refunded order', async () => {
  const { ctx, ref } = setup({ 'course_orders/order': { status: 'refunded', email: 'buyer@example.test' } }, async () => { throw Error('must not call'); });
  assert.equal(await ctx.syncCourseBuyer(ref('course_orders/order')), false);
});
test('changed purchase email is synced even if previous email was marked complete', async () => {
  let target;
  const { ctx, ref } = setup({ 'course_orders/order': { status: 'paid', email: 'new@example.test', brevo_buyer_synced_at: 'old', brevo_buyer_synced_email: 'old@example.test' } }, async (_, options) => { target = JSON.parse(options.body).email; return { ok: true }; });
  assert.equal(await ctx.syncCourseBuyer(ref('course_orders/order')), true);
  assert.equal(target, 'new@example.test');
});
test('refund is sticky against delayed payment; other valid bundle remains entitled', async () => {
  const { ctx } = setup();
  const p = { order_id: 'SINGLE', product_id: '643822', email: 'buyer@example.test' };
  await ctx.recordCourseOrder(p, 'payment');
  await ctx.recordCourseOrder(p, 'refund');
  await ctx.recordCourseOrder(p, 'payment');
  let orders = await ctx.courseOrdersFor('u', p.email);
  assert.equal(orders.some(o => o.status === 'paid'), false);
  await ctx.recordCourseOrder({ ...p, order_id: 'BUNDLE', product_id: '645388' }, 'payment');
  orders = await ctx.courseOrdersFor('u', p.email);
  assert.equal(orders.filter(o => o.status === 'paid').length, 1);
  assert.equal(orders.find(o => o.status === 'paid').modules.includes('m4'), true);
});
