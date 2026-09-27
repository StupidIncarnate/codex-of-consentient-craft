/**
 * PURPOSE: A complete `Node`-shaped value, typed against the real `@xyflow/react` interface.
 * `Node` is a plain data shape with no constructor — a React Flow caller builds one as a literal
 * the same way this stub does — so a hand-built literal (never `Partial`, every field the real
 * type requires present: `id`, `position`, `data`) is the honest, complete value here.
 *
 * USAGE:
 * const node = FlowNodeStub({ id: 'n1' });
 */
import type { Node } from '@xyflow/react';

export const FlowNodeStub = ({
  id = 'gateway-stub-node',
  x = 0,
  y = 0,
}: {
  id?: string;
  x?: number;
  y?: number;
} = {}): Node => ({
  id,
  position: { x, y },
  data: {},
});
