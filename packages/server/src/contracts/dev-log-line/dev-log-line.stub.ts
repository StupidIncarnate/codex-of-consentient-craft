import { devLogLineContract, type DevLogLine } from './dev-log-line-contract';

export const DevLogLineStub = ({
  value = '◂  chat-output  proc:abc12345  assistant/tool_use  Read',
}: {
  value?: string;
} = {}): DevLogLine => devLogLineContract.parse(value);
