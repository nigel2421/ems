import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateCoordinatorStep } from '../utils/coordinatorOnboarding.js';
import { getRoleDisplayName } from '../utils/roleDisplay.js';

test('profile requires a name, a Kenyan mobile number, and a valid optional email', () => {
  assert.ok(validateCoordinatorStep(0, { name: ' ', phone: '0712345678' }));
  assert.ok(validateCoordinatorStep(0, { name: 'Jane', phone: '123' }));
  assert.ok(validateCoordinatorStep(0, { name: 'Jane', phone: '0712345678', email: 'invalid' }));
  for (const phone of ['0712345678', '+254712345678', '0112345678', '+254 712 345 678']) {
    assert.equal(validateCoordinatorStep(0, { name: 'Jane', phone }), '');
  }
});

test('assignment cannot progress without a completed in-scope station selection', () => {
  for (const locationMeta of [{}, { complete: true }, { complete: false, pollingStationId: 'PS-1' }, { complete: true, pollingStationId: 'PS-1', effectiveScope: { failClosed: true } }]) {
    assert.ok(validateCoordinatorStep(1, { locationMeta }));
  }
  assert.equal(validateCoordinatorStep(1, { locationMeta: { complete: true, pollingStationId: 'PS-1' } }), '');
});

test('security rejects empty, weak, and mismatched passwords', () => {
  assert.ok(validateCoordinatorStep(2, {}));
  assert.ok(validateCoordinatorStep(2, { password: 'password', passwordConfirm: 'password' }));
  assert.ok(validateCoordinatorStep(2, { password: 'Secure!234', passwordConfirm: 'different' }));
  assert.equal(validateCoordinatorStep(2, { password: 'Secure!234', passwordConfirm: 'Secure!234' }), '');
});

test('legacy station roles display as coordinators without changing other roles', () => {
  assert.equal(getRoleDisplayName('Agent'), 'Polling Station Coordinator');
  assert.equal(getRoleDisplayName('Field Agent'), 'Polling Station Coordinator');
  assert.equal(getRoleDisplayName('County Coordinator'), 'County Coordinator');
  assert.equal(getRoleDisplayName('Admin'), 'Admin');
});
