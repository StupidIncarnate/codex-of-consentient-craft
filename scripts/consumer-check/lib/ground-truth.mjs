/**
 * Reads the EXPECTED shape of everything `dungeonmaster init` should write, straight out of THIS
 * repo's own compiled `dist/` — never re-typed here by hand. A hand-typed copy of, say, the hook
 * list or the tsconfig template goes stale the moment a G-item changes the generator; importing the
 * built statics/transformers directly means the suite's expectations move in lockstep with the code
 * that produces them.
 *
 * This only READS already-compiled output (the operator's `npm run build:clean`, done before this
 * suite ever runs — see repo CLAUDE.md's build-discipline table). It never invokes `tsc` itself.
 */

import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = join(HERE, '..', '..', '..');

const distPath = (...segments) => join(REPO_ROOT, ...segments);

export const loadGroundTruth = async () => {
  const shared = await import('@dungeonmaster/shared/statics');
  const devDependenciesStaticsModule = await import(
    distPath(
      'packages',
      'cli',
      'dist',
      'src',
      'statics',
      'dev-dependencies',
      'dev-dependencies-statics.js',
    )
  );
  const gatewayFoldersStaticsModule = await import(
    distPath('packages', 'cli', 'dist', 'src', 'statics', 'gateway-folders', 'gateway-folders-statics.js')
  );
  const gatewaySourceCopyStaticsModule = await import(
    distPath(
      'packages',
      'cli',
      'dist',
      'src',
      'statics',
      'gateway-source-copy',
      'gateway-source-copy-statics.js',
    )
  );
  const gatewayPackageTemplateStaticsModule = await import(
    distPath(
      'packages',
      'cli',
      'dist',
      'src',
      'statics',
      'gateway-package-template',
      'gateway-package-template-statics.js',
    )
  );
  const tsconfigTemplateStaticsModule = await import(
    distPath('packages', 'cli', 'dist', 'src', 'statics', 'tsconfig-template', 'tsconfig-template-statics.js')
  );
  const jestConfigTemplateStaticsModule = await import(
    distPath(
      'packages',
      'cli',
      'dist',
      'src',
      'statics',
      'jest-config-template',
      'jest-config-template-statics.js',
    )
  );
  const gatewayImportsFieldTransformerModule = await import('@dungeonmaster/shared/transformers');
  const dungeonmasterHooksCreatorTransformerModule = await import(
    distPath(
      'packages',
      'hooks',
      'dist',
      'src',
      'transformers',
      'dungeonmaster-hooks-creator',
      'dungeonmaster-hooks-creator-transformer.js',
    )
  );
  const configDefaultsStaticsModule = await import(
    distPath('packages', 'config', 'dist', 'src', 'statics', 'config-defaults', 'config-defaults-statics.js')
  );
  const e2eProcessPlaceholderStaticsModule = await import(
    distPath(
      'packages',
      'config',
      'dist',
      'src',
      'statics',
      'e2e-process-placeholder',
      'e2e-process-placeholder-statics.js',
    )
  );
  const dungeonmasterConfigContractModule = await import(
    distPath(
      'packages',
      'config',
      'dist',
      'src',
      'contracts',
      'dungeonmaster-config',
      'dungeonmaster-config-contract.js',
    )
  );
  const mcpServerStaticsModule = await import(
    distPath('packages', 'mcp', 'dist', 'src', 'statics', 'mcp-server', 'mcp-server-statics.js')
  );

  return {
    gatewayLocationsStatics: shared.gatewayLocationsStatics,
    mcpToolsStatics: shared.mcpToolsStatics,
    environmentStatics: shared.environmentStatics,
    locationsStatics: shared.locationsStatics,
    devDependenciesStatics: devDependenciesStaticsModule.devDependenciesStatics,
    gatewayFoldersStatics: gatewayFoldersStaticsModule.gatewayFoldersStatics,
    gatewaySourceCopyStatics: gatewaySourceCopyStaticsModule.gatewaySourceCopyStatics,
    gatewayPackageTemplateStatics: gatewayPackageTemplateStaticsModule.gatewayPackageTemplateStatics,
    tsconfigTemplateStatics: tsconfigTemplateStaticsModule.tsconfigTemplateStatics,
    jestConfigTemplateStatics: jestConfigTemplateStaticsModule.jestConfigTemplateStatics,
    gatewayImportsFieldTransformer:
      gatewayImportsFieldTransformerModule.gatewayImportsFieldTransformer,
    dungeonmasterHooksCreatorTransformer:
      dungeonmasterHooksCreatorTransformerModule.dungeonmasterHooksCreatorTransformer,
    configDefaultsStatics: configDefaultsStaticsModule.configDefaultsStatics,
    e2eProcessPlaceholderStatics: e2eProcessPlaceholderStaticsModule.e2eProcessPlaceholderStatics,
    dungeonmasterConfigContract: dungeonmasterConfigContractModule.dungeonmasterConfigContract,
    mcpServerStatics: mcpServerStaticsModule.mcpServerStatics,
  };
};
