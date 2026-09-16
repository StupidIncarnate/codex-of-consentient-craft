import type { StubArgument } from '@dungeonmaster/shared/@types';
import { ContentTextStub } from '@dungeonmaster/shared/contracts';

import { CountDeltaStub } from '../count-delta/count-delta.stub';
import { InstanceIdStub } from '../instance-id/instance-id.stub';
import { RunIdStub } from '../run-id/run-id.stub';
import { compareAnswerContract } from './compare-answer-contract';
import type { CompareAnswer } from './compare-answer-contract';

export const CompareAnswerStub = ({ ...props }: StubArgument<CompareAnswer> = {}): CompareAnswer =>
  compareAnswerContract.parse({
    instanceId: InstanceIdStub(),
    runA: RunIdStub({ value: 'run_4' }),
    runB: RunIdStub({ value: 'run_5' }),
    console: {
      errors: CountDeltaStub({ value: '+2' }),
      new: [ContentTextStub({ value: 'Cannot read properties of null' })],
    },
    server: {
      errors: CountDeltaStub({ value: '+0' }),
      new: [],
    },
    network: {
      non2xx: CountDeltaStub({ value: '+1' }),
      new: [ContentTextStub({ value: 'POST /api/guilds 500' })],
    },
    pixels: ContentTextStub({ value: 'last capture differs 12%' }),
    ...props,
  });
