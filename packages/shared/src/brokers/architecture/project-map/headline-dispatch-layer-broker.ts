/**
 * PURPOSE: Dispatches to the correct per-type headline renderer based on a package's PackageType
 *
 * USAGE:
 * const headline = headlineDispatchLayerBroker({ packageType, projectRoot, packageRoot, packageName });
 * // Returns ContentText with the type-specific headline section
 *
 * WHEN-TO-USE: Inside architecture-project-map-broker to route per-type rendering
 */

import { architectureProjectMapHeadlineHttpBackendBroker } from '../project-map-headline-http-backend/architecture-project-map-headline-http-backend-broker';
import { architectureProjectMapHeadlineMcpServerBroker } from '../project-map-headline-mcp-server/architecture-project-map-headline-mcp-server-broker';
import { architectureProjectMapHeadlineProgrammaticServiceBroker } from '../project-map-headline-programmatic-service/architecture-project-map-headline-programmatic-service-broker';
import { architectureProjectMapHeadlineCliToolBroker } from '../project-map-headline-cli-tool/architecture-project-map-headline-cli-tool-broker';
import { architectureProjectMapHeadlineHookHandlersBroker } from '../project-map-headline-hook-handlers/architecture-project-map-headline-hook-handlers-broker';
import { architectureProjectMapHeadlineEslintPluginBroker } from '../project-map-headline-eslint-plugin/architecture-project-map-headline-eslint-plugin-broker';
import { architectureProjectMapHeadlineFrontendReactBroker } from '../project-map-headline-frontend-react/architecture-project-map-headline-frontend-react-broker';
import { architectureProjectMapHeadlineLibraryBroker } from '../project-map-headline-library/architecture-project-map-headline-library-broker';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';
import type { PackageType } from '../../../contracts/package-type/package-type-contract';

export const headlineDispatchLayerBroker = ({
  packageType,
  projectRoot,
  packageRoot,
  packageName,
}: {
  packageType: PackageType;
  projectRoot: AbsoluteFilePath;
  packageRoot: AbsoluteFilePath;
  packageName: ContentText;
}): ContentText => {
  if (packageType === 'http-backend') {
    return architectureProjectMapHeadlineHttpBackendBroker({ projectRoot, packageRoot });
  }
  if (packageType === 'mcp-server') {
    return architectureProjectMapHeadlineMcpServerBroker({ projectRoot, packageRoot });
  }
  if (packageType === 'programmatic-service') {
    return architectureProjectMapHeadlineProgrammaticServiceBroker({ projectRoot, packageRoot });
  }
  if (packageType === 'cli-tool') {
    return architectureProjectMapHeadlineCliToolBroker({ projectRoot, packageRoot });
  }
  if (packageType === 'hook-handlers') {
    return architectureProjectMapHeadlineHookHandlersBroker({ packageRoot });
  }
  if (packageType === 'eslint-plugin') {
    return architectureProjectMapHeadlineEslintPluginBroker({ packageRoot });
  }
  if (packageType === 'frontend-react') {
    return architectureProjectMapHeadlineFrontendReactBroker({ projectRoot, packageRoot });
  }
  if (packageType === 'library') {
    return architectureProjectMapHeadlineLibraryBroker({ projectRoot, packageRoot, packageName });
  }
  // 'frontend-ink' — renderer not yet implemented
  throw new Error(
    `frontend-ink renderer not yet implemented (v2) — package: ${String(packageName)}`,
  );
};
