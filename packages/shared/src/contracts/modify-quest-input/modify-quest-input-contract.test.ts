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
      pausedAtStatus: 'in_progress',
    });

    expect(result).toStrictEqual({
      questId: 'add-auth',
      pausedAtStatus: 'in_progress',
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

  it('VALID: {operations full shape} => parses successfully', () => {
    const result = modifyQuestInputContract.parse({
      questId: 'add-auth',
      operations: [
        {
          id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          role: 'codeweaver',
          text: 'core: config load+validate adapter',
          status: 'pending',
        },
      ],
    });

    expect(result).toStrictEqual({
      questId: 'add-auth',
      operations: [
        {
          id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          role: 'codeweaver',
          text: 'core: config load+validate adapter',
          status: 'pending',
          locked: false,
        },
      ],
    });
  });

  it('VALID: {operations partial-patch shape: id + status only} => parses successfully', () => {
    const result = modifyQuestInputContract.parse({
      questId: 'add-auth',
      operations: [{ id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', status: 'complete' }],
    });

    expect(result).toStrictEqual({
      questId: 'add-auth',
      operations: [{ id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', status: 'complete' }],
    });
  });

  it('VALID: {operations delete marker} => parses successfully', () => {
    const result = modifyQuestInputContract.parse({
      questId: 'add-auth',
      operations: [{ id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', _delete: true }],
    });

    expect(result).toStrictEqual({
      questId: 'add-auth',
      operations: [{ id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', _delete: true }],
    });
  });

  it('VALID: {contracts partial-patch shape: id + status flip} => parses successfully', () => {
    const result = modifyQuestInputContract.parse({
      questId: 'add-auth',
      contracts: [{ id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', status: 'existing' }],
    });

    expect(result).toStrictEqual({
      questId: 'add-auth',
      contracts: [{ id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', status: 'existing' }],
    });
  });

  it('VALID: {designDecisions partial-patch shape: id + rationale only} => parses successfully', () => {
    const result = modifyQuestInputContract.parse({
      questId: 'add-auth',
      designDecisions: [
        { id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', rationale: 'Sharpened wording' },
      ],
    });

    expect(result).toStrictEqual({
      questId: 'add-auth',
      designDecisions: [
        { id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', rationale: 'Sharpened wording' },
      ],
    });
  });

  it('VALID: {planningNotes.blightReports partial-patch: id + status only} => parses successfully', () => {
    const result = modifyQuestInputContract.parse({
      questId: 'add-auth',
      planningNotes: {
        blightReports: [{ id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', status: 'blocking-carry' }],
      },
    });

    expect(result).toStrictEqual({
      questId: 'add-auth',
      planningNotes: {
        blightReports: [{ id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', status: 'blocking-carry' }],
      },
    });
  });

  it('VALID: {packagesAffected} => parses successfully', () => {
    const result = modifyQuestInputContract.parse({
      questId: 'add-auth',
      packagesAffected: ['orchestrator', 'web', 'shared'],
    });

    expect(result).toStrictEqual({
      questId: 'add-auth',
      packagesAffected: ['orchestrator', 'web', 'shared'],
    });
  });

  it('INVALID: {operations partial-patch missing id} => throws validation error', () => {
    expect(() => {
      return modifyQuestInputContract.parse({
        questId: 'add-auth',
        operations: [{ status: 'complete' } as never],
      });
    }).toThrow(/Required|Invalid/u);
  });

  it('INVALID: {operations item with partial status} => throws validation error', () => {
    expect(() => {
      return modifyQuestInputContract.parse({
        questId: 'add-auth',
        operations: [
          {
            id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            role: 'codeweaver',
            text: 'core: config load+validate adapter',
            status: 'partial',
          } as never,
        ],
      });
    }).toThrow(/Invalid/u);
  });

  it('INVALID: {steps key} => throws Unrecognized key error (removed field)', () => {
    expect(() => {
      return modifyQuestInputContract.parse({
        questId: 'add-auth',
        steps: [{ id: 'web-update-widget' }],
      } as never);
    }).toThrow(/Unrecognized key/u);
  });
});
