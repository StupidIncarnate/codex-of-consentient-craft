/**
 * PURPOSE: Applies verification unit settlement to a flow in the smoketest harness. With sign-off
 * fields on flow elements retired, nodes, edges and observables carry no sign-offs; off-map probe
 * families named by verification unit id are recorded in `flow.offMapSignoffs` so the fixture quest
 * reflects the probed off-map scope without that agent verifying anything.
 *
 * USAGE:
 * smoketestFlowSignoffApplyTransformer({ flow, unitIds });
 * // Returns a new Flow whose named off-map families are recorded in offMapSignoffs;
 * // unnamed units and existing off-map entries are untouched
 *
 * ADDRESSING GOES BACK THROUGH `qaUnitEnumerateTransformer`, never through a second id-format
 * derivation here. The ids a caller holds were minted by that enumeration — it is what the completion
 * gate measures — so re-enumerating is how an id becomes the graph element that owns it again, and an
 * id the enumeration does not produce matches nothing rather than silently signing the wrong element.
 *
 * An off-map family owns no graph element until one exists: `flow.offMapSignoffs` is an upsert array
 * keyed on the family, so a named family absent from it is APPENDED rather than dropped.
 *
 * NO SIGN-OFF FIELD SURVIVES ON A VERIFICATION UNIT: `codeweaverSignoff`, `flowriderSignoff` and
 * `siegemasterSignoff` are gone from every node, edge and observable, and this transformer takes no
 * sign-off argument to write into them — it works entirely through `flow.offMapSignoffs`.
 */

import { flowContract } from '@dungeonmaster/shared/contracts';
import type { Flow, QaChecklistItemId } from '@dungeonmaster/shared/contracts';

import { qaUnitEnumerateTransformer } from '../qa-unit-enumerate/qa-unit-enumerate-transformer';

export const smoketestFlowSignoffApplyTransformer = ({
  flow,
  unitIds,
}: {
  flow: Flow;
  unitIds: readonly QaChecklistItemId[];
}): Flow => {
  const targetIds = new Set(unitIds.map(String));
  const units = qaUnitEnumerateTransformer({ flow }).filter((unit) =>
    targetIds.has(String(unit.id)),
  );

  // Kept as an ordered list as well as a set: the appended entries below follow enumeration order,
  // so re-running the harness on the same flow reproduces `offMapSignoffs` byte for byte.
  const namedFamilies = units.flatMap((unit) =>
    unit.kind === 'off-map' ? [unit.offMapFamily] : [],
  );
  const recordedFamilies = new Set(flow.offMapSignoffs.map((entry) => entry.id));

  return flowContract.parse({
    ...flow,
    offMapSignoffs: [
      ...flow.offMapSignoffs,
      ...namedFamilies
        .filter((family) => !recordedFamilies.has(family))
        .map((family) => ({ id: family })),
    ],
  });
};
