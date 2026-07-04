import { OrchestrationBootFlow } from './orchestration-boot-flow';

describe('OrchestrationBootFlow', () => {
  it('VALID: {bootstrap twice} => idempotent across repeat calls', () => {
    // Point the home at a nonexistent dir so normalization reads the paused default and
    // never touches the developer's real ~/.dungeonmaster. Subsequent bootstrap calls
    // must no-op once the first normalization has been kicked.
    process.env.DUNGEONMASTER_HOME = '/tmp/dm-orchestration-boot-flow-nonexistent';
    let threw = false;
    try {
      OrchestrationBootFlow.bootstrap();
      OrchestrationBootFlow.bootstrap();
    } catch {
      threw = true;
    }
    Reflect.deleteProperty(process.env, 'DUNGEONMASTER_HOME');

    expect(threw).toBe(false);
  });
});
