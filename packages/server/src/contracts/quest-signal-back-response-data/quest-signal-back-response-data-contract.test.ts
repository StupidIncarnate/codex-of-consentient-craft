import { questSignalBackResponseDataContract } from './quest-signal-back-response-data-contract';
import { QuestSignalBackResponseDataStub } from './quest-signal-back-response-data.stub';

describe('questSignalBackResponseDataContract', () => {
  it('VALID: {default stub} => parses to the default data', () => {
    const result = QuestSignalBackResponseDataStub();

    expect(questSignalBackResponseDataContract.parse(result)).toStrictEqual({ ok: true });
  });

  it('INVALID: {ok: yes} => throws validation error', () => {
    expect(() => questSignalBackResponseDataContract.parse({ ok: 'yes' })).toThrow(
      /expected boolean, received string/u,
    );
  });

  it('INVALID: {unknown key} => throws unrecognized key error', () => {
    expect(() => questSignalBackResponseDataContract.parse({ ok: true, extra: 1 })).toThrow(
      /Unrecognized key: \\"extra\\"/u,
    );
  });
});
