import {
  QuestStub,
  FlowStub,
  FlowNodeStub,
  FlowObservableStub,
  DesignDecisionStub,
  QuestContractEntryStub,
} from '@dungeonmaster/shared/contracts';

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
    it('VALID: {sections: ["flows"]} => returns only flows populated', () => {
      const quest = QuestStub({
        flows: [
          FlowStub({
            nodes: [
              FlowNodeStub({
                id: 'login-page',
                observables: [FlowObservableStub()],
              }),
            ],
          }),
        ],
        designDecisions: [DesignDecisionStub()],
      });

      const result = questSectionFilterTransformer({
        quest,
        sections: ['flows'],
      });

      expect(result).toStrictEqual({
        id: 'add-auth',
        folder: '001-add-auth',
        title: 'Add Authentication',
        status: 'in_progress',
        createdAt: '2024-01-15T10:00:00.000Z',
        userRequest: 'Add authentication to the application',
        needsDesign: false,
        designDecisions: [],
        contracts: [],
        steps: [],
        toolingRequirements: [],
        workItems: [],
        wardResults: [],
        planningNotes: { surfaceReports: [] },
        flows: [
          FlowStub({
            nodes: [
              FlowNodeStub({
                id: 'login-page',
                observables: [FlowObservableStub()],
              }),
            ],
          }),
        ],
      });
    });

    it('VALID: {sections: ["designDecisions"]} => returns only designDecisions populated', () => {
      const decision = DesignDecisionStub();
      const quest = QuestStub({
        designDecisions: [decision],
        flows: [FlowStub()],
      });

      const result = questSectionFilterTransformer({
        quest,
        sections: ['designDecisions'],
      });

      expect(result).toStrictEqual({
        id: 'add-auth',
        folder: '001-add-auth',
        title: 'Add Authentication',
        status: 'in_progress',
        createdAt: '2024-01-15T10:00:00.000Z',
        userRequest: 'Add authentication to the application',
        needsDesign: false,
        designDecisions: [decision],
        contracts: [],
        steps: [],
        toolingRequirements: [],
        workItems: [],
        wardResults: [],
        planningNotes: { surfaceReports: [] },
        flows: [],
      });
    });
  });

  describe('multiple section filter', () => {
    it('VALID: {sections: ["flows", "contracts"]} => returns both populated', () => {
      const contract = QuestContractEntryStub();
      const flow = FlowStub();
      const quest = QuestStub({
        flows: [flow],
        contracts: [contract],
        designDecisions: [DesignDecisionStub()],
      });

      const result = questSectionFilterTransformer({
        quest,
        sections: ['flows', 'contracts'],
      });

      expect(result).toStrictEqual({
        id: 'add-auth',
        folder: '001-add-auth',
        title: 'Add Authentication',
        status: 'in_progress',
        createdAt: '2024-01-15T10:00:00.000Z',
        userRequest: 'Add authentication to the application',
        needsDesign: false,
        designDecisions: [],
        contracts: [contract],
        steps: [],
        toolingRequirements: [],
        workItems: [],
        wardResults: [],
        planningNotes: { surfaceReports: [] },
        flows: [flow],
      });
    });
  });

  describe('empty sections array', () => {
    it('VALID: {sections: []} => returns all sections as empty arrays', () => {
      const quest = QuestStub({
        flows: [FlowStub()],
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
        userRequest: 'Add authentication to the application',
        needsDesign: false,
        designDecisions: [],
        contracts: [],
        steps: [],
        toolingRequirements: [],
        workItems: [],
        wardResults: [],
        planningNotes: { surfaceReports: [] },
        flows: [],
      });
    });
  });

  describe('metadata preservation', () => {
    it('VALID: {sections: ["flows"]} => preserves all metadata fields', () => {
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
        sections: ['flows'],
      });

      expect(result).toStrictEqual({
        id: 'my-quest',
        folder: '001-my-quest',
        title: 'My Quest',
        status: 'in_progress',
        createdAt: '2024-01-15T10:00:00.000Z',
        updatedAt: '2024-01-16T10:00:00.000Z',
        userRequest: 'Build something',
        needsDesign: false,
        designDecisions: [],
        contracts: [],
        steps: [],
        toolingRequirements: [],
        workItems: [],
        wardResults: [],
        planningNotes: { surfaceReports: [] },
        flows: [],
      });
    });
  });

  describe('immutability', () => {
    it('VALID: {sections: ["flows"]} => does not mutate original quest', () => {
      const flow = FlowStub();
      const quest = QuestStub({
        flows: [flow],
      });

      questSectionFilterTransformer({
        quest,
        sections: ['designDecisions'],
      });

      expect(quest.flows).toStrictEqual([flow]);
    });
  });

  describe('planningNotes section', () => {
    it('VALID: {sections: ["planningNotes"]} => returns only planningNotes populated', () => {
      const quest = QuestStub({
        flows: [FlowStub()],
        designDecisions: [DesignDecisionStub()],
      });

      const result = questSectionFilterTransformer({
        quest,
        sections: ['planningNotes'],
      });

      expect(result).toStrictEqual({
        id: 'add-auth',
        folder: '001-add-auth',
        title: 'Add Authentication',
        status: 'in_progress',
        createdAt: '2024-01-15T10:00:00.000Z',
        userRequest: 'Add authentication to the application',
        needsDesign: false,
        designDecisions: [],
        contracts: [],
        steps: [],
        toolingRequirements: [],
        workItems: [],
        wardResults: [],
        planningNotes: { surfaceReports: [] },
        flows: [],
      });
    });

    it('VALID: {sections: ["flows"]} => planningNotes resets to default empty shape', () => {
      const quest = QuestStub({
        flows: [FlowStub()],
      });

      const result = questSectionFilterTransformer({
        quest,
        sections: ['flows'],
      });

      expect(result).toStrictEqual({
        id: 'add-auth',
        folder: '001-add-auth',
        title: 'Add Authentication',
        status: 'in_progress',
        createdAt: '2024-01-15T10:00:00.000Z',
        userRequest: 'Add authentication to the application',
        needsDesign: false,
        designDecisions: [],
        contracts: [],
        steps: [],
        toolingRequirements: [],
        workItems: [],
        wardResults: [],
        planningNotes: { surfaceReports: [] },
        flows: quest.flows,
      });
    });

    it('VALID: {sections: ["planningNotes", "steps", "contracts"]} => planning-stage set passes through', () => {
      const contract = QuestContractEntryStub();
      const quest = QuestStub({
        contracts: [contract],
        flows: [FlowStub()],
      });

      const result = questSectionFilterTransformer({
        quest,
        sections: ['planningNotes', 'steps', 'contracts'],
      });

      expect(result).toStrictEqual({
        id: 'add-auth',
        folder: '001-add-auth',
        title: 'Add Authentication',
        status: 'in_progress',
        createdAt: '2024-01-15T10:00:00.000Z',
        userRequest: 'Add authentication to the application',
        needsDesign: false,
        designDecisions: [],
        contracts: [contract],
        steps: [],
        toolingRequirements: [],
        workItems: [],
        wardResults: [],
        planningNotes: { surfaceReports: [] },
        flows: [],
      });
    });

    it('VALID: {sections: ["planningNotes", "steps", "contracts", "toolingRequirements"]} => implementation-stage set passes through', () => {
      const quest = QuestStub({
        flows: [FlowStub()],
      });

      const result = questSectionFilterTransformer({
        quest,
        sections: ['planningNotes', 'steps', 'contracts', 'toolingRequirements'],
      });

      expect(result).toStrictEqual({
        id: 'add-auth',
        folder: '001-add-auth',
        title: 'Add Authentication',
        status: 'in_progress',
        createdAt: '2024-01-15T10:00:00.000Z',
        userRequest: 'Add authentication to the application',
        needsDesign: false,
        designDecisions: [],
        contracts: [],
        steps: [],
        toolingRequirements: [],
        workItems: [],
        wardResults: [],
        planningNotes: { surfaceReports: [] },
        flows: [],
      });
    });

    it('VALID: {sections: []} => planningNotes resets to default empty shape', () => {
      const quest = QuestStub({
        flows: [FlowStub()],
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
        userRequest: 'Add authentication to the application',
        needsDesign: false,
        designDecisions: [],
        contracts: [],
        steps: [],
        toolingRequirements: [],
        workItems: [],
        wardResults: [],
        planningNotes: { surfaceReports: [] },
        flows: [],
      });
    });
  });
});
