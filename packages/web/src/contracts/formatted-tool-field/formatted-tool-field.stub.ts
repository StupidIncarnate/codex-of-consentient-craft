import type { StubArgument } from '@dungeonmaster/shared/@types';

import { formattedToolFieldContract } from './formatted-tool-field-contract';
import type { FormattedToolField } from './formatted-tool-field-contract';

export const FormattedToolFieldStub = ({
  ...props
}: StubArgument<FormattedToolField> = {}): FormattedToolField =>
  formattedToolFieldContract.parse({
    key: 'command',
    value: 'ls -la',
    isLong: false,
    ...props,
  });
