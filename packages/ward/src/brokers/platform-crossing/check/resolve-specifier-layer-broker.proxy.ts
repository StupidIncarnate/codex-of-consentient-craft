import { readFirstExistingCandidateLayerBrokerProxy } from './read-first-existing-candidate-layer-broker.proxy';

export const resolveSpecifierLayerBrokerProxy = (): {
  setupFile: (params: { filePath: string; content: string }) => void;
  setupMissing: (params: { filePath: string }) => void;
} => {
  const candidateProxy = readFirstExistingCandidateLayerBrokerProxy();

  return {
    setupFile: candidateProxy.setupFile,
    setupMissing: candidateProxy.setupMissing,
  };
};
