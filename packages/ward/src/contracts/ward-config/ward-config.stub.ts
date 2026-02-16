import type { StubArgument } from '@dungeonmaster/shared/@types';
import { wardConfigContract, type WardConfig } from './ward-config-contract';

export const WardConfigStub = ({ ...props }: StubArgument<WardConfig> = {}): WardConfig =>
  wardConfigContract.parse({
    ...props,
  });
