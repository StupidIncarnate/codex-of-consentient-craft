import type { StubArgument } from '@dungeonmaster/shared/@types';

import { ElementDeltaStub } from '../element-delta/element-delta.stub';
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
      errors: '+2',
      new: ['Cannot read properties of null'],
    },
    server: {
      errors: '+0',
      new: [],
    },
    network: {
      errors: '+1',
      new: ['POST /api/guilds 500'],
    },
    pixels: 'last capture differs 12%',
    elements: {
      runA: ElementDeltaStub(),
      runB: ElementDeltaStub(),
    },
    ...props,
  });
