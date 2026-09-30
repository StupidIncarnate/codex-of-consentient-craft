import { architectureBackRefBroker } from './architecture-back-ref-broker';
import { architectureBackRefBrokerProxy } from './architecture-back-ref-broker.proxy';

describe('architectureBackRefBroker', () => {
  describe('responder file with PascalCase export', () => {
    it('VALID: {orchestrator responder} => returns packages/orchestrator (ChatReplayResponder)', () => {
      const proxy = architectureBackRefBrokerProxy();
      const filePath = '/repo/packages/orchestrator/src/responders/chat/replay/chat-replay-responder.ts';
      proxy.setupSource({
        filePath,
        content: 'export const ChatReplayResponder = (input: Input) => {};',
      });

      const result = architectureBackRefBroker({
        filePath,
        projectRoot: '/repo',
      });

      expect(String(result)).toBe('packages/orchestrator (ChatReplayResponder)');
    });
  });

  describe('binding file with camelCase export', () => {
    it('VALID: {web binding} => returns packages/web (useQuestQueueBinding)', () => {
      const proxy = architectureBackRefBrokerProxy();
      const filePath = '/repo/packages/web/src/bindings/use-quest-queue/use-quest-queue-binding.ts';
      proxy.setupSource({
        filePath,
        content: 'export const useQuestQueueBinding = () => {};',
      });

      const result = architectureBackRefBroker({
        filePath,
        projectRoot: '/repo',
      });

      expect(String(result)).toBe('packages/web (useQuestQueueBinding)');
    });
  });

  describe('file outside packages/', () => {
    it('EMPTY: {repo-root file} => returns null', () => {
      const proxy = architectureBackRefBrokerProxy();
      const filePath = '/repo/scripts/build.ts';
      proxy.setupMissing({ filePath });

      const result = architectureBackRefBroker({
        filePath,
        projectRoot: '/repo',
      });

      expect(result).toBe(null);
    });
  });

  describe('missing file', () => {
    it('EMPTY: {file not found} => returns null', () => {
      const proxy = architectureBackRefBrokerProxy();
      const filePath = '/repo/packages/web/src/missing.ts';
      proxy.setupMissing({ filePath });

      const result = architectureBackRefBroker({
        filePath,
        projectRoot: '/repo',
      });

      expect(result).toBe(null);
    });
  });

  describe('source has no matching export', () => {
    it('EMPTY: {imports only, no export} => returns null', () => {
      const proxy = architectureBackRefBrokerProxy();
      const filePath = '/repo/packages/web/src/bindings/use-x/use-x-binding.ts';
      proxy.setupSource({
        filePath,
        content: 'import x from "y";\nconst foo = 1;',
      });

      const result = architectureBackRefBroker({
        filePath,
        projectRoot: '/repo',
      });

      expect(result).toBe(null);
    });
  });
});
