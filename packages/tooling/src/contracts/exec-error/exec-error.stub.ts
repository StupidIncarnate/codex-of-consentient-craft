import { execErrorContract } from './exec-error-contract';
import type { ExecError } from './exec-error-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';
import { ExitCodeStub } from '../exit-code/exit-code.stub';

const errorMessageContract = execErrorContract.shape.message;
const errorNameContract = execErrorContract.shape.name;

export const ExecErrorStub = ({ ...props }: StubArgument<ExecError> = {}): ExecError => {
  const { stack, ...dataProps } = props;

  const validated = execErrorContract.parse({
    status: ExitCodeStub({ value: 1 }),
    stdout: Buffer.from(''),
    stderr: Buffer.from(''),
    message: errorMessageContract.parse('Command failed'),
    name: errorNameContract.parse('Error'),
    ...dataProps,
  });

  const error = new Error(validated.message);
  Object.assign(error, validated);

  if (stack) {
    error.stack = stack;
  }

  return error as ExecError;
};
