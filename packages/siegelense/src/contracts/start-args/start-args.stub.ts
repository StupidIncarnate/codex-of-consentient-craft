import type { StubArgument } from '@dungeonmaster/shared/@types';

import { SpecNameStub } from '../spec-name/spec-name.stub';
import { startArgsContract } from './start-args-contract';
import type { StartArgs } from './start-args-contract';

export const StartArgsStub = ({ ...props }: StubArgument<StartArgs> = {}): StartArgs =>
  startArgsContract.parse({
    specName: SpecNameStub(),
    questId: null,
    guildId: null,
    ...props,
  });
