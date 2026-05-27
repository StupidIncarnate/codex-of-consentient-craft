import { QuestGetServerConfigResultStub } from '@dungeonmaster/orchestrator/testing';

import { orchestratorGetServerConfigAdapter } from './orchestrator-get-server-config-adapter';
import { orchestratorGetServerConfigAdapterProxy } from './orchestrator-get-server-config-adapter.proxy';

describe('orchestratorGetServerConfigAdapter', () => {
  describe('successful read', () => {
    it('VALID: {} => returns QuestGetServerConfigResult', () => {
      const proxy = orchestratorGetServerConfigAdapterProxy();
      const expected = QuestGetServerConfigResultStub();

      proxy.returns({ result: expected });

      const result = orchestratorGetServerConfigAdapter();

      expect(result).toStrictEqual(expected);
    });
  });

  describe('error cases', () => {
    it('ERROR: {orchestrator throws} => throws error', () => {
      const proxy = orchestratorGetServerConfigAdapterProxy();

      proxy.throws({ error: new Error('Config unavailable') });

      expect(() => orchestratorGetServerConfigAdapter()).toThrow(/Config unavailable/u);
    });
  });
});
