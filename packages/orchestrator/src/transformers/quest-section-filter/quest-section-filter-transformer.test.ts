import { QuestStub } from '@dungeonmaster/shared/contracts';

import { questSectionFilterTransformer } from './quest-section-filter-transformer';

describe('questSectionFilterTransformer', () => {
  describe('no sections (undefined)', () => {
    it('VALID: {quest, sections: undefined} => returns quest unchanged', () => {
      const quest = QuestStub();

      const result = questSectionFilterTransformer({ quest });

      expect(result).toStrictEqual(quest);
    });
  });

  describe('single section filter', () => {
    it('VALID: {sections: ["requirements"]} => returns only requirements populated', () => {
      const quest = QuestStub({
        requirements: [
          {
            id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            name: 'Auth',
            description: 'User auth',
            scope: 'packages/api',
            status: 'approved',
          },
        ],
        contexts: [
          {
            id: 'a47ac10b-58cc-4372-a567-0e02b2c3d479',
            name: 'LoginPage',
            description: 'Login page',
            locator: { page: '/login', section: 'main' },
          },
        ],
        observables: [
          {
            id: 'b47ac10b-58cc-4372-a567-0e02b2c3d479',
            contextId: 'a47ac10b-58cc-4372-a567-0e02b2c3d479',
            trigger: 'User submits login form',
            dependsOn: [],
            outcomes: [],
          },
        ],
      });

      const result = questSectionFilterTransformer({
        quest,
        sections: ['requirements'],
      });

      expect(result).toStrictEqual({
        id: 'add-auth',
        folder: '001-add-auth',
        title: 'Add Authentication',
        status: 'in_progress',
        createdAt: '2024-01-15T10:00:00.000Z',
        executionLog: [],
        requirements: [
          {
            id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            name: 'Auth',
            description: 'User auth',
            scope: 'packages/api',
            status: 'approved',
          },
        ],
        designDecisions: [],
        contracts: [],
        contexts: [],
        observables: [],
        steps: [],
        toolingRequirements: [],
        flows: [],
        chatSessions: [],
      });
    });

    it('VALID: {sections: ["observables"]} => returns only observables populated', () => {
      const quest = QuestStub({
        requirements: [
          {
            id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            name: 'Auth',
            description: 'User auth',
            scope: 'packages/api',
            status: 'approved',
          },
        ],
        observables: [
          {
            id: 'b47ac10b-58cc-4372-a567-0e02b2c3d479',
            contextId: 'a47ac10b-58cc-4372-a567-0e02b2c3d479',
            trigger: 'User submits login form',
            dependsOn: [],
            outcomes: [],
          },
        ],
      });

      const result = questSectionFilterTransformer({
        quest,
        sections: ['observables'],
      });

      expect(result).toStrictEqual({
        id: 'add-auth',
        folder: '001-add-auth',
        title: 'Add Authentication',
        status: 'in_progress',
        createdAt: '2024-01-15T10:00:00.000Z',
        executionLog: [],
        requirements: [],
        designDecisions: [],
        contracts: [],
        contexts: [],
        observables: [
          {
            id: 'b47ac10b-58cc-4372-a567-0e02b2c3d479',
            contextId: 'a47ac10b-58cc-4372-a567-0e02b2c3d479',
            trigger: 'User submits login form',
            dependsOn: [],
            outcomes: [],
            verification: [],
          },
        ],
        steps: [],
        toolingRequirements: [],
        flows: [],
        chatSessions: [],
      });
    });
  });

  describe('multiple section filter', () => {
    it('VALID: {sections: ["requirements", "observables"]} => returns both populated', () => {
      const quest = QuestStub({
        requirements: [
          {
            id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            name: 'Auth',
            description: 'User auth',
            scope: 'packages/api',
            status: 'approved',
          },
        ],
        observables: [
          {
            id: 'b47ac10b-58cc-4372-a567-0e02b2c3d479',
            contextId: 'a47ac10b-58cc-4372-a567-0e02b2c3d479',
            trigger: 'User submits login form',
            dependsOn: [],
            outcomes: [],
          },
        ],
        contexts: [
          {
            id: 'a47ac10b-58cc-4372-a567-0e02b2c3d479',
            name: 'LoginPage',
            description: 'Login page',
            locator: { page: '/login', section: 'main' },
          },
        ],
      });

      const result = questSectionFilterTransformer({
        quest,
        sections: ['requirements', 'observables'],
      });

      expect(result).toStrictEqual({
        id: 'add-auth',
        folder: '001-add-auth',
        title: 'Add Authentication',
        status: 'in_progress',
        createdAt: '2024-01-15T10:00:00.000Z',
        executionLog: [],
        requirements: [
          {
            id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            name: 'Auth',
            description: 'User auth',
            scope: 'packages/api',
            status: 'approved',
          },
        ],
        designDecisions: [],
        contracts: [],
        contexts: [],
        observables: [
          {
            id: 'b47ac10b-58cc-4372-a567-0e02b2c3d479',
            contextId: 'a47ac10b-58cc-4372-a567-0e02b2c3d479',
            trigger: 'User submits login form',
            dependsOn: [],
            outcomes: [],
            verification: [],
          },
        ],
        steps: [],
        toolingRequirements: [],
        flows: [],
        chatSessions: [],
      });
    });
  });

  describe('empty sections array', () => {
    it('VALID: {sections: []} => returns all sections as empty arrays', () => {
      const quest = QuestStub({
        requirements: [
          {
            id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            name: 'Auth',
            description: 'User auth',
            scope: 'packages/api',
            status: 'approved',
          },
        ],
      });

      const result = questSectionFilterTransformer({
        quest,
        sections: [],
      });

      expect(result).toStrictEqual({
        id: 'add-auth',
        folder: '001-add-auth',
        title: 'Add Authentication',
        status: 'in_progress',
        createdAt: '2024-01-15T10:00:00.000Z',
        executionLog: [],
        requirements: [],
        designDecisions: [],
        contracts: [],
        contexts: [],
        observables: [],
        steps: [],
        toolingRequirements: [],
        flows: [],
        chatSessions: [],
      });
    });
  });

  describe('metadata preservation', () => {
    it('VALID: {sections: ["requirements"]} => preserves all metadata fields', () => {
      const quest = QuestStub({
        id: 'my-quest',
        folder: '001-my-quest',
        title: 'My Quest',
        status: 'in_progress',
        createdAt: '2024-01-15T10:00:00.000Z',
        updatedAt: '2024-01-16T10:00:00.000Z',
        userRequest: 'Build something',
      });

      const result = questSectionFilterTransformer({
        quest,
        sections: ['requirements'],
      });

      expect(result).toStrictEqual({
        id: 'my-quest',
        folder: '001-my-quest',
        title: 'My Quest',
        status: 'in_progress',
        createdAt: '2024-01-15T10:00:00.000Z',
        updatedAt: '2024-01-16T10:00:00.000Z',
        userRequest: 'Build something',
        executionLog: [],
        requirements: [],
        designDecisions: [],
        contracts: [],
        contexts: [],
        observables: [],
        steps: [],
        toolingRequirements: [],
        flows: [],
        chatSessions: [],
      });
    });
  });

  describe('immutability', () => {
    it('VALID: {sections: ["requirements"]} => does not mutate original quest', () => {
      const quest = QuestStub({
        observables: [
          {
            id: 'b47ac10b-58cc-4372-a567-0e02b2c3d479',
            contextId: 'a47ac10b-58cc-4372-a567-0e02b2c3d479',
            trigger: 'User submits login form',
            dependsOn: [],
            outcomes: [],
          },
        ],
      });

      questSectionFilterTransformer({
        quest,
        sections: ['requirements'],
      });

      expect(quest.observables).toStrictEqual([
        {
          id: 'b47ac10b-58cc-4372-a567-0e02b2c3d479',
          contextId: 'a47ac10b-58cc-4372-a567-0e02b2c3d479',
          trigger: 'User submits login form',
          dependsOn: [],
          outcomes: [],
          verification: [],
        },
      ]);
    });
  });
});
