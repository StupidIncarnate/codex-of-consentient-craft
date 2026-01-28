import { commandHandlerContract } from './command-handler-contract';
import { CommandHandlerStub } from './command-handler.stub';

describe('commandHandlerContract', () => {
  describe('valid input', () => {
    it('VALID: {function} => parses successfully', () => {
      const handler = CommandHandlerStub();

      const result = commandHandlerContract.parse(handler);

      expect(typeof result).toBe('function');
    });
  });
});
