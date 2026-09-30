import { questRiftcarverDetailResponseDataContract } from './quest-riftcarver-detail-response-data-contract';
import { QuestRiftcarverDetailResponseDataStub } from './quest-riftcarver-detail-response-data.stub';

describe('questRiftcarverDetailResponseDataContract', () => {
  it('VALID: {default stub} => parses to the default data', () => {
    const result = QuestRiftcarverDetailResponseDataStub();

    expect(questRiftcarverDetailResponseDataContract.parse(result)).toStrictEqual({
      log: 'carving worktree\n',
    });
  });

  it('INVALID: {missing log} => throws validation error', () => {
    expect(() => questRiftcarverDetailResponseDataContract.parse({})).toThrow(
      /received undefined/u,
    );
  });

  it('INVALID: {unknown key} => throws unrecognized key error', () => {
    expect(() => questRiftcarverDetailResponseDataContract.parse({ log: '', extra: 1 })).toThrow(
      /Unrecognized key: \\"extra\\"/u,
    );
  });
});
