/**
 * PURPOSE: Renders the BOUNDARY box lines for the detailed exemplar section.
 * Uses the pre-built start-quest box from statics for the canonical exemplar route,
 * and a generic box for all other routes.
 *
 * USAGE:
 * const boxLines = exemplarBoundaryBoxRenderLayerBroker({
 *   method: contentTextContract.parse('POST'),
 *   urlPattern: contentTextContract.parse('/api/quests/:questId/start'),
 *   crossPackageName: contentTextContract.parse('@dungeonmaster/orchestrator'),
 * });
 * // Returns ContentText[] of box-drawing lines
 *
 * WHEN-TO-USE: exemplar-section-render-layer-broker embedding the BOUNDARY block
 */

import {
  contentTextContract,
  type ContentText,
} from '../../../contracts/content-text/content-text-contract';
import { projectMapHeadlineHttpBackendStatics } from '../../../statics/project-map-headline-http-backend/project-map-headline-http-backend-statics';

export const exemplarBoundaryBoxRenderLayerBroker = ({
  method,
  urlPattern,
  crossPackageName,
}: {
  method: ContentText;
  urlPattern: ContentText;
  crossPackageName: ContentText;
}): ContentText[] => {
  const isStartRoute =
    String(method) === projectMapHeadlineHttpBackendStatics.exemplarMethod &&
    String(urlPattern) === projectMapHeadlineHttpBackendStatics.exemplarPostUrl;

  if (isStartRoute) {
    return projectMapHeadlineHttpBackendStatics.startQuestBoundaryBox.map((line) =>
      contentTextContract.parse(line),
    );
  }

  // Generic box
  const indent = projectMapHeadlineHttpBackendStatics.genericBoundaryBoxIndent;
  const label = `${projectMapHeadlineHttpBackendStatics.genericBoundaryBoxLabel} ${String(crossPackageName)}`;
  const fill = projectMapHeadlineHttpBackendStatics.genericBoundaryBoxFill;
  const side = projectMapHeadlineHttpBackendStatics.genericBoundaryBoxSide;
  const note = projectMapHeadlineHttpBackendStatics.genericBoundaryBoxNote;
  const tl = projectMapHeadlineHttpBackendStatics.genericBoundaryBoxCornerTL;
  const tr = projectMapHeadlineHttpBackendStatics.genericBoundaryBoxCornerTR;
  const bl = projectMapHeadlineHttpBackendStatics.genericBoundaryBoxCornerBL;
  const br = projectMapHeadlineHttpBackendStatics.genericBoundaryBoxCornerBR;
  const pad = projectMapHeadlineHttpBackendStatics.boundaryBoxPad;

  const innerWidth = Math.max(
    label.length + pad,
    note.length + pad,
    projectMapHeadlineHttpBackendStatics.boundaryBoxInnerWidth,
  );

  return [
    contentTextContract.parse(`${indent}${tl}${fill.repeat(innerWidth + pad)}${tr}`),
    contentTextContract.parse(`${indent}${side} ${label.padEnd(innerWidth)} ${side}`),
    contentTextContract.parse(`${indent}${side} ${''.padEnd(innerWidth)} ${side}`),
    contentTextContract.parse(`${indent}${side} ${note.padEnd(innerWidth)} ${side}`),
    contentTextContract.parse(`${indent}${bl}${fill.repeat(innerWidth + pad)}${br}`),
  ];
};
