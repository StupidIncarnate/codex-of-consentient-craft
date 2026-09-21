import { questWorkRecordResultContract } from './quest-work-record-result-contract';
import { QuestWorkRecordResultStub } from './quest-work-record-result.stub';

describe('questWorkRecordResultContract', () => {
  it("VALID: {kind: 'observations', count} => round-trips", () => {
    const input = QuestWorkRecordResultStub({ kind: 'observations', count: 3 });

    const result = questWorkRecordResultContract.parse(input);

    expect(result).toStrictEqual(input);
  });

  it("VALID: {kind: 'outcome', word} => round-trips", () => {
    const input = QuestWorkRecordResultStub({ kind: 'outcome', word: 'unmet' });

    const result = questWorkRecordResultContract.parse(input);

    expect(result).toStrictEqual(input);
  });

  it("VALID: {kind: 'invalidation', flowId, noteId, clearedCount} => round-trips", () => {
    const input = QuestWorkRecordResultStub({
      kind: 'invalidation',
      flowId: 'send-flow' as never,
      noteId: 'walk-reset-send-flow-1' as never,
      clearedCount: 4,
    });

    const result = questWorkRecordResultContract.parse(input);

    expect(result).toStrictEqual(input);
  });

  it("VALID: {kind: 'request', step} => round-trips", () => {
    const input = QuestWorkRecordResultStub({ kind: 'request', step: 'recipe' as never });

    const result = questWorkRecordResultContract.parse(input);

    expect(result).toStrictEqual(input);
  });

  it("INVALID: {kind: 'signal'} => refused, no seventh branch exists", () => {
    expect(() => questWorkRecordResultContract.parse({ kind: 'signal' })).toThrow(/invalid/iu);
  });
});
