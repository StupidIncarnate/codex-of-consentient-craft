import { questWorkInputContract } from './quest-work-input-contract';
import { QuestWorkInputStub } from './quest-work-input.stub';

describe('questWorkInputContract', () => {
  it('VALID: {kind: outcome} => round-trips', () => {
    const input = QuestWorkInputStub();

    const result = questWorkInputContract.parse(input);

    expect(result).toStrictEqual(input);
  });

  it('VALID: {kind: plan, plan: a raw record} => round-trips without validating the plan shape', () => {
    const input = QuestWorkInputStub({
      payload: { kind: 'plan', plan: { operationItemId: 'a1b2c3d4', batches: [] } },
    });

    const result = questWorkInputContract.parse(input);

    expect(result).toStrictEqual(input);
  });

  it('VALID: {kind: observations, cant-meet with toSettle} => round-trips', () => {
    const input = QuestWorkInputStub({
      payload: {
        kind: 'observations',
        observations: [
          {
            unitId: 'send-flow:observable:scan-finds-every-path',
            mark: 'cant-meet',
            evidence: 'cannot be reached from this layer',
            toSettle: 'drive a real send and read the session JSONL',
          },
        ],
      },
    });

    const result = questWorkInputContract.parse(input);

    expect(result).toStrictEqual(input);
  });

  it("INVALID: {kind: 'signal'} => refused, no seventh branch exists", () => {
    expect(() =>
      questWorkInputContract.parse({
        questId: 'add-auth',
        workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        payload: { kind: 'signal', reason: 'not a real kind' },
      }),
    ).toThrow(/invalid/iu);
  });

  it('INVALID: {an unadvertised top-level key} => refused by .strict()', () => {
    const input: Record<PropertyKey, unknown> = QuestWorkInputStub();
    input.extra = 'nope';

    expect(() => questWorkInputContract.parse(input)).toThrow(/unrecognized/iu);
  });
});
