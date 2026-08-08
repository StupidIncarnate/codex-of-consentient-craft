import { toolDisplayLabelContract } from './tool-display-label-contract';
import type { ToolDisplayLabel } from './tool-display-label-contract';

export const ToolDisplayLabelStub = ({ value }: { value?: string } = {}): ToolDisplayLabel =>
  toolDisplayLabelContract.parse(value ?? 'git diff');
