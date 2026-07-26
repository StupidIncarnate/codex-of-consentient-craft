import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';

export const questLoadBrokerProxy = (): {
  setupQuestFile: (params: { questJson: string }) => void;
  setupQuestFileReadError: (params: { error: Error }) => void;
} => {
  const fsReadFileProxy = fsReadFileAdapterProxy();

  return {
    // No questFilePath is known here: every caller of this proxy composes it alongside a
    // separate path-producing mock (a directory scan, questFindQuestPathBrokerProxy, ...) and
    // stages the two in lockstep, one quest file at a time — this proxy's own public interface
    // never carries a path. resolvesNext queues the NEXT read (any path) with this content.
    setupQuestFile: ({ questJson }: { questJson: string }): void => {
      fsReadFileProxy.resolvesNext({ content: questJson });
    },
    setupQuestFileReadError: ({ error }: { error: Error }): void => {
      fsReadFileProxy.rejectsNext({ error });
    },
  };
};
