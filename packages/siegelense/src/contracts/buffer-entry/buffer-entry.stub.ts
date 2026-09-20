import type { StubArgument } from '@dungeonmaster/shared/@types';
import { ContentTextStub } from '@dungeonmaster/shared/contracts';

import { EpochMsStub } from '../epoch-ms/epoch-ms.stub';
import { RunIdStub } from '../run-id/run-id.stub';
import { StepIndexStub } from '../step-index/step-index.stub';
import { bufferEntryContract } from './buffer-entry-contract';
import type { BufferEntry } from './buffer-entry-contract';

export const BufferEntryStub = ({ ...props }: StubArgument<BufferEntry> = {}): BufferEntry =>
  bufferEntryContract.parse({
    runId: RunIdStub(),
    step: StepIndexStub(),
    atMs: EpochMsStub(),
    text: ContentTextStub(),
    ...props,
  });
