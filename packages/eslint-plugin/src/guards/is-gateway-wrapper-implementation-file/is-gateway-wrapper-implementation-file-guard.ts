/**
 * PURPOSE: Tells whether a file directly inside a gateway wrapper folder is an IMPLEMENTATION file
 * barrel-completeness-layer-broker should read for exported names — a single-dot `.ts`/`.tsx`, or an
 * `.error.ts` companion (which carries two dots but is still real, exported code, the same exemption
 * rule-gateway-colocation-broker's own `isErrorFile` check already makes). Everything else with more
 * than one dot — `.test.ts`, `.integration.test.ts`, `.proxy.ts`, `.stub.ts` — is a companion, never
 * the implementation a completeness check counts exports from.
 *
 * USAGE:
 * isGatewayWrapperImplementationFileGuard({ fileName: 'read-file-sync.ts' });
 * // Returns true
 * isGatewayWrapperImplementationFileGuard({ fileName: 'git-not-installed.error.ts' });
 * // Returns true
 * isGatewayWrapperImplementationFileGuard({ fileName: 'read-file-sync.proxy.ts' });
 * // Returns false
 */
import { dotCountTransformer } from '../../transformers/dot-count/dot-count-transformer';

export const isGatewayWrapperImplementationFileGuard = ({
  fileName,
}: {
  fileName?: string;
}): boolean => {
  if (!fileName) {
    return false;
  }

  if (fileName.endsWith('.error.ts')) {
    return true;
  }

  return dotCountTransformer({ str: fileName }) === 1;
};
