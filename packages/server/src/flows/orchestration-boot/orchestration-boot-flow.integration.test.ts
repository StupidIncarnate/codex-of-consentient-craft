import { serverAppHarness } from '../../../test/harnesses/server-app/server-app.harness';

import { OrchestrationBootFlow } from './orchestration-boot-flow';

describe('OrchestrationBootFlow', () => {
  const harness = serverAppHarness();

  it('VALID: {bootstrap twice} => idempotent across repeat calls', () => {
    // setupTestHome restores the previous home rather than deleting it: the watchers this starts
    // keep ticking, and a deleted variable would send their later ticks to the real ~/.dungeonmaster.
    const restore = harness.setupTestHome({ baseName: 'orchestration-boot-flow' });
    let threw = false;
    try {
      OrchestrationBootFlow.bootstrap();
      OrchestrationBootFlow.bootstrap();
    } catch {
      threw = true;
    }
    restore();

    expect(threw).toBe(false);
  });
});
