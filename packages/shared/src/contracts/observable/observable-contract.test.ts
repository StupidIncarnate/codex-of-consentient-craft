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
    });
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
