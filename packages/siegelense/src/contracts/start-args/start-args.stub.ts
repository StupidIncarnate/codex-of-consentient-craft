import type { StubArgument } from '@dungeonmaster/shared/@types';

import { startArgsContract } from './start-args-contract';
import type { StartArgs } from './start-args-contract';

export const StartArgsStub = ({ ...props }: StubArgument<StartArgs> = {}): StartArgs =>
  startArgsContract.parse({
    specName: 'dungeonmaster-stack',
    questId: null,
    guildId: null,
    seed: null,
    isJson: false,
    ...props,
  });
