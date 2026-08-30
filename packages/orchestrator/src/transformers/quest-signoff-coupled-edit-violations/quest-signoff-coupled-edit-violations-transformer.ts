/**
 * PURPOSE: Returns descriptions of every key a modify-quest payload writes on an element that is
 * ALSO writing a sign-off in the same call
 *
 * USAGE:
 * questSignoffCoupledEditViolationsTransformer({inputFlows: input.flows});
 * // Returns ErrorMessage[] naming each offending key, the element carrying it and its flow.
 * // Empty array means every signing element carries nothing but its id and its sign-offs.
 *
 * ONE SESSION AUTHORS AND SIGNS. A sign-off is evidence about a unit AS IT STANDS, and the session
 * that builds the artifact is the session that signs it — so an element allowed to carry a sign-off
 * and an edit in one payload lets a run move the goalposts to whatever it produced, with the quest
 * recording only the agreement. Refusing the coupling costs one extra call and makes the edit
 * visible AS an edit, in its own write, in front of the sign-off that follows it.
 *
 * THE ALLOWLIST IS PER ELEMENT KIND (`signoffPatchFieldsStatics`). An observable or an edge may
 * carry `id` and the sign-off fields; a node may additionally carry `observables`, because a
 * reviewer signs a whole slice in one call and every observable inside is held to the element
 * allowlist at its own level. Each offending key is named individually, so a payload learns every
 * key it has to move rather than one per round trip.
 *
 * `offMapSignoffs` entries are not walked: such an entry holds a family id and its sign-off fields
 * and nothing else, so it has no key an edit could ride in on.
 *
 * ELEMENTS CARRYING NO SIGN-OFF ARE UNAFFECTED. Adding and editing nodes, edges and observables
 * stays free — that is the additive spec authority, and this transformer never inspects an element
 * that is not signing.
 */
import type { ModifyQuestInput } from '@dungeonmaster/shared/contracts';
import { errorMessageContract } from '@dungeonmaster/shared/contracts';
import type { ErrorMessage } from '@dungeonmaster/shared/contracts';

import { signoffPatchFieldsStatics } from '../../statics/signoff-patch-fields/signoff-patch-fields-statics';

type InputFlows = NonNullable<ModifyQuestInput['flows']>;
type InputFlow = InputFlows extends readonly (infer Item)[] ? Item : never;

// The modify-quest input contract strips unknown keys, so key PRESENCE is the whole test for "this
// element writes a sign-off" — including the `null` clear marker, which is still a write.
const signoffFieldSet = new Set(signoffPatchFieldsStatics.signoffFields.map(String));
const allowedOnElementSet = new Set(signoffPatchFieldsStatics.allowedOnSigningElement.map(String));
const allowedOnNodeSet = new Set(signoffPatchFieldsStatics.allowedOnSigningNode.map(String));

const SPLIT_THE_CALL =
  'a sign-off is evidence about the unit as it stands, so one call may not both sign it and rewrite it — send the sign-off and the edit as two separate modify-quest calls';

export const questSignoffCoupledEditViolationsTransformer = ({
  inputFlows,
}: {
  inputFlows: readonly InputFlow[];
}): ErrorMessage[] => {
  const offenders: ErrorMessage[] = [];

  for (const flow of inputFlows) {
    const flowId = String(flow.id);
    // A flow-level delete marker carries none of these keys, so read them defensively.
    const inputNodes = 'nodes' in flow ? flow.nodes : undefined;
    const inputEdges = 'edges' in flow ? flow.edges : undefined;

    for (const node of inputNodes ?? []) {
      const nodeId = String(node.id);
      const nodeKeys = Object.keys(node);

      if (nodeKeys.some((key) => signoffFieldSet.has(key))) {
        for (const key of nodeKeys) {
          if (!allowedOnNodeSet.has(key)) {
            offenders.push(
              errorMessageContract.parse(
                `Sign-off on node '${nodeId}' in flow '${flowId}' also writes '${key}' — a node carrying a sign-off may carry only its id, its sign-off fields and its observables; ${SPLIT_THE_CALL}`,
              ),
            );
          }
        }
      }

      const inputObservables = 'observables' in node ? node.observables : undefined;

      for (const observable of inputObservables ?? []) {
        const observableId = String(observable.id);
        const observableKeys = Object.keys(observable);

        if (observableKeys.some((key) => signoffFieldSet.has(key))) {
          for (const key of observableKeys) {
            if (!allowedOnElementSet.has(key)) {
              offenders.push(
                errorMessageContract.parse(
                  `Sign-off on observable '${observableId}' on node '${nodeId}' in flow '${flowId}' also writes '${key}' — an observable carrying a sign-off may carry only its id and its sign-off fields; ${SPLIT_THE_CALL}`,
                ),
              );
            }
          }
        }
      }
    }

    for (const edge of inputEdges ?? []) {
      const edgeId = String(edge.id);
      const edgeKeys = Object.keys(edge);

      if (edgeKeys.some((key) => signoffFieldSet.has(key))) {
        for (const key of edgeKeys) {
          if (!allowedOnElementSet.has(key)) {
            offenders.push(
              errorMessageContract.parse(
                `Sign-off on edge '${edgeId}' in flow '${flowId}' also writes '${key}' — an edge carrying a sign-off may carry only its id and its sign-off fields; ${SPLIT_THE_CALL}`,
              ),
            );
          }
        }
      }
    }
  }

  return offenders;
};
