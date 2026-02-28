/**
 * PURPOSE: Orchestrates the orchestrator package installation by delegating to the write-files responder
 *
 * USAGE:
 * const result = await InstallFlow({ context });
 * // Installs .claude/commands/ and .claude/agents/ files for the orchestrator package
 */

import { InstallWriteFilesResponder } from '../../responders/install/write-files/install-write-files-responder';

type ResponderParams = Parameters<typeof InstallWriteFilesResponder>[0];
type ResponderResult = Awaited<ReturnType<typeof InstallWriteFilesResponder>>;

export const InstallFlow = async ({ context }: ResponderParams): Promise<ResponderResult> =>
  InstallWriteFilesResponder({ context });
