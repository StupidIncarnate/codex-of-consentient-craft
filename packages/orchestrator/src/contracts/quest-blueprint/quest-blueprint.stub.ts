import type { StubArgument } from '@dungeonmaster/shared/@types';

import { questBlueprintContract } from './quest-blueprint-contract';
import type { QuestBlueprint } from './quest-blueprint-contract';

export const QuestBlueprintStub = ({
  ...props
}: StubArgument<QuestBlueprint> = {}): QuestBlueprint =>
  questBlueprintContract.parse({
    title: 'Smoketest Quest',
    userRequest: 'Verify orchestration pipeline',
    flows: [],
    designDecisions: [],
    contracts: [],
    toolingRequirements: [],
    planningNotes: { surfaceReports: [], blightReports: [] },
    steps: [],
    skipRoles: [],
    rolePromptOverrides: {},
    ...props,
  });
