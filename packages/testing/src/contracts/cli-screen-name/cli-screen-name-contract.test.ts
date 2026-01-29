import { cliScreenNameContract } from './cli-screen-name-contract';
import { CliScreenNameStub } from './cli-screen-name.stub';

describe('cliScreenNameContract', () => {
  it('VALID: {valid screen name} => parses successfully', () => {
    const result = cliScreenNameContract.parse('menu');

    expect(result).toBe('menu');
  });

  it('VALID: {all valid screen names} => parses all enum values', () => {
    const validScreens = ['menu', 'add', 'list', 'help', 'run', 'answer', 'init'];

    const results = validScreens.map((screen) => cliScreenNameContract.parse(screen));

    expect(results).toStrictEqual(validScreens);
  });

  it('INVALID: {invalid screen name} => throws ZodError', () => {
    expect(() => cliScreenNameContract.parse('invalid')).toThrow('Invalid enum value');
  });
});

describe('CliScreenNameStub', () => {
  it('VALID: {no args} => returns default menu screen', () => {
    const result = CliScreenNameStub();

    expect(result).toBe('menu');
  });

  it('VALID: {custom value} => returns specified screen', () => {
    const result = CliScreenNameStub({ value: 'list' });

    expect(result).toBe('list');
  });
});
