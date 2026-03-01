import type { StubArgument } from '@dungeonmaster/shared/@types';

import type { ToolResponse } from '../tool-response/tool-response-contract';
import { ToolResponseStub } from '../tool-response/tool-response.stub';

import { toolRegistrationContract } from './tool-registration-contract';
import type { ToolRegistration } from './tool-registration-contract';

export const ToolRegistrationStub = ({
  ...props
}: StubArgument<ToolRegistration> = {}): ToolRegistration => {
  const { handler, ...dataProps } = props;
  const validatedResponse = ToolResponseStub();

  return {
    ...toolRegistrationContract.parse({
      name: 'stub-tool',
      description: 'A stub tool for testing',
      inputSchema: { type: 'object', properties: {} },
      ...dataProps,
    }),
    handler: handler ?? (async (): Promise<ToolResponse> => Promise.resolve(validatedResponse)),
  };
};
