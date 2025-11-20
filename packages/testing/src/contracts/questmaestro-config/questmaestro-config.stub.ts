import type { StubArgument } from '@questmaestro/shared/@types';
import { questmaestroConfigContract } from './questmaestro-config-contract';
import type { QuestmaestroConfig } from './questmaestro-config-contract';

export const QuestmaestroConfigStub = ({
  ...props
}: StubArgument<QuestmaestroConfig> = {}): QuestmaestroConfig =>
  questmaestroConfigContract.parse({
    questFolder: 'questmaestro',
    wardCommands: {},
    ...props,
  });
