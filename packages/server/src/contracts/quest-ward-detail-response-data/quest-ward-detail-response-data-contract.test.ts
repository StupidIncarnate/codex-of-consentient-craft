import { WardDetailStub } from '@dungeonmaster/shared/contracts/ward-detail/ward-detail.stub';
import { questWardDetailResponseDataContract } from './quest-ward-detail-response-data-contract';
import { QuestWardDetailResponseDataStub } from './quest-ward-detail-response-data.stub';

describe('questWardDetailResponseDataContract', () => {
  it('VALID: {default stub} => parses to the default data', () => {
    const result = QuestWardDetailResponseDataStub();

    expect(questWardDetailResponseDataContract.parse(result)).toStrictEqual({
      detail: WardDetailStub(),
    });
  });

  it('INVALID: {missing detail} => throws validation error', () => {
    expect(() => questWardDetailResponseDataContract.parse({})).toThrow(/received undefined/u);
  });

  it('INVALID: {unknown key} => throws unrecognized key error', () => {
    expect(() =>
      questWardDetailResponseDataContract.parse({ detail: WardDetailStub(), extra: 1 }),
    ).toThrow(/Unrecognized key: \\"extra\\"/u);
  });
});
