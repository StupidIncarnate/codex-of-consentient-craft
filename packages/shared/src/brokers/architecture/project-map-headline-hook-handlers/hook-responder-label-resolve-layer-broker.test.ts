import { hookResponderLabelResolveLayerBroker } from './hook-responder-label-resolve-layer-broker';
import { hookResponderLabelResolveLayerBrokerProxy } from './hook-responder-label-resolve-layer-broker.proxy';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';

describe('hookResponderLabelResolveLayerBroker', () => {
  describe('no startup source', () => {
    it('EMPTY: {startupSource: undefined} => returns fallback label', () => {
      hookResponderLabelResolveLayerBrokerProxy();

      const result = hookResponderLabelResolveLayerBroker({ startupSource: undefined });

      expect(String(result)).toBe('(responder)');
    });
  });

  describe('startup source with no flow import', () => {
    it('EMPTY: {source without flow import} => returns fallback label', () => {
      hookResponderLabelResolveLayerBrokerProxy();

      const result = hookResponderLabelResolveLayerBroker({
        startupSource: ContentTextStub({ value: 'export const StartHook = async () => {};' }),
      });

      expect(String(result)).toBe('(responder)');
    });
  });

  describe('startup source with flow import', () => {
    it('VALID: {source with flow import} => returns last path segment of import', () => {
      hookResponderLabelResolveLayerBrokerProxy();

      const result = hookResponderLabelResolveLayerBroker({
        startupSource: ContentTextStub({
          value: `import { HookPreEditFlow } from '../flows/hook-pre-edit/hook-pre-edit-flow';`,
        }),
      });

      expect(String(result)).toBe('hook-pre-edit-flow');
    });

    it('VALID: {source with nested flow import path} => returns bare file name without extension', () => {
      hookResponderLabelResolveLayerBrokerProxy();

      const result = hookResponderLabelResolveLayerBroker({
        startupSource: ContentTextStub({
          value: `import { HookWorktreeCreateFlow } from '../flows/hook-worktree-create/hook-worktree-create-flow';`,
        }),
      });

      expect(String(result)).toBe('hook-worktree-create-flow');
    });
  });
});
