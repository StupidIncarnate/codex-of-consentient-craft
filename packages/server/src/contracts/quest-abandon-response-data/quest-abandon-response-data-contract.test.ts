import { questAbandonResponseDataContract } from './quest-abandon-response-data-contract';
import { QuestAbandonResponseDataStub } from './quest-abandon-response-data.stub';

describe('questAbandonResponseDataContract', () => {
  it('VALID: {default stub} => parses to the default data', () => {
    const result = QuestAbandonResponseDataStub();

    expect(questAbandonResponseDataContract.parse(result)).toStrictEqual({ abandoned: true });
  });

  it('INVALID: {abandoned: yes} => throws validation error', () => {
    expect(() => questAbandonResponseDataContract.parse({ abandoned: 'yes' })).toThrow(
      /expected boolean, received string/u,
    );
  });

  it('INVALID: {unknown key} => throws unrecognized key error', () => {
    expect(() => questAbandonResponseDataContract.parse({ abandoned: true, extra: 1 })).toThrow(
      /Unrecognized key: \\"extra\\"/u,
    );
  });
});
