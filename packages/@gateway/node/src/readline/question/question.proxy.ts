import { createInterface } from 'node:readline/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';

class QuestionNotStagedError extends Error {
  public constructor({ prompt }: { prompt: string }) {
    super(`questionProxy: no answer staged for prompt "${prompt}"`);
  }
}

export const questionProxy = (): {
  answers: (params: { prompt: string; answer: string }) => void;
  getPromptsAsked: () => readonly string[];
  getCallsFor: (params?: { prompt?: string | ((prompt: string) => boolean) }) => readonly string[];
} => {
  const handle = registerMock({ fn: createInterface });
  const answersByPrompt = new Map<string, string>();
  const promptsAsked: string[] = [];

  handle
    .calledWith([
      (options: unknown): boolean =>
        typeof options === 'object' &&
        options !== null &&
        'input' in options &&
        'output' in options,
    ])
    .implement(() => ({
      question: async (prompt: string): Promise<string> => {
        promptsAsked.push(prompt);
        const answer = answersByPrompt.get(prompt);
        if (answer === undefined) {
          throw new QuestionNotStagedError({ prompt });
        }
        return Promise.resolve(answer);
      },
      close: (): void => {
        const calls = handle.callsMatching([
          (options: unknown): boolean =>
            typeof options === 'object' &&
            options !== null &&
            'input' in options &&
            'output' in options,
        ]);
        const lastCall = calls[calls.length - 1];
        const options = lastCall?.[0] as { input?: unknown } | undefined;
        const stream = options?.input;
        if (
          typeof stream === 'object' &&
          stream !== null &&
          'pause' in stream &&
          typeof (stream as { pause: unknown }).pause === 'function'
        ) {
          (stream as { pause: () => void }).pause();
        }
        if (
          typeof stream === 'object' &&
          stream !== null &&
          'unref' in stream &&
          typeof (stream as { unref: unknown }).unref === 'function'
        ) {
          (stream as { unref: () => void }).unref();
        }
      },
    }));

  return {
    answers: ({ prompt, answer }: { prompt: string; answer: string }): void => {
      answersByPrompt.set(prompt, answer);
    },

    getPromptsAsked: (): readonly string[] => [...promptsAsked],

    getCallsFor: ({
      prompt,
    }: {
      prompt?: string | ((prompt: string) => boolean);
    } = {}): readonly string[] => {
      if (prompt === undefined) {
        return [...promptsAsked];
      }
      if (typeof prompt === 'function') {
        return promptsAsked.filter(prompt);
      }
      return promptsAsked.filter((p) => p === prompt);
    },
  };
};
