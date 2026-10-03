const assert = require('node:assert/strict');
module.exports = function checkFixture(host, fixture) {
  const grants = JSON.parse(host.run('JSON.stringify(caseBriefHostApi.matterGrantConfiguration)'));
  assert.deepEqual(grants, fixture.actor_grants);
  assert.deepEqual(fixture.actor_grants[fixture.actor.id], fixture.actor.allowed_matter_ids);
  const matters = new Set([...Object.values(fixture.actor_grants).flat(), ...fixture.actor.denied_matter_ids,
    fixture.matter.id, fixture.wrong_matter_probe.requested_matter_id,
    ...JSON.parse(host.run('JSON.stringify(Object.keys(workspace.cases))')), 'unknown-matter']);
  for (const actorId of [...Object.keys(fixture.actor_grants), 'unknown-actor']) {
    for (const matterId of matters) {
      const expected = fixture.actor_grants[actorId]?.includes(matterId) ?? false;
      const args = `${JSON.stringify({id:actorId})},${JSON.stringify(matterId)}`;
      assert.equal(host.run(`caseBriefHostApi.authorizeMatter(${args})`), expected, `host authorization drift: ${actorId}/${matterId}`);
      assert.equal(host.run(`caseBriefHostControls.authorizedMatter(${args})`), expected, `adapter authorization drift: ${actorId}/${matterId}`);
    }
  }
  assert.equal(host.run('caseBriefHostApi.authorizeMatter(null,"matter-001")'), false);
  for (const id of fixture.actor.denied_matter_ids)
    assert.equal(host.run(`caseBriefHostApi.authorizeMatter(${JSON.stringify(fixture.actor)},${JSON.stringify(id)})`), false);
  assert.equal(host.run(`caseBriefHostApi.authorizeMatter({id:${JSON.stringify(fixture.wrong_matter_probe.actor_id)}},${JSON.stringify(fixture.wrong_matter_probe.requested_matter_id)})`), false);
  const ledger = JSON.parse(host.run('JSON.stringify(caseBriefHostControls.expectationLedger)'));
  assert.deepEqual(ledger.filter(e=>e.matterId===fixture.matter.id).map(e=>({record_id:e.recordId,record_type:e.recordType,basis_source_ids:e.basisSourceIds})), fixture.matter.independent_expected_records.map(({record_id,record_type,basis_source_ids})=>({record_id,record_type,basis_source_ids})));
  const trusted = JSON.parse(host.run('JSON.stringify([...new Set([...caseBriefHostControls.reviewedFindingCatalog.values()].flatMap(x=>x.sources))].sort())'));
  assert.deepEqual(trusted, [...fixture.matter.trusted_source_ids].sort());
};
