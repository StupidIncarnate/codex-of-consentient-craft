/**
 * PURPOSE: In-memory storage for layer constraint content loaded at startup
 *
 * USAGE:
 * import { layerConstraintsState } from './state/layer-constraints/layer-constraints-state';
 * const content = layerConstraintsState.get();
 * // Returns ContentText or undefined
 */
import type { ContentText } from '../../contracts/content-text/content-text-contract';

export const layerConstraintsState = {
  content: undefined as ContentText | undefined,

  set: ({ content }: { content: ContentText }): void => {
    layerConstraintsState.content = content;
  },

  get: (): ContentText | undefined => layerConstraintsState.content,

  clear: (): void => {
    layerConstraintsState.content = undefined;
  },
};
