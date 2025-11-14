import type { StubArgument } from '@questmaestro/shared/@types';
import {
  questmaestroConfigContract,
  type QuestmaestroConfig,
} from './questmaestro-config-contract';

export const QuestmaestroConfigStub = ({
  ...props
}: StubArgument<QuestmaestroConfig> = {}): QuestmaestroConfig =>
  questmaestroConfigContract.parse({
    framework: 'react',
    schema: 'zod',
    ...props,
  });
