import { architectureBackRefBroker } from './architecture-back-ref-broker';
import { architectureBackRefBrokerProxy } from './architecture-back-ref-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';

describe('architectureBackRefBroker', () => {
  describe('responder file with PascalCase export', () => {
    it('VALID: {orchestrator responder} => returns packages/orchestrator (ChatReplayResponder)', () => {
      const proxy = architectureBackRefBrokerProxy();
      proxy.setupSource({
        content: ContentTextStub({
          value: 'export const ChatReplayResponder = (input: Input) => {};',
        }),
      });

      const result = architectureBackRefBroker({
        filePath: AbsoluteFilePathStub({
          value: '/repo/packages/orchestrator/src/responders/chat/replay/chat-replay-responder.ts',
        }),
        projectRoot: AbsoluteFilePathStub({ value: '/repo' }),
      });

      expect(String(result)).toBe('packages/orchestrator (ChatReplayResponder)');
    });
  });

  describe('binding file with camelCase export', () => {
    it('VALID: {web binding} => returns packages/web (useQuestQueueBinding)', () => {
      const proxy = architectureBackRefBrokerProxy();
      proxy.setupSource({
        content: ContentTextStub({
          value: 'export const useQuestQueueBinding = () => {};',
        }),
      });

      const result = architectureBackRefBroker({
        filePath: AbsoluteFilePathStub({
          value: '/repo/packages/web/src/bindings/use-quest-queue/use-quest-queue-binding.ts',
        }),
        projectRoot: AbsoluteFilePathStub({ value: '/repo' }),
      });

      expect(String(result)).toBe('packages/web (useQuestQueueBinding)');
    });
  });

  describe('file outside packages/', () => {
    it('EMPTY: {repo-root file} => returns null', () => {
      const proxy = architectureBackRefBrokerProxy();
      proxy.setupMissing();

      const result = architectureBackRefBroker({
        filePath: AbsoluteFilePathStub({
          value: '/repo/scripts/build.ts',
        }),
        projectRoot: AbsoluteFilePathStub({ value: '/repo' }),
      });

      expect(result).toBe(null);
    });
  });

  describe('missing file', () => {
    it('EMPTY: {file not found} => returns null', () => {
      const proxy = architectureBackRefBrokerProxy();
      proxy.setupMissing();

      const result = architectureBackRefBroker({
        filePath: AbsoluteFilePathStub({
          value: '/repo/packages/web/src/missing.ts',
        }),
        projectRoot: AbsoluteFilePathStub({ value: '/repo' }),
      });

      expect(result).toBe(null);
    });
  });

  describe('source has no matching export', () => {
    it('EMPTY: {imports only, no export} => returns null', () => {
      const proxy = architectureBackRefBrokerProxy();
      proxy.setupSource({
        content: ContentTextStub({
          value: 'import x from "y";\nconst foo = 1;',
        }),
      });

      const result = architectureBackRefBroker({
        filePath: AbsoluteFilePathStub({
          value: '/repo/packages/web/src/bindings/use-x/use-x-binding.ts',
        }),
        projectRoot: AbsoluteFilePathStub({ value: '/repo' }),
      });

      expect(result).toBe(null);
    });
  });
});
