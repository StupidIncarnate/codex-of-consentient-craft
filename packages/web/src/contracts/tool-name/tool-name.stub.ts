import { toolNameContract } from './tool-name-contract';
import type { ToolName } from './tool-name-contract';

export const ToolNameStub = ({ value }: { value: string } = { value: 'read_file' }): ToolName =>
  toolNameContract.parse(value);
