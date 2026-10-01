import { runnerCommandContract } from './runner-command-contract';
import { RunnerCommandStub } from './runner-command.stub';

describe('runnerCommandContract', () => {
  describe('valid inputs', () => {
    it('VALID: {bin spawned directly} => parses with no leading args', () => {
      const result = runnerCommandContract.parse(RunnerCommandStub());

      expect(result).toStrictEqual({
        command: '/project/node_modules/.bin/jest',
        leadingArgs: [],
      });
    });

    it('VALID: {bin run through node with the source condition} => parses the leading args', () => {
      const result = runnerCommandContract.parse(
        RunnerCommandStub({
          command: '/usr/bin/node',
          leadingArgs: ['--conditions=source', '/project/node_modules/.bin/jest'],
        }),
      );

      expect(result).toStrictEqual({
        command: '/usr/bin/node',
        leadingArgs: ['--conditions=source', '/project/node_modules/.bin/jest'],
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {command: ""} => throws', () => {
      expect(() => runnerCommandContract.parse({ command: '', leadingArgs: [] })).toThrow(
        /Too small: expected string to have >=1 characters/u,
      );
    });

    it('INVALID: {leadingArgs: [""]} => throws', () => {
      expect(() =>
        runnerCommandContract.parse({ command: '/usr/bin/node', leadingArgs: [''] }),
      ).toThrow(/Too small: expected string to have >=1 characters/u);
    });
  });
});
