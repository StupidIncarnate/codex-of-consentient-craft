import { createQuestInputContract } from './create-quest-input-contract';
import { CreateQuestInputStub } from './create-quest-input.stub';

describe('createQuestInputContract', () => {
  it('VALID: {userRequest} => parses successfully', () => {
    const result = createQuestInputContract.parse(
      CreateQuestInputStub({ userRequest: 'Add auth to the app' as never }),
    );

    expect(result).toStrictEqual({ userRequest: 'Add auth to the app' });
  });

  it('INVALID: {} (empty object) => throws Required error for userRequest', () => {
    expect(() => createQuestInputContract.parse({})).toThrow(/userRequest/u);
  });

  it('INVALID: {userRequest: ""} (empty string) => throws min length error', () => {
    expect(() => createQuestInputContract.parse({ userRequest: '' })).toThrow(
      /String must contain at least 1/u,
    );
  });

  it('VALID: {userRequest, questType: "bug-hunt"} => parses with questType', () => {
    const result = createQuestInputContract.parse({
      userRequest: 'The tool result is not rendering',
      questType: 'bug-hunt',
    });

    expect(result).toStrictEqual({
      userRequest: 'The tool result is not rendering',
      questType: 'bug-hunt',
    });
  });

  it('INVALID: {userRequest, questType: "bogus"} => throws Invalid enum value', () => {
    expect(() =>
      createQuestInputContract.parse({
        userRequest: 'valid',
        questType: 'bogus',
      } as never),
    ).toThrow(/Invalid enum value/u);
  });

  it('INVALID: {userRequest, questId: "anything"} => throws Unrecognized key error', () => {
    expect(() =>
      createQuestInputContract.parse({
        userRequest: 'valid',
        questId: 'anything',
      } as never),
    ).toThrow(/Unrecognized key/u);
  });
});
