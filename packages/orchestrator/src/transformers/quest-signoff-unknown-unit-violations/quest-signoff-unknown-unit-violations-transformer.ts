/**
 * PURPOSE: Returns descriptions of every sign-off a modify-quest payload writes against a unit that
 * does not exist at that exact position on the quest graph
 *
 * USAGE:
 * questSignoffUnknownUnitViolationsTransformer({inputFlows: input.flows, currentQuest});
 * // Returns ErrorMessage[] naming each unknown id and where it was looked for.
 * // Empty array means every element carrying a sign-off addresses a unit already on the graph.
 *
 * THE UPSERT IS WHY THIS EXISTS. `questArrayUpsertTransformer` APPENDS any update whose id it does
 * not find, which is exactly right for the additive spec authority — an execution agent records a
 * branch it discovered by sending a new node. Applied to a sign-off it is a silent corruption: a
 * mistyped observable id creates a SECOND graph home for one logical unit, and every reader of that
 * track's coverage counts that phantom forever. You cannot have verified something that did not
 * exist.
 *
 * THE CHECK IS POSITIONAL, not "is this id anywhere on the quest". A node's id must resolve on the
 * flow the payload nests it under, an observable's on that node, an edge's on that flow — otherwise
 * a sign-off aimed at the wrong parent still writes a phantom, just one harder to spot. Off-map
 * families are keyed by a closed enum and an entry legitimately materialises on first write, so the
 * only thing to resolve for one is its FLOW.
 *
 * ELEMENTS CARRYING NO SIGN-OFF ARE UNAFFECTED. Adding a brand-new node, edge, or observable stays
 * legal — that is the whole point of the additive spec authority, and this transformer never
 * inspects it.
 */
import type { ModifyQuestInput } from '@dungeonmaster/shared/contracts';

import type { QuestStub } from '@dungeonmaster/shared/contracts';
import { errorMessageContract } from '@dungeonmaster/shared/contracts';
import type { ErrorMessage } from '@dungeonmaster/shared/contracts';

import { signoffPatchFieldsStatics } from '../../statics/signoff-patch-fields/signoff-patch-fields-statics';

type Quest = ReturnType<typeof QuestStub>;
type InputFlows = NonNullable<ModifyQuestInput['flows']>;
type InputFlow = InputFlows extends readonly (infer Item)[] ? Item : never;

// The modify-quest input contract strips unknown keys, so key PRESENCE is the whole test for "this
// element writes a sign-off" — including the `null` clear marker, which is still a write.
const signoffFieldSet = new Set(signoffPatchFieldsStatics.signoffFields.map(String));

export const questSignoffUnknownUnitViolationsTransformer = ({
  inputFlows,
  currentQuest,
}: {
  inputFlows: readonly InputFlow[];
  currentQuest: Quest;
}): ErrorMessage[] => {
  const offenders: ErrorMessage[] = [];

  for (const flow of inputFlows) {
    const flowId = String(flow.id);
    const existingFlow = currentQuest.flows.find((f) => String(f.id) === flowId);
    const inputNodes = 'nodes' in flow ? flow.nodes : undefined;
    const inputEdges = 'edges' in flow ? flow.edges : undefined;
    const inputOffMapSignoffs = 'offMapSignoffs' in flow ? flow.offMapSignoffs : undefined;

    if (existingFlow === undefined) {
      // Nothing below can resolve, so one flow-level message replaces N unresolvable unit messages.
      const signsSomething =
        (inputNodes ?? []).some(
          (node) =>
            Object.keys(node).some((key) => signoffFieldSet.has(key)) ||
            ('observables' in node ? (node.observables ?? []) : []).some((observable) =>
              Object.keys(observable).some((key) => signoffFieldSet.has(key)),
            ),
        ) ||
        (inputEdges ?? []).some((edge) =>
          Object.keys(edge).some((key) => signoffFieldSet.has(key)),
        ) ||
        (inputOffMapSignoffs ?? []).some((offMapSignoff) =>
          Object.keys(offMapSignoff).some((key) => signoffFieldSet.has(key)),
        );

      if (signsSomething) {
        offenders.push(
          errorMessageContract.parse(
            `Sign-off on unknown flow '${flowId}' — no flow with that id exists on this quest; a sign-off may only be written on a unit that already exists, and an unknown id appends a phantom unit instead of signing the intended one`,
          ),
        );
      }
      continue;
    }

    if (inputNodes !== undefined) {
      for (const node of inputNodes) {
        const nodeId = String(node.id);
        const existingNode = existingFlow.nodes.find((n) => String(n.id) === nodeId);

        if (
          existingNode === undefined &&
          Object.keys(node).some((key) => signoffFieldSet.has(key))
        ) {
          offenders.push(
            errorMessageContract.parse(
              `Sign-off on unknown node '${nodeId}' — no node with that id exists on flow '${flowId}'; a sign-off may only be written on a unit that already exists, and an unknown id appends a phantom unit instead of signing the intended one`,
            ),
          );
        }

        const inputObservables = 'observables' in node ? node.observables : undefined;
        if (inputObservables !== undefined) {
          for (const observable of inputObservables) {
            const observableId = String(observable.id);
            const existingObservable = existingNode?.observables.find(
              (o) => String(o.id) === observableId,
            );

            if (
              existingObservable === undefined &&
              Object.keys(observable).some((key) => signoffFieldSet.has(key))
            ) {
              offenders.push(
                errorMessageContract.parse(
                  `Sign-off on unknown observable '${observableId}' — no observable with that id exists on node '${nodeId}' in flow '${flowId}'; a sign-off may only be written on a unit that already exists, and an unknown id appends a phantom unit instead of signing the intended one`,
                ),
              );
            }
          }
        }
      }
    }

    if (inputEdges !== undefined) {
      for (const edge of inputEdges) {
        const edgeId = String(edge.id);
        const existingEdge = existingFlow.edges.find((e) => String(e.id) === edgeId);

        if (
          existingEdge === undefined &&
          Object.keys(edge).some((key) => signoffFieldSet.has(key))
        ) {
          offenders.push(
            errorMessageContract.parse(
              `Sign-off on unknown edge '${edgeId}' — no edge with that id exists on flow '${flowId}'; a sign-off may only be written on a unit that already exists, and an unknown id appends a phantom unit instead of signing the intended one`,
            ),
          );
        }
      }
    }
  }

  return offenders;
};
