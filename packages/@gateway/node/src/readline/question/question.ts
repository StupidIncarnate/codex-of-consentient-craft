/**
 * PURPOSE: Asks one question on the given streams and resolves the trimmed answer, or a fallback
 * when the answer is empty or stdin ends before anything is typed. Reach for this over a raw
 * `readline.createInterface(...).question(...)` so every interactive prompt in the codebase
 * closes its interface the same way, including on throw — and so an input stream that hits EOF
 * before any line is typed resolves the fallback rather than hanging forever: measured directly,
 * `readline/promises`'s own `question()` never settles on an immediate EOF (the stream emits
 * `'close'`, not a final `'line'`), so this races the real answer against the input's own close.
 *
 * USAGE:
 * const name = await question({ input: process.stdin, output: process.stdout, prompt: 'Name: ', fallback: 'my-package' });
 */

// `node:`-prefixed, not bare: a caller whose own build bundles through esbuild resolves the
// node-builtin list for `readline` but not always the `readline/promises` subpath under a bare
// specifier, while typechecking and testing resolve either form fine.
import { createInterface } from 'node:readline/promises';
import type { Readable, Writable } from 'stream';

export const question = async ({
  input,
  output,
  prompt,
  fallback,
}: {
  input: Readable;
  output: Writable;
  prompt: string;
  fallback: string;
}): Promise<string> => {
  const rl = createInterface({ input, output });

  try {
    const answer = await Promise.race([
      rl.question(prompt),
      new Promise<string>((resolve) => {
        input.once('close', () => {
          resolve('');
        });
      }),
    ]);
    const trimmed = answer.trim();
    return trimmed === '' ? fallback : trimmed;
  } finally {
    rl.close();
  }
};
