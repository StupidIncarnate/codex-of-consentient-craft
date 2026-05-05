import { bindingNameToFilePathTransformer } from './binding-name-to-file-path-transformer';
import { AbsoluteFilePathStub } from '../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../contracts/content-text/content-text.stub';

describe('bindingNameToFilePathTransformer', () => {
  describe('without -binding suffix', () => {
    it('VALID: {bindingName: use-quests, packageRoot: /repo/packages/web} => resolves to use-quests/use-quests-binding.ts', () => {
      const result = bindingNameToFilePathTransformer({
        bindingName: ContentTextStub({ value: 'use-quests' }),
        packageRoot: AbsoluteFilePathStub({ value: '/repo/packages/web' }),
      });

      expect(result).toBe(
        AbsoluteFilePathStub({
          value: '/repo/packages/web/src/bindings/use-quests/use-quests-binding.ts',
        }),
      );
    });

    it('VALID: {bindingName: use-quest-queue} => resolves to use-quest-queue/use-quest-queue-binding.ts', () => {
      const result = bindingNameToFilePathTransformer({
        bindingName: ContentTextStub({ value: 'use-quest-queue' }),
        packageRoot: AbsoluteFilePathStub({ value: '/repo/packages/web' }),
      });

      expect(result).toBe(
        AbsoluteFilePathStub({
          value: '/repo/packages/web/src/bindings/use-quest-queue/use-quest-queue-binding.ts',
        }),
      );
    });
  });

  describe('with -binding suffix', () => {
    it('VALID: {bindingName: use-quests-binding} => folder is use-quests, file keeps the suffix', () => {
      const result = bindingNameToFilePathTransformer({
        bindingName: ContentTextStub({ value: 'use-quests-binding' }),
        packageRoot: AbsoluteFilePathStub({ value: '/repo/packages/web' }),
      });

      expect(result).toBe(
        AbsoluteFilePathStub({
          value: '/repo/packages/web/src/bindings/use-quests/use-quests-binding.ts',
        }),
      );
    });
  });
});
