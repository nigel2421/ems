import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolveCoordinatorAssignmentScope, getCoordinatorAssignmentOptions, resolveCoordinatorStationAssignment } from '../utils/coordinatorAssignment.js';

const geography = {
  counties: [{ id: 'C1', name: 'Nairobi' }, { id: 'C2', name: 'Mombasa' }],
  constituencies: [{ id: 'MP1', countyId: 'C1', name: 'Westlands' }, { id: 'MP2', countyId: 'C1', name: 'Langata' }, { id: 'MP3', countyId: 'C2', name: 'Nyali' }],
  wards: [{ id: 'W1', constituencyId: 'MP1', name: 'Parklands' }, { id: 'W2', constituencyId: 'MP1', name: 'Kitisuru' }, { id: 'W3', constituencyId: 'MP2', name: 'Karen' }],
  pollingStations: [{ id: 'PS1', wardId: 'W1', centreName: 'Primary School', name: 'Stream 1' }, { id: 'PS2', wardId: 'W2', centreName: 'Secondary School', name: 'Stream 2' }, { id: 'PS3', wardId: 'W3', centreName: 'Academy', name: 'Stream 3' }]
};

test('MP legacy profile locks county and constituency using assignedEntity', () => {
  const scope = resolveCoordinatorAssignmentScope({ role: 'MP', assignedEntity: 'MP1' }, geography);
  assert.equal(scope.isConfigured, true);
  assert.equal(scope.locked.county, 'Nairobi');
  assert.equal(scope.locked.constituency, 'Westlands');
  assert.deepEqual(scope.selectableLevels, ['WARD', 'POLLING_CENTRE', 'POLLING_STREAM']);
  const options = getCoordinatorAssignmentOptions(scope, geography);
  assert.deepEqual(options.wards.map(item => item.id), ['W1', 'W2']);
  assert.deepEqual(options.centres, []);
});

test('campaign admin uses parliamentary contest from their profile', () => {
  const scope = resolveCoordinatorAssignmentScope({ role: 'Candidate/Campaign Admin', contestType: 'Parliamentary', assignedEntity: 'MP1' }, geography);
  assert.equal(scope.constituency.id, 'MP1');
  assert.ok(!scope.selectableLevels.includes('CONSTITUENCY'));
});

test('Governor selects constituencies within their county; MCA starts at polling centres', () => {
  const governor = resolveCoordinatorAssignmentScope({ role: 'Governor', assignedEntity: 'C1' }, geography);
  assert.deepEqual(getCoordinatorAssignmentOptions(governor, geography).constituencies.map(item => item.id), ['MP1', 'MP2']);
  const mca = resolveCoordinatorAssignmentScope({ role: 'MCA', assignedEntity: 'W1' }, geography);
  assert.deepEqual(mca.selectableLevels, ['POLLING_CENTRE', 'POLLING_STREAM']);
  assert.deepEqual(getCoordinatorAssignmentOptions(mca, geography).centres, ['Primary School']);
});

test('incomplete, contradictory, unknown, or ambiguous profiles fail closed', () => {
  for (const user of [
    { role: 'MP' }, { role: 'MCA', county: 'Nairobi' },
    { role: 'MP', assignedEntity: 'MP1', constituency: 'Langata' },
    { role: 'MP', assignedEntity: 'MP1', county: 'Mombasa' },
    { role: 'Aspirant', contestType: 'Unknown', assignedEntity: 'MP1' }
  ]) {
    const scope = resolveCoordinatorAssignmentScope(user, geography);
    assert.equal(scope.failClosed, true, JSON.stringify(user));
    assert.deepEqual(getCoordinatorAssignmentOptions(scope, geography).wards, []);
  }
});

test('stale and forged child selections never retain an out-of-scope station', () => {
  const user = { role: 'MP', assignedEntity: 'MP1' };
  assert.equal(resolveCoordinatorStationAssignment(user, geography, 'PS1').complete, true);
  assert.equal(resolveCoordinatorStationAssignment(user, geography, 'PS3').complete, false);
  assert.equal(resolveCoordinatorStationAssignment(user, geography, 'missing').complete, false);
  const scope = resolveCoordinatorAssignmentScope(user, geography);
  const oldSelection = { wardId: 'W2', pollingCentreName: 'Primary School', pollingStationId: 'PS1' };
  const options = getCoordinatorAssignmentOptions(scope, geography, oldSelection);
  assert.equal(options.location.complete, false);
  assert.equal(options.location.pollingStationId, '');
});

test('admin can choose nationwide; stream choices require a polling centre', () => {
  const scope = resolveCoordinatorAssignmentScope({ role: 'Admin', assignedEntity: 'GLOBAL' }, geography);
  assert.equal(getCoordinatorAssignmentOptions(scope, geography).counties.length, 2);
  assert.deepEqual(getCoordinatorAssignmentOptions(scope, geography, { countyId: 'C1', constituencyId: 'MP1', wardId: 'W1' }).stations, []);
});

test('real MP and MCA profiles resolve official IEBC IDs, names, and ward codes', () => {
  const official = JSON.parse(readFileSync(new URL('../data/iebcGeographyData.json', import.meta.url), 'utf8'));
  const mp = resolveCoordinatorAssignmentScope({ role: 'MP', county: 'Nairobi', constituency: 'Westlands', assignedEntity: 'CONST-274' }, official);
  assert.equal(mp.isConfigured, true);
  const mca = resolveCoordinatorAssignmentScope({ role: 'MCA', county: 'Nairobi City County', constituency: 'Westlands', ward: 'Parklands/Highridge', assignedEntity: '1367' }, official);
  assert.equal(mca.isConfigured, true);
  assert.equal(mca.ward.id, 'WARD-1367');
});
