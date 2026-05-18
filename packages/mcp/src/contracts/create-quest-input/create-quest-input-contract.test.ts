import { createQuestInputContract } from './create-quest-input-contract';
import { CreateQuestInputStub } from './create-quest-input.stub';

describe('createQuestInputContract', () => {
  it('VALID: {} (empty object) => parses successfully', () => {
    const result = createQuestInputContract.parse(CreateQuestInputStub());

    expect(result).toStrictEqual({});
  });

  it('VALID: {} (explicit empty) => parses successfully', () => {
    const result = createQuestInputContract.parse({});

    expect(result).toStrictEqual({});
  });

  it('INVALID: {questId: "anything"} => throws Unrecognized key error', () => {
    expect(() => createQuestInputContract.parse({ questId: 'anything' } as never)).toThrow(
      /Unrecognized key/u,
    );
  });
});
