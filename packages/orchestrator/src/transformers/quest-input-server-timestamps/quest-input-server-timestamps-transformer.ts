/**
 * PURPOSE: Puts the server's clock reading on every timestamp a modify-quest payload is WRITING,
 * discarding whatever the caller sent. It runs on the INPUT rather than on the merged quest, and
 * that is the whole point: the merge carries untouched entries through unchanged, so a write that
 * only signs one observable leaves the other forty sign-offs, notes and ledger entries reading the
 * moment they were really made, instead of re-dating the whole quest on every unrelated call.
 *
 * USAGE:
 * questInputServerTimestampsTransformer({ input: validated, at });
 * // Returns: the same input, re-validated, with every sign-off `at`, blight-ledger `createdAt`,
 * // quest-note `at` and operation-plan `at` it carries replaced by `at`
 *
 * An LLM has no reliable clock. Every one of these fields was agent-authored before this existed,
 * and an audited quest carried 27 sign-offs sharing one fabricated timestamp that predated the work,
 * plus a session whose notes drifted 50 minutes into a future it never reached.
 */
import { modifyQuestInputContract } from '@dungeonmaster/shared/contracts';
import type { ModifyQuestInput, Signoff } from '@dungeonmaster/shared/contracts';

import { signoffElementStampTransformer } from '../signoff-element-stamp/signoff-element-stamp-transformer';

export const questInputServerTimestampsTransformer = ({
  input,
  at,
}: {
  input: ModifyQuestInput;
  at: Signoff['at'];
}): ModifyQuestInput => {
  const { flows, planningNotes } = input;

  // Nothing this payload carries has a timestamp, so it round-trips untouched rather than paying a
  // second whole-input parse.
  if (flows === undefined && planningNotes === undefined) {
    return input;
  }

  return modifyQuestInputContract.parse({
    ...input,
    ...(flows === undefined
      ? {}
      : {
          flows: flows.map((flow) => {
            // Read positionally, exactly as the additive-only and unknown-unit rules read the same
            // payload: the flow union's delete-marker branch carries none of these keys.
            const nodes = 'nodes' in flow ? flow.nodes : undefined;
            const edges = 'edges' in flow ? flow.edges : undefined;
            const offMapSignoffs = 'offMapSignoffs' in flow ? flow.offMapSignoffs : undefined;

            return {
              ...flow,
              ...(nodes === undefined
                ? {}
                : {
                    nodes: nodes.map((node) => {
                      const observables = 'observables' in node ? node.observables : undefined;

                      return {
                        // A node signs on its own account AND contains observables that sign on
                        // theirs, so both levels are stamped — the batched
                        // `{id, flowriderSignoff, observables: [...]}` shape a reviewer-minion
                        // writes is one call carrying sign-offs at two depths.
                        ...signoffElementStampTransformer({ element: node, at }),
                        ...(observables === undefined
                          ? {}
                          : {
                              observables: observables.map((observable) =>
                                signoffElementStampTransformer({ element: observable, at }),
                              ),
                            }),
                      };
                    }),
                  }),
              ...(edges === undefined
                ? {}
                : {
                    edges: edges.map((edge) =>
                      signoffElementStampTransformer({ element: edge, at }),
                    ),
                  }),
              ...(offMapSignoffs === undefined
                ? {}
                : {
                    offMapSignoffs: offMapSignoffs.map((offMapSignoff) =>
                      signoffElementStampTransformer({ element: offMapSignoff, at }),
                    ),
                  }),
            };
          }),
        }),
    ...(planningNotes === undefined
      ? {}
      : {
          planningNotes: {
            ...planningNotes,
            ...(planningNotes.blightLedger === undefined
              ? {}
              : {
                  blightLedger: planningNotes.blightLedger.map((entry) => ({
                    ...entry,
                    createdAt: at,
                  })),
                }),
            ...(planningNotes.questNotes === undefined
              ? {}
              : {
                  questNotes: planningNotes.questNotes.map((note) => ({ ...note, at })),
                }),
            ...(planningNotes.operationPlans === undefined
              ? {}
              : {
                  operationPlans: planningNotes.operationPlans.map((plan) => ({ ...plan, at })),
                }),
          },
        }),
  });
};
