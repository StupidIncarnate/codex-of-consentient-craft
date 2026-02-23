import { wardListInputContract } from './ward-list-input-contract';
import type { WardListInput } from './ward-list-input-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';

export const WardListInputStub = ({ ...props }: StubArgument<WardListInput> = {}): WardListInput =>
  wardListInputContract.parse({
    ...props,
  });
