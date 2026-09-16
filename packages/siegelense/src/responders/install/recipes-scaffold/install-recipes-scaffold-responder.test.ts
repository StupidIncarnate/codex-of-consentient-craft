import { FilePathStub, InstallContextStub } from '@dungeonmaster/shared/contracts';
import { InstallRecipesScaffoldResponderProxy } from './install-recipes-scaffold-responder.proxy';

const CONTEXT = InstallContextStub({
  value: {
    targetProjectRoot: FilePathStub({ value: '/project' }),
    dungeonmasterRoot: FilePathStub({ value: '/dm-root' }),
  },
});

describe('InstallRecipesScaffoldResponder', () => {
  describe('package absent', () => {
    it('VALID: {packages/siegelense-recipes absent} => created, with an empty src/', async () => {
      const proxy = InstallRecipesScaffoldResponderProxy();
      proxy.setupPackageAbsent();

      const result = await proxy.callResponder({ context: CONTEXT });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/siegelense',
        success: true,
        action: 'created',
        message: 'Created packages/siegelense-recipes/src/',
      });
      expect(proxy.getCreatedDirs()).toStrictEqual(['/project/packages/siegelense-recipes/src']);
    });
  });

  describe('package present, holding a recipe', () => {
    it('VALID: {packages/siegelense-recipes present} => nothing written, existing contents survive untouched', async () => {
      const proxy = InstallRecipesScaffoldResponderProxy();
      proxy.setupPackagePresent();

      const result = await proxy.callResponder({ context: CONTEXT });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/siegelense',
        success: true,
        action: 'skipped',
        message: 'packages/siegelense-recipes/ already present; left untouched',
      });
      expect(proxy.getCreatedDirs()).toStrictEqual([]);
    });
  });
});
