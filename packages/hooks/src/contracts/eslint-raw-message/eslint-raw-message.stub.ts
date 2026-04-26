import type { StubArgument } from '@dungeonmaster/shared/@types';
import { eslintRawMessageContract } from './eslint-raw-message-contract';
import type { EslintRawMessage } from './eslint-raw-message-contract';

export const EslintRawMessageStub = ({
  ...props
}: StubArgument<EslintRawMessage> = {}): EslintRawMessage =>
  eslintRawMessageContract.parse({
    line: 1,
    column: 0,
    message: 'lint error',
    severity: 2,
    ...props,
  });
