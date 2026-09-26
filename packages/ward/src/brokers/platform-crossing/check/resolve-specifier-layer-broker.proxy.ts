import type { FilePath } from '@dungeonmaster/shared/contracts';
import { readFirstExistingCandidateLayerBrokerProxy } from './read-first-existing-candidate-layer-broker.proxy';

export const resolveSpecifierLayerBrokerProxy = (): {
  setupFile: (params: { filePath: FilePath; content: string }) => void;
  setupMissing: (params: { filePath: FilePath }) => void;
} => {
  const candidateProxy = readFirstExistingCandidateLayerBrokerProxy();

  return {
    setupFile: candidateProxy.setupFile,
    setupMissing: candidateProxy.setupMissing,
  };
};
