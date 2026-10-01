import { questStartResponseDataContract } from './quest-start-response-data-contract';
import { QuestStartResponseDataStub } from './quest-start-response-data.stub';

describe('questStartResponseDataContract', () => {
  it('VALID: {default stub} => parses to the default data', () => {
    const result = QuestStartResponseDataStub();

    expect(questStartResponseDataContract.parse(result)).toStrictEqual({
      processId: 'proc-12345',
      dispatch: { started: true },
    });
  });

  it('VALID: {dispatch not started, with reason} => keeps the reason', () => {
    const result = QuestStartResponseDataStub({
      dispatch: { started: false, reason: 'dispatch-state.json is unwritable' },
    });

    expect(questStartResponseDataContract.parse(result)).toStrictEqual({
      processId: 'proc-12345',
      dispatch: { started: false, reason: 'dispatch-state.json is unwritable' },
    });
  });

  it('INVALID: {missing processId} => throws validation error', () => {
    expect(() => questStartResponseDataContract.parse({ dispatch: { started: true } })).toThrow(
      /received undefined/u,
    );
  });

  it('INVALID: {empty string processId} => throws min length error', () => {
    expect(() =>
      questStartResponseDataContract.parse({ processId: '', dispatch: { started: true } }),
    ).toThrow(/Too small|expected string to have >=1 characters/u);
  });
});
