import { questBySessionResponseContract } from './quest-by-session-response-contract';
import { QuestBySessionResponseStub } from './quest-by-session-response.stub';

describe('questBySessionResponseContract', () => {
  it('VALID: {questId: non-empty string} => parses successfully', () => {
    const stub = QuestBySessionResponseStub();
    const result = questBySessionResponseContract.parse(stub);

    expect(String(result.questId)).toBe(String(stub.questId));
  });

  it('INVALID: {questId: missing} => throws', () => {
    expect(() => questBySessionResponseContract.parse({})).toThrow(/questId/u);
  });

  it('INVALID: {questId: empty string} => throws (zod validation error)', () => {
    expect(() => questBySessionResponseContract.parse({ questId: '' })).toThrow(/questId/u);
  });
});
