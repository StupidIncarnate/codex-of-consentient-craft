/**
 * PURPOSE: Renders the BOUNDARY box lines for the cli-tool detailed exemplar section.
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
import { projectMapHeadlineCliToolStatics } from '../../../statics/project-map-headline-cli-tool/project-map-headline-cli-tool-statics';

export const exemplarBoundaryBoxRenderLayerBroker = ({
  crossPackageName,
}: {
  crossPackageName: ContentText;
}): ContentText[] => {
  const indent = projectMapHeadlineCliToolStatics.genericBoundaryBoxIndent;
  const label = `${projectMapHeadlineCliToolStatics.genericBoundaryBoxLabel} ${String(crossPackageName)}`;
  const fill = projectMapHeadlineCliToolStatics.genericBoundaryBoxFill;
  const side = projectMapHeadlineCliToolStatics.genericBoundaryBoxSide;
  const note = projectMapHeadlineCliToolStatics.genericBoundaryBoxNote;
  const tl = projectMapHeadlineCliToolStatics.genericBoundaryBoxCornerTL;
  const tr = projectMapHeadlineCliToolStatics.genericBoundaryBoxCornerTR;
  const bl = projectMapHeadlineCliToolStatics.genericBoundaryBoxCornerBL;
  const br = projectMapHeadlineCliToolStatics.genericBoundaryBoxCornerBR;
  const pad = projectMapHeadlineCliToolStatics.boundaryBoxPad;

  const innerWidth = Math.max(
    label.length + pad,
    note.length + pad,
    projectMapHeadlineCliToolStatics.boundaryBoxInnerWidth,
  );

  return [
    contentTextContract.parse(`${indent}${tl}${fill.repeat(innerWidth + pad)}${tr}`),
    contentTextContract.parse(`${indent}${side} ${label.padEnd(innerWidth)} ${side}`),
    contentTextContract.parse(`${indent}${side} ${''.padEnd(innerWidth)} ${side}`),
    contentTextContract.parse(`${indent}${side} ${note.padEnd(innerWidth)} ${side}`),
    contentTextContract.parse(`${indent}${bl}${fill.repeat(innerWidth + pad)}${br}`),
  ];
};
