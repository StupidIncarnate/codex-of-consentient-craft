import { readFile } from 'fs/promises';
import type { FilePath } from '@dungeonmaster/shared/contracts';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';

export const questLoadBrokerProxy = (): {
  setupQuestFile: (params: { questJson: string }) => void;
  setupQuestFileReadError: (params: { error: Error }) => void;
  setupQuestFileAt: (params: { questFilePath: FilePath; questJson: string }) => void;
} => {
  // The gateway proxy is composed first, so the raw handle below shares its staging. The queued
  // (address-less) reads need a one-shot the gateway proxy does not offer, and the gateway's
  // `readFile` wrapper calls this same raw function.
  readFileProxy();
  const readFileHandle = registerMock({ fn: readFile });

  return {
    // No questFilePath is known here: every caller of this proxy composes it alongside a
    // separate path-producing mock (a directory scan, questFindQuestPathBrokerProxy, ...) and
    // stages the two in lockstep, one quest file at a time — this proxy's own public interface
    // never carries a path. `onceFor([])` queues the NEXT read (any path) with this content.
    setupQuestFile: ({ questJson }: { questJson: string }): void => {
      readFileHandle.onceFor([]).resolves(questJson);
    },
    setupQuestFileReadError: ({ error }: { error: Error }): void => {
      readFileHandle.onceFor([]).rejects(error);
    },
    // Sticky and addressed: answers EVERY read of this one path, for a caller whose broker reads the
    // same quest file several times in one call (a scan, then again inside the modify lock).
    setupQuestFileAt: ({
      questFilePath,
      questJson,
    }: {
      questFilePath: FilePath;
      questJson: string;
    }): void => {
      readFileHandle.calledWith([questFilePath]).resolves(questJson);
    },
  };
};
