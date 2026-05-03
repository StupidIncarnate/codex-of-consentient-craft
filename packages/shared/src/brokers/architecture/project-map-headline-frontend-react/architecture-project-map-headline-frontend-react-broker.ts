/**
 * PURPOSE: Headline renderer for frontend-react packages — currently emits no content because
 * the boot-tree owns the full integrated flow (with widgets and bindings) for web
 *
 * USAGE:
 * const markdown = architectureProjectMapHeadlineFrontendReactBroker({
 *   projectRoot: absoluteFilePathContract.parse('/repo'),
 *   packageRoot: absoluteFilePathContract.parse('/repo/packages/web'),
 * });
 * // Returns empty ContentText — boot-tree integrates widget composition into the flow
 *
 * WHEN-TO-USE: Headline dispatch routes here for frontend-react packages — the integrated flow
 * tree (including widget subtrees, bindings, HTTP/WS edges) is rendered by the boot-tree
 */

import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import {
  contentTextContract,
  type ContentText,
} from '../../../contracts/content-text/content-text-contract';

export const architectureProjectMapHeadlineFrontendReactBroker = ({
  projectRoot: _projectRoot,
  packageRoot: _packageRoot,
}: {
  projectRoot: AbsoluteFilePath;
  packageRoot: AbsoluteFilePath;
}): ContentText => contentTextContract.parse('');
