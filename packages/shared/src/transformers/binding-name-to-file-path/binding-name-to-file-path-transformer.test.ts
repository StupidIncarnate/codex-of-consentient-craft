import { bindingNameToFilePathTransformer } from './binding-name-to-file-path-transformer';

describe('bindingNameToFilePathTransformer', () => {
  describe('without -binding suffix', () => {
    it('VALID: {bindingName: use-quests, packageRoot: /repo/packages/web} => resolves to use-quests/use-quests-binding.ts', () => {
      const result = bindingNameToFilePathTransformer({
        bindingName: 'use-quests',
        packageRoot: '/repo/packages/web',
      });

      expect(result).toBe(
        '/repo/packages/web/src/bindings/use-quests/use-quests-binding.ts',
      );
    });

    it('VALID: {bindingName: use-quest-queue} => resolves to use-quest-queue/use-quest-queue-binding.ts', () => {
      const result = bindingNameToFilePathTransformer({
        bindingName: 'use-quest-queue',
        packageRoot: '/repo/packages/web',
      });

      expect(result).toBe(
        '/repo/packages/web/src/bindings/use-quest-queue/use-quest-queue-binding.ts',
      );
    });
  });

  describe('with -binding suffix', () => {
    it('VALID: {bindingName: use-quests-binding} => folder is use-quests, file keeps the suffix', () => {
      const result = bindingNameToFilePathTransformer({
        bindingName: 'use-quests-binding',
        packageRoot: '/repo/packages/web',
      });

      expect(result).toBe(
        '/repo/packages/web/src/bindings/use-quests/use-quests-binding.ts',
      );
    });
  });
});
