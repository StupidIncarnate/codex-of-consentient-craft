/**
 * PURPOSE: Renders the BOUNDARY box lines for the mcp-server detailed exemplar section.
 * Produces a generic box labelled with the cross-package namespace name.
 *
 * USAGE:
 * const boxLines = exemplarBoundaryBoxRenderLayerBroker({
 *   crossPackageName: contentTextContract.parse('@dungeonmaster/shared'),
 * });
 * // Returns ContentText[] of box-drawing lines
 *
 * WHEN-TO-USE: exemplar-section-render-layer-broker embedding the BOUNDARY block
 */

import {
  contentTextContract,
  type ContentText,
} from '../../../contracts/content-text/content-text-contract';
import { projectMapHeadlineMcpServerStatics } from '../../../statics/project-map-headline-mcp-server/project-map-headline-mcp-server-statics';

export const exemplarBoundaryBoxRenderLayerBroker = ({
  crossPackageName,
}: {
  crossPackageName: ContentText;
}): ContentText[] => {
  const indent = projectMapHeadlineMcpServerStatics.genericBoundaryBoxIndent;
  const label = `${projectMapHeadlineMcpServerStatics.genericBoundaryBoxLabel} ${String(crossPackageName)}`;
  const fill = projectMapHeadlineMcpServerStatics.genericBoundaryBoxFill;
  const side = projectMapHeadlineMcpServerStatics.genericBoundaryBoxSide;
  const note = projectMapHeadlineMcpServerStatics.genericBoundaryBoxNote;
  const tl = projectMapHeadlineMcpServerStatics.genericBoundaryBoxCornerTL;
  const tr = projectMapHeadlineMcpServerStatics.genericBoundaryBoxCornerTR;
  const bl = projectMapHeadlineMcpServerStatics.genericBoundaryBoxCornerBL;
  const br = projectMapHeadlineMcpServerStatics.genericBoundaryBoxCornerBR;
  const pad = projectMapHeadlineMcpServerStatics.boundaryBoxPad;

  const innerWidth = Math.max(
    label.length + pad,
    note.length + pad,
    projectMapHeadlineMcpServerStatics.boundaryBoxInnerWidth,
  );

  return [
    contentTextContract.parse(`${indent}${tl}${fill.repeat(innerWidth + pad)}${tr}`),
    contentTextContract.parse(`${indent}${side} ${label.padEnd(innerWidth)} ${side}`),
    contentTextContract.parse(`${indent}${side} ${''.padEnd(innerWidth)} ${side}`),
    contentTextContract.parse(`${indent}${side} ${note.padEnd(innerWidth)} ${side}`),
    contentTextContract.parse(`${indent}${bl}${fill.repeat(innerWidth + pad)}${br}`),
  ];
};
