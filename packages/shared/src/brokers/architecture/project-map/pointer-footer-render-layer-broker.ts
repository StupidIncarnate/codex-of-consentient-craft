/**
 * PURPOSE: Renders the pointer footer that directs callers to the per-package detail tool
 *
 * USAGE:
 * const footer = pointerFooterRenderLayerBroker();
 * // Returns ContentText one-line reminder pointing to get-project-inventory
 *
 * WHEN-TO-USE: Inside architecture-project-map-broker as the last section of the map output
 */

import type { ContentText } from '../../../contracts/content-text/content-text-contract';
import { contentTextContract } from '../../../contracts/content-text/content-text-contract';
import { projectMapStatics } from '../../../statics/project-map/project-map-statics';

export const pointerFooterRenderLayerBroker = (): ContentText =>
  contentTextContract.parse(projectMapStatics.pointerFooter);
