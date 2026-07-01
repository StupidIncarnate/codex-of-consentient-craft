import { claudeLineNormalizeBrokerProxy } from '@dungeonmaster/shared/testing';

export const scopeSubagentFilesToDescendantsLayerBrokerProxy = (): Record<PropertyKey, never> => {
  // Passthrough: the layer broker normalizes each raw line via claudeLineNormalizeBroker; the
  // real normalize runs so tests assert against true edge extraction.
  claudeLineNormalizeBrokerProxy();
  return {};
};
