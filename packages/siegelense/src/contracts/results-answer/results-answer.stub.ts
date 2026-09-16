import type { StubArgument } from '@dungeonmaster/shared/@types';

import { InstanceIdStub } from '../instance-id/instance-id.stub';
import { InstanceStateStub } from '../instance-state/instance-state.stub';
import { ReadingCountStub } from '../reading-count/reading-count.stub';
import { resultsAnswerContract } from './results-answer-contract';
import type { ResultsAnswer } from './results-answer-contract';

export const ResultsAnswerStub = ({ ...props }: StubArgument<ResultsAnswer> = {}): ResultsAnswer =>
  resultsAnswerContract.parse({
    instanceId: InstanceIdStub(),
    instanceState: InstanceStateStub(),
    runId: null,
    kind: null,
    step: null,
    verb: null,
    prunedAtMs: null,
    prunedByRule: null,
    matched: ReadingCountStub({ value: 0 }),
    returned: ReadingCountStub({ value: 0 }),
    truncated: false,
    rows: [],
    storedReturn: null,
    ...props,
  });
