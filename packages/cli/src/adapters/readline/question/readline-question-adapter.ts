/**
 * PURPOSE: The sole place `dungeonmaster create-package`'s interactive mode touches stdin — an
 * I/O boundary a proxy can replace so the rest of that command stays pure and provable without a
 * terminal attached.
 *
 * USAGE:
 * const name = await readlineQuestionAdapter({
 *   prompt: 'Package name: ',
 *   fallback: ContentTextStub({ value: 'my-package' }),
 * });
 */

// `node:`-prefixed, not bare: this package's build bundles through esbuild, whose node-builtin list
// covers `readline` but not the `readline/promises` subpath, so a bare specifier fails the bundle
// with "Could not resolve" while typechecking and testing perfectly happily.
import { createInterface } from 'node:readline/promises';
import { contentTextContract, type ContentText } from '@dungeonmaster/shared/contracts';

export const readlineQuestionAdapter = async ({
  prompt,
  fallback,
}: {
  prompt: string;
  fallback: ContentText;
}): Promise<ContentText> => {
  const rl = createInterface({ input: process.stdin, output: process.stdout });

  try {
    const answer = (await rl.question(prompt)).trim();
    return contentTextContract.parse(answer === '' ? String(fallback) : answer);
  } finally {
    rl.close();
  }
};
