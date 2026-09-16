import type { StubArgument } from '@dungeonmaster/shared/@types';
import { SpecNameStub } from '@dungeonmaster/siegelense/contracts';

import { siegelenseStartInputContract } from './siegelense-start-input-contract';
import type { SiegelenseStartInput } from './siegelense-start-input-contract';

export const SiegelenseStartInputStub = ({
  ...props
}: StubArgument<SiegelenseStartInput> = {}): SiegelenseStartInput =>
  siegelenseStartInputContract.parse({
    specName: SpecNameStub(),
    ...props,
  });
