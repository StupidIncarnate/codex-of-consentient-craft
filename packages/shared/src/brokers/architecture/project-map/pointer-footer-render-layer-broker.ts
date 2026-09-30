/**
 * PURPOSE: Renders the pointer footer that directs callers to the per-package detail tool
 *
 * USAGE:
 * const footer = pointerFooterRenderLayerBroker();
 * // Returns ContentText one-line reminder pointing to get-project-inventory
 *
 * WHEN-TO-USE: Inside architecture-project-map-broker as the last section of the map output
 */

import { projectMapStatics } from '../../../statics/project-map/project-map-statics';

export const pointerFooterRenderLayerBroker = (): string =>
  projectMapStatics.pointerFooter;
