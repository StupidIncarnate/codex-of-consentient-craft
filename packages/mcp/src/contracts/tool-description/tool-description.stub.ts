import { toolDescriptionContract } from './tool-description-contract';
import type { ToolDescription } from './tool-description-contract';

export const ToolDescriptionStub = (
  {
    value,
  }: {
    value: string;
  } = {
    value: 'Discover utilities, brokers, standards across the codebase',
  },
): ToolDescription => toolDescriptionContract.parse(value);
