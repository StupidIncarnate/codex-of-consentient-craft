/**
 * PURPOSE: Orchestrates the config package installation by delegating to the create-config responder
 *
 * USAGE:
 * const result = await InstallFlow({ context });
 * // Creates .dungeonmaster config file or skips if already exists
 */

import { InstallCreateConfigResponder } from '../../responders/install/create-config/install-create-config-responder';

type ResponderParams = Parameters<typeof InstallCreateConfigResponder>[0];
type ResponderResult = Awaited<ReturnType<typeof InstallCreateConfigResponder>>;

export const InstallFlow = async ({ context }: ResponderParams): Promise<ResponderResult> =>
  InstallCreateConfigResponder({ context });
