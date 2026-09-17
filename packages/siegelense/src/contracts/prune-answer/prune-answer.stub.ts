import type { StubArgument } from '@dungeonmaster/shared/@types';

import { CitationGapStub } from '../citation-gap/citation-gap.stub';
import { FileSizeBytesStub } from '../file-size-bytes/file-size-bytes.stub';
import { MegabytesStub } from '../megabytes/megabytes.stub';
import { PruneRefusalStub } from '../prune-refusal/prune-refusal.stub';
import { PruneRemovalStub } from '../prune-removal/prune-removal.stub';
import { pruneAnswerContract } from './prune-answer-contract';
import type { PruneAnswer } from './prune-answer-contract';

export const PruneAnswerStub = ({ ...props }: StubArgument<PruneAnswer> = {}): PruneAnswer =>
  pruneAnswerContract.parse({
    freedMB: MegabytesStub({ value: 4100 }),
    freedBytes: FileSizeBytesStub({ value: 4_299_161_600 }),
    removed: [PruneRemovalStub()],
    refused: [PruneRefusalStub()],
    unresolved: [CitationGapStub()],
    ...props,
  });
