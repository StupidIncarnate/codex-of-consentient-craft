import { questHumanVerdictResponseDataContract } from './quest-human-verdict-response-data-contract';
import { QuestHumanVerdictResponseDataStub } from './quest-human-verdict-response-data.stub';

describe('questHumanVerdictResponseDataContract', () => {
  it('VALID: {default stub} => parses to the default data', () => {
    const result = QuestHumanVerdictResponseDataStub();

    expect(questHumanVerdictResponseDataContract.parse(result)).toStrictEqual({ ok: true });
  });

  it('INVALID: {ok: yes} => throws validation error', () => {
    expect(() => questHumanVerdictResponseDataContract.parse({ ok: 'yes' })).toThrow(
      /expected boolean, received string/u,
    );
  });

  it('INVALID: {unknown key} => throws unrecognized key error', () => {
    expect(() => questHumanVerdictResponseDataContract.parse({ ok: true, extra: 1 })).toThrow(
      /Unrecognized key: \\"extra\\"/u,
    );
  });
});
