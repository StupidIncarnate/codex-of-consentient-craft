import type { StubArgument } from '@dungeonmaster/shared/@types';

import { scenarioInstanceContract } from './scenario-instance-contract';
import type { ScenarioInstance } from './scenario-instance-contract';

export const ScenarioInstanceStub = ({
  ...props
}: StubArgument<ScenarioInstance> = {}): ScenarioInstance =>
  scenarioInstanceContract.parse({
    scripts: { codeweaver: ['signalComplete'] },
    callOrdinals: {},
    ...props,
  });
