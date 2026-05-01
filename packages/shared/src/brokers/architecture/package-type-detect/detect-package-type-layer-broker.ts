/**
 * PURPOSE: Applies the priority-order detection table to classify a package's architecture type
 *
 * USAGE:
 * const type = detectPackageTypeLayerBroker({ adapterDirNames, srcDirNames, packageJson, ... });
 * // Returns: 'http-backend' as PackageType
 *
 * WHEN-TO-USE: After collecting all filesystem signals, to run the detection priority chain
 */

import type { packageJsonContract } from '../../../contracts/package-json/package-json-contract';
import { packageTypeContract } from '../../../contracts/package-type/package-type-contract';
import type { PackageType } from '../../../contracts/package-type/package-type-contract';
import { hasHonoOrExpressAdapterGuard } from '../../../guards/has-hono-or-express-adapter/has-hono-or-express-adapter-guard';
import { hasModelcontextprotocolAdapterGuard } from '../../../guards/has-modelcontextprotocol-adapter/has-modelcontextprotocol-adapter-guard';
import { hasInkAdapterGuard } from '../../../guards/has-ink-adapter/has-ink-adapter-guard';
import { hasWidgetsFolderGuard } from '../../../guards/has-widgets-folder/has-widgets-folder-guard';
import { reactInDepsGuard } from '../../../guards/react-in-deps/react-in-deps-guard';
import { startupReferencesArgvGuard } from '../../../guards/startup-references-argv/startup-references-argv-guard';
import { flowReturnsToolRegistrationGuard } from '../../../guards/flow-returns-tool-registration/flow-returns-tool-registration-guard';
import { startupExportsAsyncNamespaceGuard } from '../../../guards/startup-exports-async-namespace/startup-exports-async-namespace-guard';
import { projectMapStatics } from '../../../statics/project-map/project-map-statics';
import type { FileCount } from '../../../contracts/file-count/file-count-contract';

export const detectPackageTypeLayerBroker = ({
  adapterDirNames,
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
  adapterDirNames: string[];
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
  binEntryCount: FileCount;
}): PackageType => {
  if (hasHonoOrExpressAdapterGuard({ adapterDirNames })) {
    return packageTypeContract.parse('http-backend');
  }

  if (
    hasModelcontextprotocolAdapterGuard({ adapterDirNames }) ||
    flowReturnsToolRegistrationGuard(flowFileContent === undefined ? {} : { flowFileContent })
  ) {
    return packageTypeContract.parse('mcp-server');
  }

  if (hasWidgetsFolderGuard({ srcDirNames }) && hasInkAdapterGuard({ adapterDirNames })) {
    return packageTypeContract.parse('frontend-ink');
  }

  if (hasWidgetsFolderGuard({ srcDirNames }) && reactInDepsGuard({ packageJson })) {
    return packageTypeContract.parse('frontend-react');
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
