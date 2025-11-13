import {
  questmaestroConfigContract,
  type QuestmaestroConfig,
} from './questmaestro-config-contract';

type StubArgument<T> =
  T extends Record<string, unknown> ? { [K in keyof T]?: StubArgument<T[K]> } : T;

export const QuestmaestroConfigStub = ({
  ...props
}: StubArgument<QuestmaestroConfig> = {}): QuestmaestroConfig =>
  questmaestroConfigContract.parse({
    framework: 'react',
    schema: 'zod',
    ...props,
  });
