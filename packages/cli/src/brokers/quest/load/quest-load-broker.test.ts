import { questLoadBroker } from './quest-load-broker';
import { questLoadBrokerProxy } from './quest-load-broker.proxy';
import { FilePathStub } from '@dungeonmaster/shared/contracts';

describe('questLoadBroker', () => {
  describe('valid quest loading', () => {
    it('VALID: {questFilePath: "/quests/quest-1.json"} => parses and returns Quest object', async () => {
      const proxy = questLoadBrokerProxy();
      const questFilePath = FilePathStub({ value: '/quests/quest-1.json' });
      const questJson = JSON.stringify({
        id: 'add-auth',
        folder: '001-add-auth',
        title: 'Add Authentication',
        status: 'in_progress',
        createdAt: '2024-01-01T00:00:00Z',
        phases: {
          discovery: { status: 'complete' },
          implementation: { status: 'in_progress' },
          testing: { status: 'pending' },
          review: { status: 'pending' },
        },
        executionLog: [],
        tasks: [],
        contexts: [],
        observables: [],
        steps: [],
        toolingRequirements: [],
      });

      proxy.setupQuestFile({ questJson });

      const result = await questLoadBroker({ questFilePath });

      expect(result.id).toBe('add-auth');
      expect(result.title).toBe('Add Authentication');
      expect(result.status).toBe('in_progress');
    });

    it('VALID: {questFilePath: "/quests/quest-2.json"} => handles quest with all optional fields', async () => {
      const proxy = questLoadBrokerProxy();
      const questFilePath = FilePathStub({ value: '/quests/quest-2.json' });
      const questJson = JSON.stringify({
        id: 'fix-bug',
        folder: '002-fix-bug',
        title: 'Fix Login Bug',
        status: 'complete',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
        completedAt: '2024-01-03T00:00:00Z',
        phases: {
          discovery: { status: 'complete' },
          implementation: { status: 'complete' },
          testing: { status: 'complete' },
          review: { status: 'complete' },
        },
        executionLog: [],
        tasks: [],
        userRequest: 'Fix the login bug',
        contexts: [],
        observables: [],
        steps: [],
        toolingRequirements: [],
      });

      proxy.setupQuestFile({ questJson });

      const result = await questLoadBroker({ questFilePath });

      expect(result.id).toBe('fix-bug');
      expect(result.completedAt).toBe('2024-01-03T00:00:00Z');
      expect(result.userRequest).toBe('Fix the login bug');
    });
  });

  describe('invalid quest loading', () => {
    it('ERROR: {questFilePath: "/quests/invalid.json"} => throws error for invalid JSON', async () => {
      const proxy = questLoadBrokerProxy();
      const questFilePath = FilePathStub({ value: '/quests/invalid.json' });

      proxy.setupQuestFile({ questJson: '{ invalid json }' });

      await expect(questLoadBroker({ questFilePath })).rejects.toThrow(
        'Failed to parse quest file at /quests/invalid.json',
      );
    });

    it('ERROR: {questFilePath: "/quests/missing-fields.json"} => throws error for quest missing required fields', async () => {
      const proxy = questLoadBrokerProxy();
      const questFilePath = FilePathStub({ value: '/quests/missing-fields.json' });
      const questJson = JSON.stringify({
        id: 'incomplete',
        // Missing required fields
      });

      proxy.setupQuestFile({ questJson });

      await expect(questLoadBroker({ questFilePath })).rejects.toThrow(
        'Failed to parse quest file at /quests/missing-fields.json',
      );
    });

    it('ERROR: {questFilePath: "/missing.json"} => throws error when file does not exist', async () => {
      const proxy = questLoadBrokerProxy();
      const questFilePath = FilePathStub({ value: '/missing.json' });

      proxy.setupQuestFileReadError({ error: new Error('ENOENT: no such file or directory') });

      await expect(questLoadBroker({ questFilePath })).rejects.toThrow(
        'Failed to read file at /missing.json',
      );
    });
  });

  describe('edge cases', () => {
    it('EDGE: {questFilePath: "/quests/.hidden.json"} => handles hidden files', async () => {
      const proxy = questLoadBrokerProxy();
      const questFilePath = FilePathStub({ value: '/quests/.hidden.json' });
      const questJson = JSON.stringify({
        id: 'hidden-quest',
        folder: '003-hidden',
        title: 'Hidden Quest',
        status: 'in_progress',
        createdAt: '2024-01-01T00:00:00Z',
        phases: {
          discovery: { status: 'pending' },
          implementation: { status: 'pending' },
          testing: { status: 'pending' },
          review: { status: 'pending' },
        },
        executionLog: [],
        tasks: [],
        contexts: [],
        observables: [],
        steps: [],
        toolingRequirements: [],
      });

      proxy.setupQuestFile({ questJson });

      const result = await questLoadBroker({ questFilePath });

      expect(result.id).toBe('hidden-quest');
    });
  });
});
