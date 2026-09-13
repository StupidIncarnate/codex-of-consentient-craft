import {
  AbsoluteFilePathStub,
  FilePathStub,
  UsageLedgerStub,
} from '@dungeonmaster/shared/contracts';
import { locationsClaudeProjectsRootFindBrokerProxy } from '@dungeonmaster/shared/testing';
import { registerModuleMock } from '@dungeonmaster/testing/register-mock';

import { fsWalkFilesAdapterProxy } from '../../../adapters/fs/walk-files/fs-walk-files-adapter.proxy';
import { foldBatchLayerBrokerProxy } from './fold-batch-layer-broker.proxy';
import { usageLedgerReadBroker } from '../read/usage-ledger-read-broker';
import { usageLedgerReadBrokerProxy } from '../read/usage-ledger-read-broker.proxy';
import { usageLedgerWriteBroker } from '../write/usage-ledger-write-broker';
import { usageLedgerWriteBrokerProxy } from '../write/usage-ledger-write-broker.proxy';

type UsageLedger = ReturnType<typeof UsageLedgerStub>;

// Both sides of the ledger have their own suites covering parse fallbacks and pruning. Here they
// are the scan's INPUT and its OUTPUT, and what the tests grade is the ledger handed to the write —
// so they are replaced at the module boundary rather than staged through two fs chains whose
// one-shot path queues would interleave with the walk's.
registerModuleMock({ module: '../read/usage-ledger-read-broker' });
registerModuleMock({ module: '../write/usage-ledger-write-broker' });

const PROJECTS_ROOT = AbsoluteFilePathStub({ value: '/home/user/.claude/projects' });

export const usageLedgerScanBrokerProxy = (): {
  setupExistingLedger: (params: { ledger: UsageLedger }) => void;
  setupTranscripts: (params: {
    files: readonly { name: string; mtimeMs: number; size: number; contents: string }[];
  }) => void;
  getWrittenLedger: () => unknown;
} => {
  const rootProxy = locationsClaudeProjectsRootFindBrokerProxy();
  const walkProxy = fsWalkFilesAdapterProxy();
  const foldProxy = foldBatchLayerBrokerProxy();
  usageLedgerReadBrokerProxy();
  usageLedgerWriteBrokerProxy();

  const readMock = usageLedgerReadBroker as jest.MockedFunction<typeof usageLedgerReadBroker>;
  const writeMock = usageLedgerWriteBroker as jest.MockedFunction<typeof usageLedgerWriteBroker>;

  readMock.mockResolvedValue(UsageLedgerStub({ buckets: {}, cursors: {} }));
  writeMock.mockImplementation(async ({ ledger }) =>
    Promise.resolve(UsageLedgerStub({ ...ledger })),
  );

  return {
    setupExistingLedger: ({ ledger }: { ledger: UsageLedger }): void => {
      readMock.mockResolvedValue(ledger);
    },

    // One flat directory of transcripts, each answering a ranged read with its own contents.
    setupTranscripts: ({
      files,
    }: {
      files: readonly { name: string; mtimeMs: number; size: number; contents: string }[];
    }): void => {
      // Staged HERE rather than in the constructor. pathJoin's proxy hands out one-shot results in
      // call order across every proxy in the test, so a root staged at construction time sits
      // unconsumed whenever this proxy is only being created to satisfy dependency discovery — and
      // the next broker that joins a path gets this one's answer instead of its own.
      rootProxy.setupProjectsRoot({
        homeDir: FilePathStub({ value: '/home/user' }),
        projectsRoot: FilePathStub({ value: '/home/user/.claude/projects' }),
      });

      walkProxy.setupDirectory({
        dirPath: PROJECTS_ROOT,
        files: files.map((file) => file.name),
      });

      for (const file of files) {
        const path = AbsoluteFilePathStub({ value: `/home/user/.claude/projects/${file.name}` });
        walkProxy.setupFileStat({
          filePath: path,
          mtimeMs: file.mtimeMs,
          size: file.size,
        });
        foldProxy.setupTranscript({
          path: `/home/user/.claude/projects/${file.name}`,
          contents: file.contents,
        });
      }
    },

    getWrittenLedger: (): unknown => writeMock.mock.calls.at(-1)?.[0]?.ledger,
  };
};
