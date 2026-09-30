import { CommandChatOutputEmitStub } from './command-chat-output-emit.stub';
import { commandChatOutputEmitContract } from './command-chat-output-emit-contract';

describe('commandChatOutputEmitContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = CommandChatOutputEmitStub();

      expect(commandChatOutputEmitContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {type: wrong type} => throws', () => {
      expect(() =>
        commandChatOutputEmitContract.parse({ ...CommandChatOutputEmitStub(), type: 123 }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
