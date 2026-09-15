/**
 * PURPOSE: Starting point test proxy for SiegelenseRunResponder — replace with real mocks as the
 * package grows. Captures stdout writes directly, with no workspace testing import, so the
 * colocated test can assert the exact line.
 *
 * USAGE:
 * const proxy = SiegelenseRunResponderProxy();
 * await proxy.callResponder({ input: 'example' });
 * proxy.capturedOutput();
 */

import { contentTextContract, type ContentText } from '@dungeonmaster/shared/contracts';
import { SiegelenseRunResponder } from './siegelense-run-responder';

export const SiegelenseRunResponderProxy = (): {
  callResponder: (params: { input: string }) => Promise<void>;
  capturedOutput: () => readonly ContentText[];
} => {
  const output: ContentText[] = [];
  const originalWrite = process.stdout.write.bind(process.stdout);

  return {
    callResponder: async (params: { input: string }): Promise<void> => {
      process.stdout.write = ((chunk: string): boolean => {
        output.push(contentTextContract.parse(chunk));
        return true;
      }) as unknown as typeof process.stdout.write;

      await SiegelenseRunResponder(params);

      process.stdout.write = originalWrite;
    },
    capturedOutput: (): readonly ContentText[] => output,
  };
};
