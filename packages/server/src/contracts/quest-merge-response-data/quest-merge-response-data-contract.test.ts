import { questMergeResponseDataContract } from './quest-merge-response-data-contract';
import { QuestMergeResponseDataStub } from './quest-merge-response-data.stub';

describe('questMergeResponseDataContract', () => {
  it('VALID: {default stub} => parses to the default data', () => {
    const result = QuestMergeResponseDataStub();

    expect(questMergeResponseDataContract.parse(result)).toStrictEqual({ merging: true });
  });

  it('INVALID: {merging: yes} => throws validation error', () => {
    expect(() => questMergeResponseDataContract.parse({ merging: 'yes' })).toThrow(
      /expected boolean, received string/u,
    );
  });

  it('INVALID: {unknown key} => throws unrecognized key error', () => {
    expect(() => questMergeResponseDataContract.parse({ merging: true, extra: 1 })).toThrow(
      /Unrecognized key: \\"extra\\"/u,
    );
  });
});
