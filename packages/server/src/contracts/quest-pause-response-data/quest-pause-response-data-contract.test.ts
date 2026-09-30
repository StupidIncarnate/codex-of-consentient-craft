import { questPauseResponseDataContract } from './quest-pause-response-data-contract';
import { QuestPauseResponseDataStub } from './quest-pause-response-data.stub';

describe('questPauseResponseDataContract', () => {
  it('VALID: {default stub} => parses to the default data', () => {
    const result = QuestPauseResponseDataStub();

    expect(questPauseResponseDataContract.parse(result)).toStrictEqual({ paused: true });
  });

  it('INVALID: {paused: yes} => throws validation error', () => {
    expect(() => questPauseResponseDataContract.parse({ paused: 'yes' })).toThrow(
      /expected boolean, received string/u,
    );
  });

  it('INVALID: {unknown key} => throws unrecognized key error', () => {
    expect(() => questPauseResponseDataContract.parse({ paused: true, extra: 1 })).toThrow(
      /Unrecognized key: \\"extra\\"/u,
    );
  });
});
