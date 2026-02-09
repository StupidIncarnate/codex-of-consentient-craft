import { toolInputDisplayContract } from './tool-input-display-contract';
import type { ToolInputDisplay } from './tool-input-display-contract';

export const ToolInputDisplayStub = (
  { value }: { value: string } = { value: 'pattern="*.ts"' },
): ToolInputDisplay => toolInputDisplayContract.parse(value);
