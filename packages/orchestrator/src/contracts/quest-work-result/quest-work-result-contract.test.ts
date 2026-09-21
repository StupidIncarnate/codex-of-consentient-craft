import { questWorkResultContract } from './quest-work-result-contract';
import { QuestWorkResultStub } from './quest-work-result.stub';

describe('questWorkResultContract', () => {
  it("VALID: {kind: 'plan', operationItemId} => round-trips", () => {
    const input = QuestWorkResultStub({
      kind: 'plan',
      operationItemId: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479' as never,
    });

    const result = questWorkResultContract.parse(input);

    expect(result).toStrictEqual(input);
  });

  it("VALID: {kind: 'amendment', operationItemId} => round-trips", () => {
    const input = QuestWorkResultStub({
      kind: 'amendment',
      operationItemId: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479' as never,
    });

    const result = questWorkResultContract.parse(input);

    expect(result).toStrictEqual(input);
  });

  it("VALID: {kind: 'observations', count} => round-trips through the reused record branches", () => {
    const input = QuestWorkResultStub({ kind: 'observations', count: 2 });

    const result = questWorkResultContract.parse(input);

    expect(result).toStrictEqual(input);
  });

  it("INVALID: {kind: 'signal'} => refused, no seventh branch exists", () => {
    expect(() => questWorkResultContract.parse({ kind: 'signal' })).toThrow(/invalid/iu);
  });
});
