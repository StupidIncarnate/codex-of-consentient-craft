/**
 * PURPOSE: In-memory storage for layer constraint content loaded at startup
 *
 * USAGE:
 * import { layerConstraintsState } from './state/layer-constraints/layer-constraints-state';
 * const content = layerConstraintsState.get();
 * // Returns ContentText or undefined
 */
import type { ContentText } from '../../contracts/content-text/content-text-contract';

let layerConstraintsContent: ContentText | undefined;

export const layerConstraintsState = {
  set: ({ content }: { content: ContentText }): void => {
    layerConstraintsContent = content;
  },

  get: (): ContentText | undefined => layerConstraintsContent,

  clear: (): void => {
    layerConstraintsContent = undefined;
  },
} as const;
