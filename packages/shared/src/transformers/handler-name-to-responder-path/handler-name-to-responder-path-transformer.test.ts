import { handlerNameToResponderPathTransformer } from './handler-name-to-responder-path-transformer';

const PKG_SRC = '/repo/packages/mcp/src';

describe('handlerNameToResponderPathTransformer', () => {
  describe('ArchitectureHandleResponder', () => {
    it('VALID: {ArchitectureHandleResponder} => architecture handle responder path', () => {
      const result = handlerNameToResponderPathTransformer({
        handlerName: 'ArchitectureHandleResponder',
        packageSrcPath: PKG_SRC,
      });

      expect(String(result)).toBe(
        '/repo/packages/mcp/src/responders/architecture/handle/architecture-handle-responder.ts',
      );
    });
  });

  describe('QuestHandleResponder', () => {
    it('VALID: {QuestHandleResponder} => quest handle responder path', () => {
      const result = handlerNameToResponderPathTransformer({
        handlerName: 'QuestHandleResponder',
        packageSrcPath: PKG_SRC,
      });

      expect(String(result)).toBe(
        '/repo/packages/mcp/src/responders/quest/handle/quest-handle-responder.ts',
      );
    });
  });

  describe('InteractionHandleResponder', () => {
    it('VALID: {InteractionHandleResponder} => interaction handle responder path', () => {
      const result = handlerNameToResponderPathTransformer({
        handlerName: 'InteractionHandleResponder',
        packageSrcPath: PKG_SRC,
      });

      expect(String(result)).toBe(
        '/repo/packages/mcp/src/responders/interaction/handle/interaction-handle-responder.ts',
      );
    });
  });
});
