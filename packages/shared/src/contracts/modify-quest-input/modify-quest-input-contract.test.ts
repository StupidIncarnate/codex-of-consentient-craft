import { modifyQuestInputContract } from './modify-quest-input-contract';
import { ModifyQuestInputStub } from './modify-quest-input.stub';

describe('modifyQuestInputContract', () => {
  it('VALID: {questId only} => parses successfully', () => {
    const result = ModifyQuestInputStub({ questId: 'add-auth' });

    expect(result).toStrictEqual({ questId: 'add-auth' });
  });

  it('VALID: {questId with title} => parses successfully', () => {
    const result = modifyQuestInputContract.parse({
      questId: 'add-auth',
      title: 'Updated Title',
    });

    expect(result).toStrictEqual({ questId: 'add-auth', title: 'Updated Title' });
  });

  it('INVALID: {questId: ""} => throws validation error', () => {
    expect(() => {
      return modifyQuestInputContract.parse({ questId: '' });
    }).toThrow(/too_small/u);
  });

  it('INVALID: {unknown key} => throws Unrecognized key error', () => {
    expect(() => {
      return modifyQuestInputContract.parse({
        questId: 'add-auth',
        unknownField: 'should fail',
      } as never);
    }).toThrow(/Unrecognized key/u);
  });

  it('VALID: {pausedAtStatus} => parses with pausedAtStatus field (orchestrator-only, stripped at MCP layer)', () => {
    const result = modifyQuestInputContract.parse({
      questId: 'add-auth',
      pausedAtStatus: 'seek_scope',
    });

    expect(result).toStrictEqual({
      questId: 'add-auth',
      pausedAtStatus: 'seek_scope',
    });
  });

  it('VALID: {pausedAtStatus: null} => parses with null (clear marker for resume)', () => {
    const result = modifyQuestInputContract.parse({
      questId: 'add-auth',
      pausedAtStatus: null,
    });

    expect(result).toStrictEqual({
      questId: 'add-auth',
      pausedAtStatus: null,
    });
  });

  it('VALID: {planningNotes with blightReports upsert} => parses successfully', () => {
    const result = modifyQuestInputContract.parse({
      questId: 'add-auth',
      planningNotes: {
        blightReports: [
          {
            id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            workItemId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
            minion: 'security',
            status: 'active',
            findings: [],
            createdAt: '2024-01-15T10:00:00.000Z',
            reviewedOn: [],
          },
        ],
      },
    });

    expect(result).toStrictEqual({
      questId: 'add-auth',
      planningNotes: {
        blightReports: [
          {
            id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            workItemId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
            minion: 'security',
            status: 'active',
            findings: [],
            createdAt: '2024-01-15T10:00:00.000Z',
            reviewedOn: [],
          },
        ],
      },
    });
  });

  it('VALID: {planningNotes with blightReports delete marker} => parses successfully', () => {
    const result = modifyQuestInputContract.parse({
      questId: 'add-auth',
      planningNotes: {
        blightReports: [{ id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', _delete: true }],
      },
    });

    expect(result).toStrictEqual({
      questId: 'add-auth',
      planningNotes: {
        blightReports: [{ id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', _delete: true }],
      },
    });
  });
});
