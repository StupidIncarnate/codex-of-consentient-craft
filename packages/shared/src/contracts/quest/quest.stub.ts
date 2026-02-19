import type { StubArgument } from '@dungeonmaster/shared/@types';

import { questContract } from './quest-contract';
import type { Quest } from './quest-contract';

export const QuestStub = ({ ...props }: StubArgument<Quest> = {}): Quest =>
  questContract.parse({
    id: 'add-auth',
    folder: '001-add-auth',
    title: 'Add Authentication',
    status: 'in_progress',
    createdAt: '2024-01-15T10:00:00.000Z',
    executionLog: [],
    requirements: [],
    designDecisions: [],
    contexts: [],
    observables: [],
    steps: [],
    toolingRequirements: [],
    contracts: [],
    flows: [],
    chatSessions: [],
    ...props,
  });
