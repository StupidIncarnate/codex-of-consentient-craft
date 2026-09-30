import { mcpQuestWorkInputContract } from './mcp-quest-work-input-contract';
import { McpQuestWorkInputStub } from './mcp-quest-work-input.stub';

describe('mcpQuestWorkInputContract', () => {
  it('VALID: {kind: outcome} => round-trips', () => {
    const input = McpQuestWorkInputStub();

    const result = mcpQuestWorkInputContract.parse(input);

    expect(result).toStrictEqual(input);
  });

  it('VALID: {kind: plan, plan: a raw record} => round-trips without validating the plan shape', () => {
    const input = McpQuestWorkInputStub({
      payload: { kind: 'plan', plan: { operationItemId: 'a1b2c3d4', batches: [] } },
    });

    const result = mcpQuestWorkInputContract.parse(input);

    expect(result).toStrictEqual(input);
  });

  it('VALID: {kind: observations, cant-meet with toSettle} => round-trips', () => {
    const input = McpQuestWorkInputStub({
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

    const result = mcpQuestWorkInputContract.parse(input);

    expect(result).toStrictEqual(input);
  });

  it("INVALID: {kind: 'signal'} => refused, no seventh branch exists", () => {
    expect(() =>
      mcpQuestWorkInputContract.parse({
        questId: 'add-auth',
        workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        payload: { kind: 'signal', reason: 'not a real kind' },
      }),
    ).toThrow(/invalid/iu);
  });

  it('INVALID: {an unadvertised top-level key} => refused by .strict()', () => {
    const input: Record<PropertyKey, unknown> = McpQuestWorkInputStub();
    input.extra = 'nope';

    expect(() => mcpQuestWorkInputContract.parse(input)).toThrow(/unrecognized/iu);
  });
});
