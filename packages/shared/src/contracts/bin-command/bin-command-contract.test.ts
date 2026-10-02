import { binCommandContract } from './bin-command-contract';
import { BinCommandStub } from './bin-command.stub';

describe('binCommandContract', () => {
  it('VALID: {default stub} => parses the command with no leading arguments', () => {
    expect(binCommandContract.parse(BinCommandStub())).toStrictEqual({
      command: 'dungeonmaster-ward',
      leadingArgs: [],
    });
  });

  it('VALID: {node plus an entry script} => parses both', () => {
    expect(
      binCommandContract.parse(
        BinCommandStub({ command: '/usr/bin/node', leadingArgs: ['/repo/entry.js'] }),
      ),
    ).toStrictEqual({ command: '/usr/bin/node', leadingArgs: ['/repo/entry.js'] });
  });

  it('INVALID: {command: ""} => throws', () => {
    expect(() => binCommandContract.parse({ command: '', leadingArgs: [] })).toThrow(
      /Too small: expected string to have >=1 characters/u,
    );
  });
});
