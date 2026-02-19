import { observableContract } from './observable-contract';
import { ObservableStub } from './observable.stub';

describe('observableContract', () => {
  it('VALID: {id, contextId, trigger, dependsOn, outcomes} => parses successfully', () => {
    const observable = ObservableStub({
      id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
      contextId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      trigger: "Click 'Edit' button on permission row",
      dependsOn: [],
      outcomes: [
        {
          type: 'api-call',
          description: 'Fetches permission data',
          criteria: { method: 'GET', endpoint: '/api/permissions/{id}' },
        },
      ],
    });

    expect(observable).toStrictEqual({
      id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
      contextId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      trigger: "Click 'Edit' button on permission row",
      dependsOn: [],
      outcomes: [
        {
          type: 'api-call',
          description: 'Fetches permission data',
          criteria: { method: 'GET', endpoint: '/api/permissions/{id}' },
        },
      ],
      verification: [],
    });
  });

  it('VALID: {with dependsOn} => parses with observable dependencies', () => {
    const observable = ObservableStub({
      dependsOn: ['b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e', 'c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f'],
    });

    expect(observable.dependsOn).toStrictEqual([
      'b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e',
      'c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f',
    ]);
  });

  it('VALID: {multiple outcomes} => parses with multiple outcomes', () => {
    const observable = ObservableStub({
      outcomes: [
        {
          type: 'api-call',
          description: 'API call outcome',
          criteria: { method: 'POST' },
        },
        {
          type: 'ui-state',
          description: 'Modal visible',
          criteria: { selector: '[data-modal]', state: 'visible' },
        },
      ],
    });

    expect(observable.outcomes).toStrictEqual([
      {
        type: 'api-call',
        description: 'API call outcome',
        criteria: { method: 'POST' },
      },
      {
        type: 'ui-state',
        description: 'Modal visible',
        criteria: { selector: '[data-modal]', state: 'visible' },
      },
    ]);
  });

  it('VALID: {default values} => uses stub defaults', () => {
    const observable = ObservableStub();

    expect(observable).toStrictEqual({
      id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
      contextId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      trigger: 'Click test button',
      dependsOn: [],
      outcomes: [],
      verification: [],
    });
  });

  it('VALID: {with verification steps} => parses verification array', () => {
    const observable = ObservableStub({
      verification: [
        {
          action: 'assert',
          target: 'response.status',
          value: '200',
          condition: 'equals',
          type: 'api-call',
        },
      ],
    });

    expect(observable.verification).toStrictEqual([
      {
        action: 'assert',
        target: 'response.status',
        value: '200',
        condition: 'equals',
        type: 'api-call',
      },
    ]);
  });

  it('VALID: {without verification field} => backward compat defaults to empty array', () => {
    const result = observableContract.parse({
      id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
      contextId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      trigger: 'Click test button',
      dependsOn: [],
      outcomes: [],
    });

    expect(result.verification).toStrictEqual([]);
  });

  it('VALID: {with verification fields} => parses verification status', () => {
    const observable = ObservableStub({
      verificationStatus: 'verified',
      verifiedAt: '2024-01-15T12:00:00.000Z',
      verificationNotes: 'Manually verified against production',
    });

    expect(observable.verificationStatus).toBe('verified');
    expect(observable.verifiedAt).toBe('2024-01-15T12:00:00.000Z');
    expect(observable.verificationNotes).toBe('Manually verified against production');
  });

  it('VALID: {verificationStatus pending} => parses pending status', () => {
    const observable = ObservableStub({
      verificationStatus: 'pending',
    });

    expect(observable.verificationStatus).toBe('pending');
  });

  it('VALID: {verificationStatus failed} => parses failed status', () => {
    const observable = ObservableStub({
      verificationStatus: 'failed',
      verificationNotes: 'API endpoint returns 404',
    });

    expect(observable.verificationStatus).toBe('failed');
    expect(observable.verificationNotes).toBe('API endpoint returns 404');
  });

  it('INVALID_ID: {id: "bad"} => throws validation error', () => {
    const parseInvalidId = (): unknown =>
      observableContract.parse({
        id: 'bad',
        contextId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        trigger: 'Click',
        dependsOn: [],
        outcomes: [],
      });

    expect(parseInvalidId).toThrow(/Invalid uuid/u);
  });

  it('INVALID_CONTEXT_ID: {contextId: "bad"} => throws validation error', () => {
    const parseInvalidContextId = (): unknown =>
      observableContract.parse({
        id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
        contextId: 'bad',
        trigger: 'Click',
        dependsOn: [],
        outcomes: [],
      });

    expect(parseInvalidContextId).toThrow(/Invalid uuid/u);
  });

  it('INVALID_TRIGGER: {trigger: ""} => throws validation error', () => {
    const parseEmptyTrigger = (): unknown =>
      observableContract.parse({
        id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
        contextId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        trigger: '',
        dependsOn: [],
        outcomes: [],
      });

    expect(parseEmptyTrigger).toThrow(/String must contain at least 1 character/u);
  });

  it('INVALID_DEPENDS_ON: {dependsOn: ["bad"]} => throws validation error', () => {
    const parseInvalidDependsOn = (): unknown =>
      observableContract.parse({
        id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
        contextId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        trigger: 'Click',
        dependsOn: ['bad'],
        outcomes: [],
      });

    expect(parseInvalidDependsOn).toThrow(/Invalid uuid/u);
  });

  it('INVALID_OUTCOME_TYPE: {outcomes with invalid type} => throws validation error', () => {
    const parseInvalidOutcomeType = (): unknown =>
      observableContract.parse({
        id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
        contextId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        trigger: 'Click',
        dependsOn: [],
        outcomes: [{ type: 'invalid-type', description: 'Test', criteria: {} }],
      });

    expect(parseInvalidOutcomeType).toThrow(/Invalid enum value/u);
  });
});
