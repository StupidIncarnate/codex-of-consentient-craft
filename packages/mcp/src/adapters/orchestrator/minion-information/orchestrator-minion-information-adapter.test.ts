import { MinionFamilyStub } from '../../../contracts/minion-family/minion-family.stub';

import { orchestratorMinionInformationAdapter } from './orchestrator-minion-information-adapter';
import { orchestratorMinionInformationAdapterProxy } from './orchestrator-minion-information-adapter.proxy';

describe('orchestratorMinionInformationAdapter', () => {
  // Each family gets ITS OWN payload. The three tools differ only by which one they hand back, so a
  // map wired to the wrong statics would serve a worker the planner's method and nothing would error —
  // the failure would surface as a minion doing the wrong job. The title line is what distinguishes
  // them, so that is what this asserts.
  it('VALID: {family: planner} => returns the planner payload', () => {
    orchestratorMinionInformationAdapterProxy();

    const markdown = orchestratorMinionInformationAdapter({
      family: MinionFamilyStub({ value: 'planner' }),
    });

    expect(markdown.split('\n')[0]).toBe('# Planner information');
  });

  it('VALID: {family: worker} => returns the worker payload', () => {
    orchestratorMinionInformationAdapterProxy();

    const markdown = orchestratorMinionInformationAdapter({
      family: MinionFamilyStub({ value: 'worker' }),
    });

    expect(markdown.split('\n')[0]).toBe('# Worker information');
  });

  it('VALID: {family: reviewer} => returns the reviewer payload', () => {
    orchestratorMinionInformationAdapterProxy();

    const markdown = orchestratorMinionInformationAdapter({
      family: MinionFamilyStub({ value: 'reviewer' }),
    });

    expect(markdown.split('\n')[0]).toBe('# Reviewer information');
  });
});
