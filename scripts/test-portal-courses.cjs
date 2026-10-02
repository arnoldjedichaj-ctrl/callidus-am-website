const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('src/scripts/portal-client.js', 'utf8');
const code = source.slice(source.indexOf('  function resetCourses()'), source.indexOf('  function todayKey()'));
function setup(response, verified = true) {
  const nodes = Object.fromEntries(['status', 'modules', 'help', 'open', 'verify', 'offer', 'support', 'retry'].map(id => [`portal-course-${id}`, { hidden: true, textContent: '', disabled: false }]));
  const rows = ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'bonus'].map(id => {
    const open = { hidden: true }, locked = { hidden: false };
    return { dataset: { courseModule: id }, open, locked, querySelector: selector => selector === '[data-course-open]' ? open : locked };
  });
  const user = { uid: 'buyer', email: 'buyer@example.test', emailVerified: verified, reload: async () => {}, getIdToken: async () => {} };
  let calls = 0;
  const ctx = { courseRequest: 0, root: { isConnected: true, querySelectorAll: () => rows }, state: { user, fns: {}, api: { httpsCallable: () => async () => { calls++; return typeof response === 'function' ? response() : { data: response }; } } }, $: id => nodes[id], text: (id, value) => { nodes[id].textContent = value; } };
  vm.createContext(ctx);
  vm.runInContext(code, ctx);
  return { ctx, user, rows, nodes, calls: () => calls };
}
test('unverified email cannot be presented as a missing purchase', async () => {
  const s = setup({ owned: [] }, false); await s.ctx.loadCourses(s.user);
  assert.equal(s.calls(), 0); assert.equal(s.nodes['portal-course-verify'].hidden, false);
  assert.equal(s.nodes['portal-course-offer'].hidden, true);
});
test('single module only exposes its own course link', async () => {
  const s = setup({ owned: ['m4', 'unknown'] }); await s.ctx.loadCourses(s.user);
  assert.deepEqual(s.rows.filter(r => !r.open.hidden).map(r => r.dataset.courseModule), ['m4']);
  assert.equal(s.nodes['portal-course-status'].textContent, '1 von 8 Kursinhalten sind freigeschaltet.');
});
test('complete entitlement includes seven modules and bonus', async () => {
  const s = setup({ owned: ['m1','m2','m3','m4','m5','m6','m7','bonus'] }); await s.ctx.loadCourses(s.user);
  assert.equal(s.rows.filter(r => !r.open.hidden).length, 8);
  assert.match(s.nodes['portal-course-status'].textContent, /Komplettkurs/);
});
test('no entitlement includes delay and wrong-email guidance', async () => {
  const s = setup({ owned: [] }); await s.ctx.loadCourses(s.user);
  assert.equal(s.nodes['portal-course-open'].hidden, true);
  assert.match(s.nodes['portal-course-help'].textContent, /ein bis zwei Minuten/);
  assert.match(s.nodes['portal-course-help'].textContent, /anderen Kauf-E-Mail/);
});
test('service error never renders a missing-purchase or sales state', async () => {
  const s = setup(() => { throw Error('unavailable'); }); await s.ctx.loadCourses(s.user);
  assert.match(s.nodes['portal-course-status'].textContent, /nicht geprüft/);
  assert.equal(s.nodes['portal-course-offer'].hidden, true);
  assert.equal(s.nodes['portal-course-retry'].disabled, false);
});
test('late response after account switch cannot restore previous entitlements', async () => {
  let resolve;
  const s = setup(() => new Promise(r => { resolve = r; }));
  const pending = s.ctx.loadCourses(s.user);
  while (!resolve) await Promise.resolve();
  s.ctx.state.user = { uid: 'other' }; s.ctx.resetCourses();
  resolve({ data: { owned: ['m4'] } }); await pending;
  assert.equal(s.nodes['portal-course-modules'].hidden, true);
  assert.equal(s.rows.some(r => !r.open.hidden), false);
});
test('refresh removes an entitlement revoked since the last check', async () => {
  let owned = ['m4']; const s = setup(() => ({ data: { owned } }));
  await s.ctx.loadCourses(s.user); owned = []; await s.ctx.loadCourses(s.user);
  assert.equal(s.rows.some(r => !r.open.hidden), false);
  assert.equal(s.nodes['portal-course-open'].hidden, true);
});
