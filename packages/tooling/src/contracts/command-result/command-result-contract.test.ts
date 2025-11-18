import { commandResultContract as _commandResultContract } from './command-result-contract';
import { CommandResultStub } from './command-result.stub';
import { ExitCodeStub } from '../exit-code/exit-code.stub';
import { ProcessOutputStub } from '../process-output/process-output.stub';

describe('commandResultContract', () => {
  it('VALID: {exitCode: 0, stdout: "", stderr: ""} => parses successfully', () => {
    const result = CommandResultStub({
      exitCode: ExitCodeStub({ value: 0 }),
      stdout: ProcessOutputStub({ value: '' }),
      stderr: ProcessOutputStub({ value: '' }),
    });

    expect(result).toStrictEqual({
      exitCode: 0,
      stdout: '',
      stderr: '',
    });
  });

  it('VALID: {exitCode: 1, stdout: "output", stderr: "error"} => parses successfully', () => {
    const result = CommandResultStub({
      exitCode: ExitCodeStub({ value: 1 }),
      stdout: ProcessOutputStub({ value: 'output' }),
      stderr: ProcessOutputStub({ value: 'error' }),
    });

    expect(result).toStrictEqual({
      exitCode: 1,
      stdout: 'output',
      stderr: 'error',
    });
  });
});
