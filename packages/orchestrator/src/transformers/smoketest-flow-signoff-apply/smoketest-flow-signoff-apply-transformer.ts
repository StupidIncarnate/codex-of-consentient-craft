/**
 * PURPOSE: Writes ONE sign-off value onto every unit of a flow that a caller names by verification
 * unit id, so the smoketest harness can settle a scripted agent's scope without that agent verifying
 * anything. Reach for `questResetFlowSignoffsBroker` instead to CLEAR a whole flow's track, and for
 * the `modify-quest` sign-off path whenever a real session is recording its own evidence.
 *
 * USAGE:
 * smoketestFlowSignoffApplyTransformer({ flow, unitIds, signoffField, signoff });
 * // Returns a new Flow whose named terminals, branches, observables and off-map families carry the
 * // sign-off on that field; unnamed units and the other field are untouched
 *
 * ADDRESSING GOES BACK THROUGH `qaUnitEnumerateTransformer`, never through a second id-format
 * derivation here. The ids a caller holds were minted by that enumeration — it is what the completion
 * gate measures — so re-enumerating is how an id becomes the graph element that owns it again, and an
 * id the enumeration does not produce matches nothing rather than silently signing the wrong element.
 *
 * An off-map family owns no graph element until one exists: `flow.offMapSignoffs` is an upsert array
 * keyed on the family, so a named family absent from it is APPENDED rather than dropped.
 *
 * `signoffField` is a caller-supplied key rather than a track name, because the map from track to
 * field is `signoffTrackEligibilityStatics` and it is MANY-TO-ONE — re-deriving it here would put a
 * second copy of that map behind a role comparison.
 */

import { flowContract } from '@dungeonmaster/shared/contracts';
import type { Flow, QaChecklistItemId, Signoff } from '@dungeonmaster/shared/contracts';

import type { signoffTrackEligibilityStatics } from '../../statics/signoff-track-eligibility/signoff-track-eligibility-statics';
import { qaUnitEnumerateTransformer } from '../qa-unit-enumerate/qa-unit-enumerate-transformer';

export const smoketestFlowSignoffApplyTransformer = ({
  flow,
  unitIds,
  signoffField,
  signoff,
}: {
  flow: Flow;
  unitIds: readonly QaChecklistItemId[];
  signoffField: (typeof signoffTrackEligibilityStatics.byTrack)[keyof typeof signoffTrackEligibilityStatics.byTrack]['signoffField'];
  signoff: Signoff;
}): Flow => {
  const targetIds = new Set(unitIds.map(String));
  const units = qaUnitEnumerateTransformer({ flow }).filter((unit) =>
    targetIds.has(String(unit.id)),
  );

  const terminalNodeIds = new Set(
    units.flatMap((unit) => (unit.kind === 'terminal' ? [String(unit.nodeId)] : [])),
  );
  const branchEdgeIds = new Set(
    units.flatMap((unit) => (unit.kind === 'branch' ? [String(unit.edgeId)] : [])),
  );
  const observableIds = new Set(
    units.flatMap((unit) => (unit.kind === 'observable' ? [String(unit.observableId)] : [])),
  );
  // Kept as an ordered list as well as a set: the appended entries below follow enumeration order,
  // so re-running the harness on the same flow reproduces `offMapSignoffs` byte for byte.
  const namedFamilies = units.flatMap((unit) =>
    unit.kind === 'off-map' ? [unit.offMapFamily] : [],
  );
  const namedFamilySet = new Set(namedFamilies);
  const recordedFamilies = new Set(flow.offMapSignoffs.map((entry) => entry.id));

  return flowContract.parse({
    ...flow,
    nodes: flow.nodes.map((node) => ({
      ...node,
      ...(terminalNodeIds.has(String(node.id)) ? { [signoffField]: signoff } : {}),
      observables: node.observables.map((observable) =>
        observableIds.has(String(observable.id))
          ? { ...observable, [signoffField]: signoff }
          : observable,
      ),
    })),
    edges: flow.edges.map((edge) =>
      branchEdgeIds.has(String(edge.id)) ? { ...edge, [signoffField]: signoff } : edge,
    ),
    offMapSignoffs: [
      ...flow.offMapSignoffs.map((entry) =>
        namedFamilySet.has(entry.id) ? { ...entry, [signoffField]: signoff } : entry,
      ),
      ...namedFamilies
        .filter((family) => !recordedFamilies.has(family))
        .map((family) => ({ id: family, [signoffField]: signoff })),
    ],
  });
};
