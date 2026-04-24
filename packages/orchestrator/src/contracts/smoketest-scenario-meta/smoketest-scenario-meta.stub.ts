import type { StubArgument } from '@dungeonmaster/shared/@types';

import { smoketestScenarioMetaContract } from './smoketest-scenario-meta-contract';
import type { SmoketestScenarioMeta } from './smoketest-scenario-meta-contract';

export const SmoketestScenarioMetaStub = ({
  ...props
}: StubArgument<SmoketestScenarioMeta> = {}): SmoketestScenarioMeta =>
  smoketestScenarioMetaContract.parse({
    caseId: 'orch-happy-path',
    name: 'Orchestration: happy path',
    startedAt: 1_705_320_000_000,
    ...props,
  });
