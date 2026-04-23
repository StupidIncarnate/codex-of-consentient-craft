import type { StubArgument } from '@dungeonmaster/shared/@types';

import { QuestBlueprintStub } from '../quest-blueprint/quest-blueprint.stub';
import { QuestStatusAssertionStub } from '../smoketest-assertion/smoketest-assertion.stub';
import { smoketestScenarioContract } from './smoketest-scenario-contract';
import type { SmoketestScenario } from './smoketest-scenario-contract';

export const SmoketestScenarioStub = ({
  ...props
}: StubArgument<SmoketestScenario> = {}): SmoketestScenario =>
  smoketestScenarioContract.parse({
    caseId: 'orch-happy',
    name: 'Orchestration: happy path',
    blueprint: QuestBlueprintStub(),
    scripts: { codeweaver: ['signalComplete'], pathseeker: ['signalComplete'] },
    assertions: [QuestStatusAssertionStub({ expected: 'complete' })],
    ...props,
  });
