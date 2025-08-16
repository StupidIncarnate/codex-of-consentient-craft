import type { Quest } from '../../src/v1/models/quest';

export const QuestStub = (overrides: Partial<Quest> = {}): Quest => ({
  id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  folder: '001-test-quest',
  title: 'Test Quest',
  status: 'in_progress',
  createdAt: '2023-01-01T00:00:00.000Z',
  userRequest: 'Add authentication to the app',
  phases: {
    discovery: { status: 'pending' },
    implementation: { status: 'pending' },
    testing: { status: 'pending' },
    review: { status: 'pending' },
  },
  tasks: [],
  executionLog: [],
  ...overrides,
});
