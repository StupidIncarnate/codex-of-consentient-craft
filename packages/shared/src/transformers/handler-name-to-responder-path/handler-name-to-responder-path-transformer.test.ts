import { handlerNameToResponderPathTransformer } from './handler-name-to-responder-path-transformer';
import { ContentTextStub } from '../../contracts/content-text/content-text.stub';
import { AbsoluteFilePathStub } from '../../contracts/absolute-file-path/absolute-file-path.stub';

const PKG_SRC = AbsoluteFilePathStub({ value: '/repo/packages/mcp/src' });

describe('handlerNameToResponderPathTransformer', () => {
  describe('ArchitectureHandleResponder', () => {
    it('VALID: {ArchitectureHandleResponder} => architecture handle responder path', () => {
      const result = handlerNameToResponderPathTransformer({
        handlerName: ContentTextStub({ value: 'ArchitectureHandleResponder' }),
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
        handlerName: ContentTextStub({ value: 'QuestHandleResponder' }),
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
        handlerName: ContentTextStub({ value: 'InteractionHandleResponder' }),
        packageSrcPath: PKG_SRC,
      });

      expect(String(result)).toBe(
        '/repo/packages/mcp/src/responders/interaction/handle/interaction-handle-responder.ts',
      );
    });
  });
});
