/**
 * PURPOSE: Returns descriptions of every flow mutation that exceeds the "additive-only" allowance —
 * the rule that lets an execution agent record what it discovered without letting it shrink the
 * acceptance target it is judged against, or rewrite the very unit it is signing off
 *
 * USAGE:
 * questFlowAdditiveOnlyViolationsTransformer({inputFlows: input.flows, currentQuest, currentStatus: 'in_progress'});
 * // Returns ErrorMessage[] of violations: any delete, adding a whole new flow, or an element that
 * // carries a sign-off alongside any other edit.
 * // Empty array means every entry in `inputFlows` only adds nodes/edges/observables to an existing
 * // flow, rewords an existing observable, or writes sign-offs and nothing else.
 *
 * Adding is safe and deleting is not, which is why the rule is asymmetric: a node, edge, or
 * observable an agent adds puts MORE constraint on itself (a branch it found, an assertion it now
 * owes), so it can never be used to slip past a gate. A delete — or swapping in a whole new flow —
 * could erase the very outcome the verify roles later assert on.
 *
 * THE SIGN-OFF RULE IS POSITIVE, and it is what stops the two allowances above from cancelling each
 * other out. A sign-off is EVIDENCE about a unit as it stands, so an element carrying
 * `flowriderSignoff` / `siegemasterSignoff` may carry ONLY `id` and the sign-off fields
 * (`signoffPatchFieldsStatics`). Without it the reword allowance lets one payload sign an observable
 * AND rewrite the assertion it just signed, in a single call, with nothing objecting.
 *
 * SCOPE IS PER-ELEMENT, NEVER PER-PAYLOAD. One `modify-quest` call legitimately signs twenty units
 * and adds a new observable elsewhere; only the elements on which a sign-off field itself appears
 * are constrained. A container is NOT signing: a flow patch `{id, nodes: [...]}` whose nodes carry
 * sign-offs is unconstrained, and so is a node patch `{id, observables: [...]}`.
 */
import type { ModifyQuestInput } from '@dungeonmaster/shared/contracts';

import type { QuestStatus, QuestStub } from '@dungeonmaster/shared/contracts';
import { errorMessageContract } from '@dungeonmaster/shared/contracts';
import type { ErrorMessage } from '@dungeonmaster/shared/contracts';

import { signoffPatchFieldsStatics } from '../../statics/signoff-patch-fields/signoff-patch-fields-statics';

type Quest = ReturnType<typeof QuestStub>;
type InputFlows = NonNullable<ModifyQuestInput['flows']>;
type InputFlow = InputFlows extends readonly (infer Item)[] ? Item : never;

// The modify-quest input contract strips unknown keys, so an element's own key set is exactly what
// the caller sent — key PRESENCE is the whole test. `null` is the sign-off clear marker, which is a
// sign-off write like any other and is held to the same rule.
const signoffFieldSet = new Set(signoffPatchFieldsStatics.signoffFields.map(String));
const allowedOnSigningElementSet = new Set(
  signoffPatchFieldsStatics.allowedOnSigningElement.map(String),
);
const allowedOnSigningNodeSet = new Set(signoffPatchFieldsStatics.allowedOnSigningNode.map(String));

