/**
 * PURPOSE: Orchestrates MCP package installation by delegating to the config-create responder
 *
 * USAGE:
 * const result = await InstallFlow({ context });
 * // Creates/updates .mcp.json and adds MCP permissions to .claude/settings.json
 */

import { InstallConfigCreateResponder } from '../../responders/install/config-create/install-config-create-responder';

type ResponderParams = Parameters<typeof InstallConfigCreateResponder>[0];
type ResponderResult = Awaited<ReturnType<typeof InstallConfigCreateResponder>>;

export const InstallFlow = async ({ context }: ResponderParams): Promise<ResponderResult> =>
  InstallConfigCreateResponder({ context });
