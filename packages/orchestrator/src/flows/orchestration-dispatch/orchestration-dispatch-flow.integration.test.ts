import { OrchestrationDispatchFlow } from './orchestration-dispatch-flow';

describe('OrchestrationDispatchFlow', () => {
  describe('bootstrap', () => {
    it('VALID: {first call} => returns success', () => {
      // Point the home at a nonexistent dir so boot normalization reads the paused default
      // and never touches the developer's real ~/.dungeonmaster.
      process.env.DUNGEONMASTER_HOME = '/tmp/dm-dispatch-flow-integration-nonexistent';

      const result = OrchestrationDispatchFlow.bootstrap();

      Reflect.deleteProperty(process.env, 'DUNGEONMASTER_HOME');

      expect(result).toStrictEqual({ success: true });
    });

    it('VALID: {second call} => idempotent, returns success', () => {
      process.env.DUNGEONMASTER_HOME = '/tmp/dm-dispatch-flow-integration-nonexistent';
      OrchestrationDispatchFlow.bootstrap();

      const result = OrchestrationDispatchFlow.bootstrap();

      Reflect.deleteProperty(process.env, 'DUNGEONMASTER_HOME');

      expect(result).toStrictEqual({ success: true });
    });
  });

  describe('get', () => {
    it('VALID: {missing state file} => resolves the paused default', async () => {
      process.env.DUNGEONMASTER_HOME = '/tmp/dm-dispatch-flow-integration-nonexistent';

      const state = await OrchestrationDispatchFlow.get();

      Reflect.deleteProperty(process.env, 'DUNGEONMASTER_HOME');

      expect(state).toStrictEqual({
        mode: 'paused',
        updatedAt: '1970-01-01T00:00:00.000Z',
      });
    });
  });
});