export const questFlowAdditiveOnlyViolationsTransformer = ({
  inputFlows,
  currentQuest,
  currentStatus,
}: {
  inputFlows: readonly InputFlow[];
  currentQuest: Quest;
  currentStatus: QuestStatus;
}): ErrorMessage[] => {
  const offenders: ErrorMessage[] = [];

  for (const flow of inputFlows) {
    const flowId = String(flow.id);
    const flowDeleteMarked = flow._delete === true;
    const existingFlow = currentQuest.flows.find((f) => String(f.id) === flowId);

    if (flowDeleteMarked) {
      offenders.push(
        errorMessageContract.parse(
          `Flow delete not allowed in status '${currentStatus}' (attempted to delete flow '${flowId}')`,
        ),
      );
      continue;
    }

    // A whole new flow is a new acceptance target, not a discovery inside an existing one.
    if (existingFlow === undefined) {
      offenders.push(
        errorMessageContract.parse(
          `Flow add not allowed in status '${currentStatus}' (attempted to add flow '${flowId}') — you may add nodes, edges, and observables to an EXISTING flow, but not a new flow`,
        ),
      );
      continue;
    }

    // The delete-only flow shape (second union branch) has no nodes/edges fields.
    const inputNodes = 'nodes' in flow ? flow.nodes : undefined;
    if (inputNodes !== undefined) {
      for (const node of inputNodes) {
        const nodeId = String(node.id);
        const nodeKeys = Object.keys(node);

        // `observables` stays allowed on a signing node: it is a container, not content of the node
        // being signed, and every observable inside is held to this same rule at its own level. That
        // batched shape is what the flowrider-coverage-minion prompt writes.
        if (nodeKeys.some((key) => signoffFieldSet.has(key))) {
          for (const field of nodeKeys.filter((key) => !allowedOnSigningNodeSet.has(key))) {
            offenders.push(
              errorMessageContract.parse(
                `Node edit alongside a sign-off not allowed in status '${currentStatus}' (attempted to write field '${field}' on node '${nodeId}' in flow '${flowId}' in the same patch as a sign-off) — a sign-off patch may carry only 'id' and the sign-off fields`,
              ),
            );
          }
        }

        if (node._delete === true) {
          offenders.push(
            errorMessageContract.parse(
              `Node delete not allowed in status '${currentStatus}' (attempted to delete node '${nodeId}' from flow '${flowId}')`,
            ),
          );
          continue;
        }

        const inputObservables = 'observables' in node ? node.observables : undefined;
        if (inputObservables !== undefined) {
          for (const observable of inputObservables) {
            const observableId = String(observable.id);
            const observableKeys = Object.keys(observable);

            if (observableKeys.some((key) => signoffFieldSet.has(key))) {
              for (const field of observableKeys.filter(
                (key) => !allowedOnSigningElementSet.has(key),
              )) {
                offenders.push(
                  errorMessageContract.parse(
                    `Observable edit alongside a sign-off not allowed in status '${currentStatus}' (attempted to write field '${field}' on observable '${observableId}' from node '${nodeId}' in flow '${flowId}' in the same patch as a sign-off) — a sign-off patch may carry only 'id' and the sign-off fields`,
                  ),
                );
              }
            }

            if (observable._delete === true) {
              offenders.push(
                errorMessageContract.parse(
                  `Observable delete not allowed in status '${currentStatus}' (attempted to delete observable '${observableId}' from node '${nodeId}' in flow '${flowId}') — you may add observables, never remove one`,
                ),
              );
            }
          }
        }
      }
    }

    const inputEdges = 'edges' in flow ? flow.edges : undefined;
    if (inputEdges !== undefined) {
      for (const edge of inputEdges) {
        const edgeId = String(edge.id);
        const edgeKeys = Object.keys(edge);

        if (edgeKeys.some((key) => signoffFieldSet.has(key))) {
          for (const field of edgeKeys.filter((key) => !allowedOnSigningElementSet.has(key))) {
            offenders.push(
              errorMessageContract.parse(
                `Edge edit alongside a sign-off not allowed in status '${currentStatus}' (attempted to write field '${field}' on edge '${edgeId}' from flow '${flowId}' in the same patch as a sign-off) — a sign-off patch may carry only 'id' and the sign-off fields`,
              ),
            );
          }
        }

        if (edge._delete === true) {
          offenders.push(
            errorMessageContract.parse(
              `Edge delete not allowed in status '${currentStatus}' (attempted to delete edge '${edgeId}' from flow '${flowId}')`,
            ),
          );
        }
      }
    }

    const inputOffMapSignoffs = 'offMapSignoffs' in flow ? flow.offMapSignoffs : undefined;
    if (inputOffMapSignoffs !== undefined) {
      for (const offMapSignoff of inputOffMapSignoffs) {
        // The off-map id is the closed family enum, already a plain string — no re-branding needed.
        const familyId = offMapSignoff.id;
        const offMapKeys = Object.keys(offMapSignoff);

        if (offMapKeys.some((key) => signoffFieldSet.has(key))) {
          for (const field of offMapKeys.filter((key) => !allowedOnSigningElementSet.has(key))) {
            offenders.push(
              errorMessageContract.parse(
                `Off-map family edit alongside a sign-off not allowed in status '${currentStatus}' (attempted to write field '${field}' on off-map family '${familyId}' in flow '${flowId}' in the same patch as a sign-off) — a sign-off patch may carry only 'id' and the sign-off fields`,
              ),
            );
          }
        }
      }
    }
  }

  return offenders;
};
