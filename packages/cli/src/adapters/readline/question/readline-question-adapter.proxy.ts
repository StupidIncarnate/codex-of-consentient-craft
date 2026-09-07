import { createInterface } from 'node:readline/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';
import { contentTextContract, type ContentText } from '@dungeonmaster/shared/contracts';

export const readlineQuestionAdapterProxy = (): {
  setupAnswer: (params: { prompt: string; answer: string }) => void;
} => {
  const mock: MockHandle = registerMock({ fn: createInterface });
  const answersByPrompt = new Map<ContentText, ContentText>();

  // readline/promises' createInterface has no other caller in this repo, so a bare calledWith([])
  // would be an honest catch-all — but the options bag carries process.stdin/process.stdout,
  // whose own object graphs are circular, so a discriminating PREDICATE (reference equality) is
  // used instead of an object address (deep structural match) to avoid recursing into them.
  const isStdioInterfaceOptions = (arg: unknown): boolean => {
    const options = arg as { input?: unknown; output?: unknown } | undefined;
    return options?.input === process.stdin && options.output === process.stdout;
  };

  mock.calledWith([isStdioInterfaceOptions]).implement(
    () =>
      ({
        question: async (promptText: string) => {
          const answer = answersByPrompt.get(contentTextContract.parse(promptText));

          if (answer === undefined) {
            throw new Error(
              `readlineQuestionAdapterProxy: no answer staged for prompt ${promptText}`,
            );
          }

          return Promise.resolve(answer);
        },
        close: (): void => undefined,
      }) as never,
  );

  return {
    setupAnswer: ({ prompt, answer }: { prompt: string; answer: string }): void => {
      answersByPrompt.set(contentTextContract.parse(prompt), contentTextContract.parse(answer));
    },
  };
};
