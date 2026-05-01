/**
 * PURPOSE: Configuration constants for the widget composition tree broker
 *
 * USAGE:
 * import { widgetTreeStatics } from '../../statics/widget-tree/widget-tree-statics';
 * widgetTreeStatics.hubInDegreeThreshold; // 5
 *
 * WHEN-TO-USE: When building or testing the architectureWidgetTreeBroker to parameterize
 * hub detection and max child depth without magic numbers
 */

export const widgetTreeStatics = {
  hubInDegreeThreshold: 5,
  maxChildDepth: 2,
  rootSourceFolders: ['responders', 'flows'] as const,
  widgetsFolderName: 'widgets',
  bindingsFolderName: 'bindings',
  tsSuffix: '.ts',
  tsxSuffix: '.tsx',
} as const;
