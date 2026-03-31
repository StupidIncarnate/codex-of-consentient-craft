import { ToolResponseStub } from '../tool-response/tool-response.stub';

import { toolRegistrationContract as _toolRegistrationContract } from './tool-registration-contract';
import { ToolRegistrationStub } from './tool-registration.stub';

type ToolRegistration = ReturnType<typeof ToolRegistrationStub>;
type ToolResponse = ReturnType<typeof ToolResponseStub>;

describe('toolRegistrationContract', () => {
  describe('valid registrations', () => {
    it('VALID: default stub => returns complete tool registration', () => {
      const registration: ToolRegistration = ToolRegistrationStub();

      expect(registration).toStrictEqual({
        name: 'stub-tool',
        description: 'A stub tool for testing',
        inputSchema: {
          type: 'object',
          properties: {},
        },
        handler: expect.any(Function),
      });
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

      expect(customHandler.mock.calls).toStrictEqual([[{ args: { key: 'value' } }]]);
    });

    it('VALID: custom name and description => overrides defaults', () => {
      const registration = ToolRegistrationStub({
        name: 'get-quest',
        description: 'Retrieves a quest by ID',
      });

      expect(registration).toStrictEqual({
        name: 'get-quest',
        description: 'Retrieves a quest by ID',
        inputSchema: {
          type: 'object',
          properties: {},
        },
        handler: expect.any(Function),
      });
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
