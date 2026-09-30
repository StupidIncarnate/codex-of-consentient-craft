/**
 * PURPOSE: Applies the priority-order detection table to classify a package's architecture type
 *
 * USAGE:
 * const type = detectPackageTypeLayerBroker({ srcDirNames, packageJson, ... });
 * // Returns: 'http-backend' as PackageType
 *
 * WHEN-TO-USE: After collecting all filesystem signals, to run the detection priority chain
 */

import type { packageJsonContract } from '../../../contracts/package-json/package-json-contract';
import { packageTypeContract } from '../../../contracts/package-type/package-type-contract';
import type { PackageType } from '../../../contracts/package-type/package-type-contract';
import { flowCreatesHonoOrExpressAppGuard } from '../../../guards/flow-creates-hono-or-express-app/flow-creates-hono-or-express-app-guard';
import { hasHonoOrExpressDependencyGuard } from '../../../guards/has-hono-or-express-dependency/has-hono-or-express-dependency-guard';
import { hasModelcontextprotocolDependencyGuard } from '../../../guards/has-modelcontextprotocol-dependency/has-modelcontextprotocol-dependency-guard';
import { packageBrowserTypeTransformer } from '../../../transformers/package-browser-type/package-browser-type-transformer';
import { startupReferencesArgvGuard } from '../../../guards/startup-references-argv/startup-references-argv-guard';
import { flowReturnsToolRegistrationGuard } from '../../../guards/flow-returns-tool-registration/flow-returns-tool-registration-guard';
import { startupExportsAsyncNamespaceGuard } from '../../../guards/startup-exports-async-namespace/startup-exports-async-namespace-guard';
import { projectMapStatics } from '../../../statics/project-map/project-map-statics';

export const detectPackageTypeLayerBroker = ({
  srcDirNames,
  packageJson,
  startupFileContent,
  flowFileContent,
  hasResponderHook,
  hasBrokersRule,
  hasFlowsDir,
  hasRespondersDir,
  hasStateDir,
  hasResponderCreate,
  exportsHasDot,
  binEntryCount,
}: {
  srcDirNames: string[];
  packageJson: ReturnType<typeof packageJsonContract.parse>;
  startupFileContent: string | undefined;
  flowFileContent: string | undefined;
  hasResponderHook: boolean;
  hasBrokersRule: boolean;
  hasFlowsDir: boolean;
  hasRespondersDir: boolean;
  hasStateDir: boolean;
  hasResponderCreate: boolean;
  exportsHasDot: boolean;
  binEntryCount: number;
}): PackageType => {
  if (
    flowCreatesHonoOrExpressAppGuard(flowFileContent === undefined ? {} : { flowFileContent }) ||
    (hasFlowsDir && hasHonoOrExpressDependencyGuard({ packageJson }))
  ) {
    return packageTypeContract.parse('http-backend');
  }

  if (
    (hasFlowsDir && hasModelcontextprotocolDependencyGuard({ packageJson })) ||
    flowReturnsToolRegistrationGuard(flowFileContent === undefined ? {} : { flowFileContent })
  ) {
    return packageTypeContract.parse('mcp-server');
  }

  // Third and fourth in the priority order, but the rules themselves live in
  // `packageBrowserTypeTransformer` — the caller that stamps a package's FULL kind set has to ask
  // the same question after this table has already returned something else, and two copies of
  // "widgets plus ink, else widgets plus react" would be free to drift apart.
  const browserPackageType = packageBrowserTypeTransformer({
    srcDirNames,
    packageJson,
  });
  if (browserPackageType !== undefined) {
    return browserPackageType;
  }

  if (hasResponderHook && binEntryCount >= projectMapStatics.hookHandlersMinBinCount) {
    return packageTypeContract.parse('hook-handlers');
  }

  if (hasBrokersRule && hasResponderCreate && exportsHasDot && binEntryCount === 0) {
    return packageTypeContract.parse('eslint-plugin');
  }

  if (
    binEntryCount >= 1 &&
    startupReferencesArgvGuard(startupFileContent === undefined ? {} : { startupFileContent })
  ) {
    return packageTypeContract.parse('cli-tool');
  }

  if (
    hasFlowsDir &&
    hasRespondersDir &&
    hasStateDir &&
    startupExportsAsyncNamespaceGuard(
      startupFileContent === undefined ? {} : { startupFileContent },
    )
  ) {
    return packageTypeContract.parse('programmatic-service');
  }

  return packageTypeContract.parse('library');
};
