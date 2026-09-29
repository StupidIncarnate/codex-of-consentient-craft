import type { StubArgument } from '@dungeonmaster/shared/@types';

import type { CallToolResult } from '#gateway/npm/modelcontextprotocol__sdk__types';
import { CallToolResultStub } from '#gateway/npm/modelcontextprotocol__sdk__types/call-tool-result/call-tool-result.stub';

import { toolRegistrationContract } from './tool-registration-contract';
import type { ToolRegistration } from './tool-registration-contract';

export const ToolRegistrationStub = ({
  ...props
}: StubArgument<ToolRegistration> = {}): ToolRegistration => {
  const { handler, ...dataProps } = props;
  const validatedResponse = CallToolResultStub({ text: 'Stub response' });

  return {
    ...toolRegistrationContract.parse({
      name: 'stub-tool',
      description: 'A stub tool for testing',
      inputSchema: { type: 'object', properties: {} },
      ...dataProps,
    }),
    handler: handler ?? (async (): Promise<CallToolResult> => Promise.resolve(validatedResponse)),
  };
};
