import { questFieldsContract } from './quest-fields-contract';
import { QuestFieldsStub } from './quest-fields.stub';

describe('questFieldsContract', () => {
  describe('valid quest fields', () => {
    it('VALID: {title, status, userRequest, guildId} => parses with every array field defaulted empty', () => {
      const result = questFieldsContract.parse({
        title: 'Quest 1',
        status: 'created',
        userRequest: 'seeded quest 1',
        guildId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      });

      expect(result).toStrictEqual({
        title: 'Quest 1',
        status: 'created',
        questType: 'feature',
        designDecisions: [],
        operations: [],
        toolingRequirements: [],
        packagesAffected: [],
        packageGraph: [],
        contracts: [],
        flows: [],
        comments: [],
        needsDesign: false,
        userRequest: 'seeded quest 1',
        workItems: [],
        wardResults: [],
        riftcarverResults: [],
        sessions: [],
        planningNotes: { blightLedger: [], questNotes: [], operationPlans: [] },
        guildId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      });
    });

    it('VALID: {stub with status override} => parses with the overridden status', () => {
      const result = QuestFieldsStub({ status: 'in_progress' });

      expect(result.status).toBe('in_progress');
    });

    it('VALID: {fields plus id/folder/createdAt/updatedAt} => strips the record-only fields', () => {
      const result = questFieldsContract.parse({
        title: 'Quest 1',
        status: 'created',
        userRequest: 'seeded quest 1',
        guildId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        id: 'add-auth',
        folder: '001-add-auth',
        createdAt: '2024-01-15T10:00:00.000Z',
        updatedAt: '2024-01-16T10:00:00.000Z',
      });

      expect(Object.keys(result).sort()).toStrictEqual(
        [
          'comments',
          'contracts',
          'designDecisions',
          'flows',
          'guildId',
          'needsDesign',
          'operations',
          'packageGraph',
          'packagesAffected',
          'planningNotes',
          'questType',
          'riftcarverResults',
          'sessions',
          'status',
          'title',
          'toolingRequirements',
          'userRequest',
          'wardResults',
          'workItems',
        ].sort(),
      );
    });
  });

  describe('invalid quest fields', () => {
    it('INVALID: {title, status, userRequest — no guildId} => throws "Required"', () => {
      expect(() =>
        questFieldsContract.parse({
          title: 'Quest 1',
          status: 'created',
          userRequest: 'seeded quest 1',
        }),
      ).toThrow(/Required/u);
    });

    it('INVALID: {status: "not-a-status"} => throws "Invalid enum value"', () => {
      expect(() =>
        questFieldsContract.parse({
          title: 'Quest 1',
          status: 'not-a-status',
          userRequest: 'seeded quest 1',
          guildId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        }),
      ).toThrow(/Invalid enum value/u);
    });
  });

  describe('empty quest fields', () => {
    it('EMPTY: {} => throws "Required"', () => {
      expect(() => questFieldsContract.parse({})).toThrow(/Required/u);
    });
  });
});
