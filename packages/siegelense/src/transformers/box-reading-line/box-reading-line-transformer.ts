/**
 * PURPOSE: The one-line human reading of a `box` step for the `results` text view. `--json` keeps the
 * raw geometry object; this is the only surface that flattens it, so reach for
 * `boxReadingRenderTransformer` when the stored JSON is what you need.
 *
 * USAGE:
 * boxReadingLineTransformer({ reading: BoxReadingStub() });
 * // Returns 'ref 26: 66×27 at (607, 472) — visible, in viewport (viewport 1280×720)'
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

import type { BoxReading } from '../../contracts/box-reading/box-reading-contract';

export const boxReadingLineTransformer = ({ reading }: { reading: BoxReading }): ContentText => {
  const visibility = reading.visible ? 'visible' : 'not visible';
  const placement = reading.inViewport ? 'in viewport' : 'outside viewport';
  return contentTextContract.parse(
    `ref ${reading.ref}: ${reading.width}×${reading.height} at (${reading.x}, ${reading.y}) — ` +
      `${visibility}, ${placement} (viewport ${reading.viewport.width}×${reading.viewport.height})`,
  );
};
