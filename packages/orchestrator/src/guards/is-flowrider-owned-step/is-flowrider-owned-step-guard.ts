/**
 * PURPOSE: Single predicate deciding whether a DependencyStep is owned by the Flowrider role
 * (which writes flow-perspective integration + e2e test suites) rather than Codeweaver. True when
 * the step's focusFile path ends with a flow-test-owned suffix (`.integration.test.ts` / `.e2e.ts`)
 * OR resolves to a flow-test-owned folder type (`flows` / `startup`). Shared by both the
 * steps-to-work-items and steps-to-package-chunks transformers so the routing decision can't drift.
 *
 * USAGE:
 * isFlowriderOwnedStepGuard({ step });
 * // Returns true for a `.e2e.ts` / `.integration.test.ts` focusFile, or a flows/ or startup/ step
 */

import type { DependencyStep, FolderType } from '@dungeonmaster/shared/contracts';
import { folderTypeContract } from '@dungeonmaster/shared/contracts';
import { folderConfigStatics } from '@dungeonmaster/shared/statics';

import { flowTestOwnedFolderTypesStatics } from '../../statics/flow-test-owned-folder-types/flow-test-owned-folder-types-statics';
import { flowTestOwnedSuffixesStatics } from '../../statics/flow-test-owned-suffixes/flow-test-owned-suffixes-statics';
import { pathToFolderTypeTransformer } from '../../transformers/path-to-folder-type/path-to-folder-type-transformer';

export const isFlowriderOwnedStepGuard = ({ step }: { step?: DependencyStep }): boolean => {
  const filePath = step?.focusFile?.path;
  if (filePath === undefined) {
    return false;
  }

  const path = String(filePath);
  const hasOwnedSuffix = flowTestOwnedSuffixesStatics.value.some((suffix) => path.endsWith(suffix));
  if (hasOwnedSuffix) {
    return true;
  }

  const ownedFolderTypes = new Set<FolderType>(
    flowTestOwnedFolderTypesStatics.value.map((ft) => folderTypeContract.parse(ft)),
  );
  const folderType = pathToFolderTypeTransformer({ filePath, folderConfigs: folderConfigStatics });

  return folderType !== undefined && ownedFolderTypes.has(folderType);
};
