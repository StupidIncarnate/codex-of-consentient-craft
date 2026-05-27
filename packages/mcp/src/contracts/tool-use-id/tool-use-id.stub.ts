import { toolUseIdContract, type ToolUseId } from './tool-use-id-contract';

export const ToolUseIdStub = ({ value }: { value?: string } = {}): ToolUseId =>
  toolUseIdContract.parse(value ?? 'toolu_01B3VQHjYXB5Wap7jrw1T3uS');
