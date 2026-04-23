import { questBlueprintContract } from './quest-blueprint-contract';
import { QuestBlueprintStub } from './quest-blueprint.stub';

describe('questBlueprintContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub default} => returns blueprint with empty arrays and no targetStatus', () => {
      const result = QuestBlueprintStub();

      expect(result).toStrictEqual({
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
      });
    });

    it('VALID: {targetStatus: "flows_approved"} => result includes targetStatus', () => {
      const result = QuestBlueprintStub({ targetStatus: 'flows_approved' });

      expect(result).toStrictEqual({
        title: 'Smoketest Quest',
        userRequest: 'Verify orchestration pipeline',
        flows: [],
        designDecisions: [],
        contracts: [],
        toolingRequirements: [],
        planningNotes: { surfaceReports: [], blightReports: [] },
        steps: [],
        skipRoles: [],
        targetStatus: 'flows_approved',
        rolePromptOverrides: {},
      });
    });

    it('VALID: {skipRoles: ["ward"]} => result includes skipRoles', () => {
      const result = QuestBlueprintStub({ skipRoles: ['ward'] });

      expect(result).toStrictEqual({
        title: 'Smoketest Quest',
        userRequest: 'Verify orchestration pipeline',
        flows: [],
        designDecisions: [],
        contracts: [],
        toolingRequirements: [],
        planningNotes: { surfaceReports: [], blightReports: [] },
        steps: [],
        skipRoles: ['ward'],
        rolePromptOverrides: {},
      });
    });

    it('VALID: {fixedQuestId: "00000000-0000-0000-0000-000000000000"} => result includes fixedQuestId', () => {
      const result = QuestBlueprintStub({
        fixedQuestId: '00000000-0000-0000-0000-000000000000',
      });

      expect(result).toStrictEqual({
        title: 'Smoketest Quest',
        userRequest: 'Verify orchestration pipeline',
        flows: [],
        designDecisions: [],
        contracts: [],
        toolingRequirements: [],
        planningNotes: { surfaceReports: [], blightReports: [] },
        steps: [],
        skipRoles: [],
        fixedQuestId: '00000000-0000-0000-0000-000000000000',
        rolePromptOverrides: {},
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {title missing} => throws validation error', () => {
      expect(() => {
        questBlueprintContract.parse({
          userRequest: 'R',
          flows: [],
          designDecisions: [],
          contracts: [],
          toolingRequirements: [],
          planningNotes: { surfaceReports: [], blightReports: [] },
          steps: [],
        });
      }).toThrow(/Required/u);
    });

    it('INVALID: {userRequest missing} => throws validation error', () => {
      expect(() => {
        questBlueprintContract.parse({
          title: 'T',
          flows: [],
          designDecisions: [],
          contracts: [],
          toolingRequirements: [],
          planningNotes: { surfaceReports: [], blightReports: [] },
          steps: [],
        });
      }).toThrow(/Required/u);
    });

    it('INVALID: {skipRoles: ["bogus"]} => throws validation error', () => {
      expect(() => {
        questBlueprintContract.parse({
          title: 'T',
          userRequest: 'R',
          flows: [],
          designDecisions: [],
          contracts: [],
          toolingRequirements: [],
          planningNotes: { surfaceReports: [], blightReports: [] },
          steps: [],
          skipRoles: ['bogus' as never],
        });
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {targetStatus: "nonsense"} => throws validation error', () => {
      expect(() => {
        questBlueprintContract.parse({
          title: 'T',
          userRequest: 'R',
          flows: [],
          designDecisions: [],
          contracts: [],
          toolingRequirements: [],
          planningNotes: { surfaceReports: [], blightReports: [] },
          steps: [],
          targetStatus: 'nonsense' as never,
        });
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {fixedQuestId: ""} => throws validation error', () => {
      expect(() => {
        questBlueprintContract.parse({
          title: 'T',
          userRequest: 'R',
          flows: [],
          designDecisions: [],
          contracts: [],
          toolingRequirements: [],
          planningNotes: { surfaceReports: [], blightReports: [] },
          steps: [],
          fixedQuestId: '',
        });
      }).toThrow(/String must contain at least 1/u);
    });
  });
});
