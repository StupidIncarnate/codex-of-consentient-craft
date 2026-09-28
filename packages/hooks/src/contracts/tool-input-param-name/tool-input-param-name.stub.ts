import { toolInputParamNameContract } from './tool-input-param-name-contract';
import type { ToolInputParamName } from './tool-input-param-name-contract';

export const ToolInputParamNameStub = (
  { value }: { value: string } = { value: 'folderType' },
): ToolInputParamName => toolInputParamNameContract.parse(value);
