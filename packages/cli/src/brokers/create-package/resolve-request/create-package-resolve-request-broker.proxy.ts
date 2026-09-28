import { question } from '#gateway/node/readline';
import { questionProxy } from '#gateway/node/readline/question/question.proxy';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { contentTextContract, type ContentText } from '@dungeonmaster/shared/contracts';

export const createPackageResolveRequestBrokerProxy = (): {
  setupAnswers: (params: { name?: string; packageType?: string; description?: string }) => void;
} => {
  // questionProxy() offers no staging of its own (a real readline handshake, meant to be driven
  // for real) — the phantom call satisfies enforce-proxy-child-creation, and the real staging
  // below addresses question itself directly, keyed on the prompt text.
  questionProxy();
  const handle = registerMock({ fn: question });
  const answersByPrompt = new Map<ContentText, ContentText>();

  // question's real other callers (if any) would pass a different input/output pair, so this is
  // the honest address for "every prompt this broker asks" — the per-prompt answer lookup happens
  // inside implement(), a second, finer-grained address layered on top of the outer stdio match.
  const isStdioQuestionCall = (call: { input: unknown; output: unknown }): boolean =>
    call.input === process.stdin && call.output === process.stdout;

  handle
    .calledWith([isStdioQuestionCall])
    .implement(({ prompt, fallback }: { prompt: ContentText; fallback: string }) => {
      const answer = answersByPrompt.get(prompt);

      if (answer === undefined) {
        throw new Error(
          `createPackageResolveRequestBrokerProxy: no answer staged for prompt ${prompt}`,
        );
      }

      // Mirrors question()'s own trim/fallback substitution — this mock replaces question()
      // itself, so nothing else runs that logic for real.
      return answer === '' ? fallback : answer;
    });

  return {
    setupAnswers: ({ name, packageType, description }): void => {
      if (name !== undefined) {
        answersByPrompt.set(
          contentTextContract.parse('Package name: '),
          contentTextContract.parse(name),
        );
      }

      if (packageType !== undefined) {
        answersByPrompt.set(
          contentTextContract.parse('Package type: '),
          contentTextContract.parse(packageType),
        );
      }

      if (description !== undefined) {
        answersByPrompt.set(
          contentTextContract.parse('Description: '),
          contentTextContract.parse(description),
        );
      }
    },
  };
};
