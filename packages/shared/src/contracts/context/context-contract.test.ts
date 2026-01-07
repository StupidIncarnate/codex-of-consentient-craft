import { contextContract } from './context-contract';
import { ContextStub } from './context.stub';

describe('contextContract', () => {
  it('VALID: {id, name, description, locator} => parses successfully', () => {
    const context = ContextStub({
      id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      name: 'User Admin - Permissions Section',
      description: 'The permissions management section of user admin',
      locator: { page: '/admin/users', section: '#permissions' },
    });

    expect(context).toStrictEqual({
      id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      name: 'User Admin - Permissions Section',
      description: 'The permissions management section of user admin',
      locator: { page: '/admin/users', section: '#permissions' },
    });
  });

  it('VALID: {minimal locator} => parses with empty locator', () => {
    const context = ContextStub({
      locator: {},
    });

    expect(context.locator).toStrictEqual({});
  });

  it('VALID: {default values} => uses stub defaults', () => {
    const context = ContextStub();

    expect(context).toStrictEqual({
      id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      name: 'Test Context',
      description: 'A test context for unit tests',
      locator: {},
    });
  });

  it('INVALID_ID: {id: "bad"} => throws validation error', () => {
    const parseInvalidId = (): unknown =>
      contextContract.parse({
        id: 'bad',
        name: 'Test',
        description: 'Test',
        locator: {},
      });

    expect(parseInvalidId).toThrow(/Invalid uuid/u);
  });

  it('INVALID_NAME: {name: ""} => throws validation error', () => {
    const parseEmptyName = (): unknown =>
      contextContract.parse({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        name: '',
        description: 'Test',
        locator: {},
      });

    expect(parseEmptyName).toThrow(/String must contain at least 1 character/u);
  });

  it('INVALID_MISSING: {no locator} => throws validation error', () => {
    const parseMissingLocator = (): unknown =>
      contextContract.parse({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        name: 'Test',
        description: 'Test',
      });

    expect(parseMissingLocator).toThrow(/Required/u);
  });
});
