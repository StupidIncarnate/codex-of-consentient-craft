/**
 * PURPOSE: Resolves the responder label for a hook-handlers bin entry table row by
 * extracting the flow import name from the startup source text. Returns a fallback
 * label when no flow import is found or the startup source is absent.
 *
 * USAGE:
 * const label = hookResponderLabelResolveLayerBroker({
 *   startupSource: contentTextContract.parse(`import { HookPreEditFlow } from '../flows/hook-pre-edit/hook-pre-edit-flow';`),
 * });
 * // Returns ContentText of 'hook-pre-edit-flow'
 *
 * WHEN-TO-USE: hooks-section-render-layer-broker building per-row labels
 */

import {
  contentTextContract,
  type ContentText,
} from '../../../contracts/content-text/content-text-contract';
import { hookFlowImportExtractTransformer } from '../../../transformers/hook-flow-import-extract/hook-flow-import-extract-transformer';

export const hookResponderLabelResolveLayerBroker = ({
  startupSource,
}: {
  startupSource: ContentText | undefined;
}): ContentText => {
  if (startupSource === undefined) {
    return contentTextContract.parse('(responder)');
  }

  const flowImport = hookFlowImportExtractTransformer({ source: startupSource });
  if (flowImport === undefined) {
    return contentTextContract.parse('(responder)');
  }

  const segments = String(flowImport).split('/');
  const last = segments.at(-1) ?? String(flowImport);
  return contentTextContract.parse(last);
};
