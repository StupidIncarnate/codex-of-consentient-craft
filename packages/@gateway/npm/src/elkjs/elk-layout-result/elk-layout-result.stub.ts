/**
 * PURPOSE: A real, laid-out graph, produced by actually running `elkjs`'s own async layout
 * algorithm against a small real graph — never a hand-typed set of positions, which the real
 * algorithm is the only thing that can honestly produce. Reshaped into plain, always-defined
 * fields (dropping elkjs's own internal `$H` bookkeeping field) so a caller reads real numbers
 * without threading through the raw `ElkNode`'s own optional `x`/`y`/`children`.
 *
 * USAGE:
 * const laidOut = await ElkLayoutResultStub();
 * // Returns { root: { id, width, height }, children: [{ id, x, y }, ...] }, real computed values
 */
import ELK from 'elkjs';
import type { ElkNode } from 'elkjs';

export const ElkLayoutResultStub = async ({
  id = 'gateway-stub-root',
  children = [
    { id: 'gateway-stub-node-1', width: 20, height: 20 },
    { id: 'gateway-stub-node-2', width: 20, height: 20 },
  ],
}: {
  id?: string;
  children?: ElkNode[];
} = {}): Promise<{
  root: { id: string; width: number; height: number };
  children: { id: string; x: number; y: number }[];
}> => {
  const elk = new ELK();
  // Widened via an explicit `: ElkNode` annotation, not `satisfies` (which keeps the narrower
  // literal type): elk.layout<T>(graph: T) is generic and infers T from whatever type the
  // argument carries, so an unwidened `{ id, children }` gives back a result typed as that same
  // narrow literal (no width/height/x/y) instead of the full ElkNode shape the real algorithm
  // actually populates.
  const graph: ElkNode = { id, children };
  const result = await elk.layout(graph);
  const laidOutChildren = result.children ?? [];

  return {
    root: { id: result.id, width: result.width ?? 0, height: result.height ?? 0 },
    children: laidOutChildren.map((child) => ({
      id: child.id,
      x: child.x ?? 0,
      y: child.y ?? 0,
    })),
  };
};
