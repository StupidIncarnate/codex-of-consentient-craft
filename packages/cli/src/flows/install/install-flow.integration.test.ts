import {
  installTestbedCreateBroker,
  BaseNameStub,
  RelativePathStub,
  FileContentStub,
} from '@dungeonmaster/testing';
import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { InstallFlow } from './install-flow';
import { devDependenciesStatics } from '../../statics/dev-dependencies/dev-dependencies-statics';
import { playwrightConfigTemplateStatics } from '../../statics/playwright-config-template/playwright-config-template-statics';
import { jestConfigTemplateStatics } from '../../statics/jest-config-template/jest-config-template-statics';

describe('InstallFlow', () => {
  describe('add-dev-deps + create-playwright', () => {
    it('VALID: {context: no devDependencies, no playwright config, e2e-eligible target} => adds devDependencies and creates playwright.config.ts', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'flow-add-devdeps' }),
      });

      // create-playwright now gates on e2e eligibility — give this testbed the widgets+react
      // signals so the happy path still creates a config, same as before that gate existed.
      testbed.writeFile({
        relativePath: RelativePathStub({ value: 'package.json' }),
        content: FileContentStub({
          value: JSON.stringify(
            { name: 'test-project', version: '1.0.0', dependencies: { react: '18.2.0' } },
            null,
            2,
          ),
        }),
      });
      testbed.writeFile({
        relativePath: RelativePathStub({ value: 'src/widgets/placeholder.ts' }),
        content: FileContentStub({ value: 'export const Placeholder = {};\n' }),
      });

      const result = await InstallFlow({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
        },
      });

      const packageJsonContent = testbed.readFile({
        relativePath: RelativePathStub({ value: 'package.json' }),
      });
      const playwrightConfigContent = testbed.readFile({
        relativePath: RelativePathStub({ value: 'playwright.config.ts' }),
      });
      const jestConfigContent = testbed.readFile({
        relativePath: RelativePathStub({ value: 'jest.config.js' }),
      });

      testbed.cleanup();

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/cli',
        success: true,
        action: 'created',
        message:
          'Added devDependencies to package.json; Created playwright.config.ts; Created tsconfig.json; Created jest.config.js',
      });
      expect(packageJsonContent).toMatch(/^\s*"devDependencies": \{$/mu);
      expect(packageJsonContent).toMatch(/^\s*"typescript": "\^5\.8\.3"$/mu);
      expect(packageJsonContent).toMatch(/^\s*"@playwright\/test": "\^1\.58\.2",$/mu);
      expect(playwrightConfigContent).toBe(playwrightConfigTemplateStatics.content);
      expect(jestConfigContent).toBe(jestConfigTemplateStatics.content);
    });

    it('VALID: {context: all devDependencies present, e2e-eligible target, playwright config exists} => returns skipped without overwriting', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'flow-skip-devdeps' }),
      });

      // e2e-eligible (widgets+react) so the skip below is actually exercising "config already
      // exists", not the eligibility gate short-circuiting first with a different message.
      testbed.writeFile({
        relativePath: RelativePathStub({ value: 'package.json' }),
        content: FileContentStub({
          value: JSON.stringify(
            {
              name: 'test-project',
              version: '1.0.0',
              dependencies: { react: '18.2.0' },
              devDependencies: { ...devDependenciesStatics.packages },
            },
            null,
            2,
          ),
        }),
      });
      testbed.writeFile({
        relativePath: RelativePathStub({ value: 'src/widgets/placeholder.ts' }),
        content: FileContentStub({ value: 'export const Placeholder = {};\n' }),
      });
      testbed.writeFile({
        relativePath: RelativePathStub({ value: 'playwright.config.ts' }),
        content: FileContentStub({ value: '// existing user config\n' }),
      });
      testbed.writeFile({
        relativePath: RelativePathStub({ value: 'tsconfig.json' }),
        content: FileContentStub({ value: '{}\n' }),
      });
      testbed.writeFile({
        relativePath: RelativePathStub({ value: 'jest.config.js' }),
        content: FileContentStub({ value: '// existing jest config\n' }),
      });

      const result = await InstallFlow({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
        },
      });

      const playwrightConfigContent = testbed.readFile({
        relativePath: RelativePathStub({ value: 'playwright.config.ts' }),
      });

      testbed.cleanup();

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/cli',
        success: true,
        action: 'skipped',
        message:
          'All devDependencies already present; playwright.config.ts already exists; tsconfig.json already exists; jest.config.js already exists',
      });
      expect(playwrightConfigContent).toBe('// existing user config\n');
    });

    it('VALID: {context: target has no widgets/react or ink signals} => skips playwright.config.ts without writing it', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'flow-not-e2e-eligible' }),
      });
      // No src/widgets, no react dependency — installTestbedCreateBroker's default package.json
      // (name + version only) already represents a non-eligible target.

      const result = await InstallFlow({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
        },
      });

      const playwrightConfigContent = testbed.readFile({
        relativePath: RelativePathStub({ value: 'playwright.config.ts' }),
      });

      testbed.cleanup();

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/cli',
        success: true,
        action: 'created',
        message:
          'Added devDependencies to package.json; target project is not e2e-eligible (packageType is not frontend-react or frontend-ink); Created tsconfig.json; Created jest.config.js',
      });
      expect(playwrightConfigContent).toBe(null);
    });

    it('VALID: {context: target has npm workspaces} => skips jest.config.js without writing it', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'flow-workspaces-root' }),
      });
      testbed.writeFile({
        relativePath: RelativePathStub({ value: 'package.json' }),
        content: FileContentStub({
          value: JSON.stringify(
            { name: 'monorepo-root', version: '1.0.0', workspaces: ['packages/*'] },
            null,
            2,
          ),
        }),
      });

      const result = await InstallFlow({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
        },
      });

      const jestConfigContent = testbed.readFile({
        relativePath: RelativePathStub({ value: 'jest.config.js' }),
      });

      testbed.cleanup();

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/cli',
        success: true,
        action: 'created',
        message:
          'Added devDependencies to package.json; target project is not e2e-eligible (packageType is not frontend-react or frontend-ink); Created tsconfig.json; target project has npm workspaces (each package owns its own jest.config.js)',
      });
      expect(jestConfigContent).toBe(null);
    });
  });
});
