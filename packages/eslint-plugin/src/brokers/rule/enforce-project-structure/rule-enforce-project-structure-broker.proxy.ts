import { RuleContextStub } from '#gateway/npm/typescript-eslint__utils/rule-context/rule-context.stub';
import type { TSESLint } from '#gateway/npm/typescript-eslint__utils';
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
  createContext: () => TSESLint.RuleContext<string, unknown[]>;
  layers: {
    collectExports: ReturnType<typeof collectExportsLayerBrokerProxy>;
    validateExport: ReturnType<typeof validateExportLayerBrokerProxy>;
    validateFilename: ReturnType<typeof validateFilenameLayerBrokerProxy>;
    validateFolderDepth: ReturnType<typeof validateFolderDepthLayerBrokerProxy>;
    validateFolderLocation: ReturnType<typeof validateFolderLocationLayerBrokerProxy>;
  };
} => ({
  createContext: (): TSESLint.RuleContext<string, unknown[]> => RuleContextStub(),
  layers: {
    collectExports: collectExportsLayerBrokerProxy(),
    validateExport: validateExportLayerBrokerProxy(),
    validateFilename: validateFilenameLayerBrokerProxy(),
    validateFolderDepth: validateFolderDepthLayerBrokerProxy(),
    validateFolderLocation: validateFolderLocationLayerBrokerProxy(),
  },
});
