/**
 * PURPOSE: Orchestrates the hooks package installation by delegating to the create-settings responder
 *
 * USAGE:
 * const result = await InstallFlow({ context });
 * // Creates or merges .claude/settings.json with hooks configuration
 */

import { InstallCreateSettingsResponder } from '../../responders/install/create-settings/install-create-settings-responder';

type ResponderParams = Parameters<typeof InstallCreateSettingsResponder>[0];
type ResponderResult = Awaited<ReturnType<typeof InstallCreateSettingsResponder>>;

export const InstallFlow = async ({ context }: ResponderParams): Promise<ResponderResult> =>
  InstallCreateSettingsResponder({ context });
