import type { StubArgument } from '@dungeonmaster/shared/@types';

import { CitationGapStub } from '../citation-gap/citation-gap.stub';
import { PruneRefusalStub } from '../prune-refusal/prune-refusal.stub';
import { PruneRemovalStub } from '../prune-removal/prune-removal.stub';
import { pruneAnswerContract } from './prune-answer-contract';
import type { PruneAnswer } from './prune-answer-contract';

export const PruneAnswerStub = ({ ...props }: StubArgument<PruneAnswer> = {}): PruneAnswer =>
  pruneAnswerContract.parse({
    freedMB: 4100,
    freedBytes: 4_299_161_600,
    removed: [PruneRemovalStub()],
    refused: [PruneRefusalStub()],
    unresolved: [CitationGapStub()],
    ...props,
  });
