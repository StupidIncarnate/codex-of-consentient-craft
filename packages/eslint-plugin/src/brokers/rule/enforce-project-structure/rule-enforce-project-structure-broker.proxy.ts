import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import { collectExportsLayerBrokerProxy } from './collect-exports-layer-broker.proxy';
import { validateExportLayerBrokerProxy } from './validate-export-layer-broker.proxy';
import { validateFilenameLayerBrokerProxy } from './validate-filename-layer-broker.proxy';
import { validateFolderDepthLayerBrokerProxy } from './validate-folder-depth-layer-broker.proxy';
import { validateFolderLocationLayerBrokerProxy } from './validate-folder-location-layer-broker.proxy';

/**
 * Proxy for enforce-project-structure rule broker.
 * Provides mock setup for testing the rule.
 */
export const ruleEnforceProjectStructureBrokerProxy = (): {
  createContext: () => EslintContext;
  layers: {
    collectExports: ReturnType<typeof collectExportsLayerBrokerProxy>;
    validateExport: ReturnType<typeof validateExportLayerBrokerProxy>;
    validateFilename: ReturnType<typeof validateFilenameLayerBrokerProxy>;
    validateFolderDepth: ReturnType<typeof validateFolderDepthLayerBrokerProxy>;
    validateFolderLocation: ReturnType<typeof validateFolderLocationLayerBrokerProxy>;
  };
} => ({
  createContext: (): EslintContext => ({
    filename: undefined,
    report: jest.fn(),
  }),
  layers: {
    collectExports: collectExportsLayerBrokerProxy(),
    validateExport: validateExportLayerBrokerProxy(),
    validateFilename: validateFilenameLayerBrokerProxy(),
    validateFolderDepth: validateFolderDepthLayerBrokerProxy(),
    validateFolderLocation: validateFolderLocationLayerBrokerProxy(),
  },
});
