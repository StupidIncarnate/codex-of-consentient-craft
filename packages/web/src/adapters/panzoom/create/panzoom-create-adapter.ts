/**
 * PURPOSE: Wraps @panzoom/panzoom to create a pan/zoom instance on a DOM element
 *
 * USAGE:
 * const pz = panzoomCreateAdapter({element: svgContainer});
 * pz.zoomIn();
 * pz.destroy(); // cleanup
 */

import Panzoom from '@panzoom/panzoom';

export interface PanzoomInstance {
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
  destroy: () => void;
}

const PANZOOM_OPTIONS = {
  maxScale: 5,
  minScale: 0.5,
  step: 0.3,
  contain: 'outside' as const,
};

export const panzoomCreateAdapter = ({ element }: { element: HTMLElement }): PanzoomInstance => {
  const instance = Panzoom(element, PANZOOM_OPTIONS);

  return {
    zoomIn: () => {
      instance.zoomIn();
    },
    zoomOut: () => {
      instance.zoomOut();
    },
    reset: () => {
      instance.reset();
    },
    destroy: () => {
      instance.destroy();
    },
  };
};
