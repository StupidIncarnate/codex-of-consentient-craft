import { ToolResponseStub } from '../tool-response/tool-response.stub';

import { toolRegistrationContract as _toolRegistrationContract } from './tool-registration-contract';
import { ToolRegistrationStub } from './tool-registration.stub';

type ToolRegistration = ReturnType<typeof ToolRegistrationStub>;
type ToolResponse = ReturnType<typeof ToolResponseStub>;

describe('toolRegistrationContract', () => {
  describe('valid registrations', () => {
    it('VALID: default stub => returns complete tool registration', () => {
      const registration: ToolRegistration = ToolRegistrationStub();

      expect(registration.name).toBe('stub-tool');
      expect(registration.description).toBe('A stub tool for testing');
      expect(registration.inputSchema).toStrictEqual({
        type: 'object',
        properties: {},
      });
      expect(typeof registration.handler).toBe('function');
    });

    it('VALID: handler returns ToolResponse => resolves with valid response', async () => {
      const registration = ToolRegistrationStub();

      const response: ToolResponse = await registration.handler({
        args: {},
      });

      expect(response).toStrictEqual({
        content: [{ type: 'text', text: 'Stub response' }],
      });
    });

    it('VALID: custom handler => preserves handler reference', async () => {
      const customHandler = jest.fn().mockResolvedValue(
        ToolResponseStub({
          content: [{ type: 'text', text: 'Custom' }],
        }),
      );

      const registration = ToolRegistrationStub({ handler: customHandler });

      await registration.handler({ args: { key: 'value' } });

      expect(customHandler).toHaveBeenCalledTimes(1);
      expect(customHandler).toHaveBeenCalledWith({ args: { key: 'value' } });
    });

    it('VALID: custom name and description => overrides defaults', () => {
      const registration = ToolRegistrationStub({
        name: 'get-quest',
        description: 'Retrieves a quest by ID',
      });

      expect(registration.name).toBe('get-quest');
      expect(registration.description).toBe('Retrieves a quest by ID');
    });
  });

  describe('invalid registrations', () => {
    it('INVALID: {} => throws when required fields are missing', () => {
      expect(() => {
        _toolRegistrationContract.parse({});
      }).toThrow(/Required/u);
    });

    it('INVALID: {name: 123} => throws when name is not a string', () => {
      expect(() => {
        _toolRegistrationContract.parse({
          name: 123,
          description: 'test',
          inputSchema: {},
        });
      }).toThrow(/Expected string/u);
    });
  });
});
