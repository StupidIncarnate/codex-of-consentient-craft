import { installTestbedCreateBroker, BaseNameStub } from '@dungeonmaster/testing';

import { OrchestrationBootFlow } from './orchestration-boot-flow';

describe('OrchestrationBootFlow', () => {
  it('VALID: {bootstrap twice} => starts the watchers and returns success both times', () => {
    // A testbed home, restored (never deleted) afterwards: the watchers this starts keep ticking,
    // and a deleted variable would send their later ticks to the developer's real ~/.dungeonmaster.
    const testbed = installTestbedCreateBroker({
      baseName: BaseNameStub({ value: 'mcp-orchestration-boot-flow' }),
    });
    const previousHome = process.env.DUNGEONMASTER_HOME;
    process.env.DUNGEONMASTER_HOME = testbed.guildPath;

    const first = OrchestrationBootFlow.bootstrap();
    const second = OrchestrationBootFlow.bootstrap();

    process.env.DUNGEONMASTER_HOME = previousHome;

    expect(first).toStrictEqual({ success: true });
    expect(second).toStrictEqual({ success: true });
  });
});
