import type { StubArgument } from '@dungeonmaster/shared/@types';

import { formattedToolInputContract } from './formatted-tool-input-contract';
import type { FormattedToolInput } from './formatted-tool-input-contract';

export const FormattedToolInputStub = ({
  ...props
}: StubArgument<FormattedToolInput> = {}): FormattedToolInput =>
  formattedToolInputContract.parse({
    fields: [{ key: 'command', value: 'ls -la', isLong: false }],
    ...props,
  });
