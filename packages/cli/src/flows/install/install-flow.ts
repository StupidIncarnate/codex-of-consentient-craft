/**
 * PURPOSE: Orchestrates the CLI package installation by delegating to the add-dev-deps responder
 *
 * USAGE:
 * const result = await InstallFlow({ context });
 * // Adds devDependencies to target project's package.json
 */

import { InstallAddDevDepsResponder } from '../../responders/install/add-dev-deps/install-add-dev-deps-responder';

type ResponderParams = Parameters<typeof InstallAddDevDepsResponder>[0];
type ResponderResult = Awaited<ReturnType<typeof InstallAddDevDepsResponder>>;

export const InstallFlow = async ({ context }: ResponderParams): Promise<ResponderResult> =>
  InstallAddDevDepsResponder({ context });
