/**
 * PURPOSE: Orchestrates the ward package installation by delegating to the write-gitignore responder
 *
 * USAGE:
 * const result = await InstallFlow({ context });
 * // Adds .ward/ to target project's .gitignore
 */

import { InstallWriteGitignoreResponder } from '../../responders/install/write-gitignore/install-write-gitignore-responder';

type ResponderParams = Parameters<typeof InstallWriteGitignoreResponder>[0];
type ResponderResult = Awaited<ReturnType<typeof InstallWriteGitignoreResponder>>;

export const InstallFlow = async ({ context }: ResponderParams): Promise<ResponderResult> =>
  InstallWriteGitignoreResponder({ context });
