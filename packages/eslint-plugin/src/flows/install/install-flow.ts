/**
 * PURPOSE: Orchestrates the eslint-plugin installation by delegating to the detect-config responder
 *
 * USAGE:
 * const result = InstallFlow({ context });
 * // Creates eslint.config.js or skips if already configured
 */

import { InstallDetectConfigResponder } from '../../responders/install/detect-config/install-detect-config-responder';

type ResponderParams = Parameters<typeof InstallDetectConfigResponder>[0];
type ResponderResult = ReturnType<typeof InstallDetectConfigResponder>;

export const InstallFlow = ({ context }: ResponderParams): ResponderResult =>
  InstallDetectConfigResponder({ context });
