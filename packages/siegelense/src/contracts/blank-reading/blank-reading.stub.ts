import type { StubArgument } from '@dungeonmaster/shared/@types';

import { HexColourStub } from '../hex-colour/hex-colour.stub';
import { blankReadingContract } from './blank-reading-contract';
import type { BlankReading } from './blank-reading-contract';

export const BlankReadingStub = ({ ...props }: StubArgument<BlankReading> = {}): BlankReading =>
  blankReadingContract.parse({
    blank: true,
    colour: HexColourStub(),
    ...props,
  });
