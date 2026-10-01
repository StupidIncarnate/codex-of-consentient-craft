import { architectureOrchestratorMethodExtractBroker } from './architecture-orchestrator-method-extract-broker';
import { architectureOrchestratorMethodExtractBrokerProxy } from './architecture-orchestrator-method-extract-broker.proxy';

const RESPONDER_PATH = '/repo/packages/server/src/responders/quest/start/quest-start-responder.ts';
const ADAPTER_PATH =
  '/repo/packages/server/src/adapters/orchestrator/start/start-orchestrator-adapter.ts';

describe('architectureOrchestratorMethodExtractBroker', () => {
  describe('null responder file', () => {
    it('EMPTY: {null serverResponderFile} => returns null', () => {
      architectureOrchestratorMethodExtractBrokerProxy().setupFiles({});

      const result = architectureOrchestratorMethodExtractBroker({ serverResponderFile: null });

      expect(result).toBe(null);
    });
  });

  describe('missing responder file', () => {
    it('EMPTY: {responder file not found} => returns null', () => {
      architectureOrchestratorMethodExtractBrokerProxy().setupFiles({});

      const result = architectureOrchestratorMethodExtractBroker({
        serverResponderFile: RESPONDER_PATH,
      });

      expect(result).toBe(null);
    });
  });

  describe('responder without orchestrator adapter', () => {
    it('EMPTY: {no orchestrator adapter import} => returns null', () => {
      architectureOrchestratorMethodExtractBrokerProxy().setupFiles({
        [RESPONDER_PATH]: `import { someHelper } from '../helpers/helper';
export const questStartResponder = async (c: Context) => {};`,
      });

      const result = architectureOrchestratorMethodExtractBroker({
        serverResponderFile: RESPONDER_PATH,
      });

      expect(result).toBe(null);
    });
  });

  describe('responder with orchestrator adapter', () => {
    it('VALID: {responder imports orchestrator adapter with namespace call} => returns namespace call', () => {
      architectureOrchestratorMethodExtractBrokerProxy().setupFiles({
        [RESPONDER_PATH]: `import { StartOrchestrator } from '../../../adapters/orchestrator/start/start-orchestrator-adapter';
export const questStartResponder = async (c: Context) => {};`,
        [ADAPTER_PATH]: `StartOrchestrator.startQuest({ questId })`,
      });

      const result = architectureOrchestratorMethodExtractBroker({
        serverResponderFile: RESPONDER_PATH,
      });

      expect(String(result)).toBe('StartOrchestrator.startQuest({...})');
    });
  });

  describe('responder with direct orchestrator import', () => {
    it('VALID: {responder imports @dungeonmaster/orchestrator and calls StartOrchestrator} => returns namespace call', () => {
      architectureOrchestratorMethodExtractBrokerProxy().setupFiles({
        [RESPONDER_PATH]: `import { StartOrchestrator } from '@dungeonmaster/orchestrator';
export const questStartResponder = async () => {
  const quest = await StartOrchestrator.startQuest({ questId });
};`,
      });

      const result = architectureOrchestratorMethodExtractBroker({
        serverResponderFile: RESPONDER_PATH,
      });

      expect(String(result)).toBe('StartOrchestrator.startQuest({...})');
    });

    it('VALID: {responder imports subpath and has other calls before StartOrchestrator} => returns StartOrchestrator call', () => {
      architectureOrchestratorMethodExtractBrokerProxy().setupFiles({
        [RESPONDER_PATH]: `import { StartOrchestrator } from '@dungeonmaster/orchestrator/startup/start-orchestrator';
export const questStartResponder = async () => {
  const parsed = JSON.parse('{}');
  await StartOrchestrator.addQuest({ title });
};`,
      });

      const result = architectureOrchestratorMethodExtractBroker({
        serverResponderFile: RESPONDER_PATH,
      });

      expect(String(result)).toBe('StartOrchestrator.addQuest({...})');
    });

    it('EMPTY: {responder imports @dungeonmaster/orchestrator but has no StartOrchestrator call} => returns null', () => {
      architectureOrchestratorMethodExtractBrokerProxy().setupFiles({
        [RESPONDER_PATH]: `import { questFindQuestPathBroker } from '@dungeonmaster/orchestrator';
export const questStartResponder = async () => {};`,
      });

      const result = architectureOrchestratorMethodExtractBroker({
        serverResponderFile: RESPONDER_PATH,
      });

      expect(result).toBe(null);
    });
  });
});
