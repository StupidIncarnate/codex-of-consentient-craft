/**
 * PURPOSE: Turns ONE relay-tail seed into the N scopes it should become, so the expansion is data
 * (`fanOutBy`) rather than a chain of role-name comparisons in the seeding broker. Reach for this
 * whenever a new tail role needs its own slicing: add the member to `fanOutBy` and a branch here,
 * and the broker keeps minting items without knowing which role it is holding.
 *
 * A verification unit routes by its owning NODE's `packages`, NEVER by an observable's. Only one of
 * the four unit kinds is an observable — terminals and branches are properties of the graph, and a
 * decision node carrying no observables at all still emits branch units — so a slicer keyed on
 * `observable.package` drops every unit those nodes own into no slice, silently shrinking the
 * denominator the slicing exists to make honest.
 *
 * A package is ranked on its whole KIND SET, never on the single winning label. A package can be
 * more than one kind, and the detector's priority table reports only its first match, so a package
 * that serves HTTP and also renders widgets reads as backend-only from the label — and lands in the
 * wrong build tier, ahead of nothing it is actually depended upon by.
 *
 * USAGE:
 * relayTailFanOutTransformer({ entry: questTypeRegistryStatics.feature.relayTail[1], quest });
 * // Returns one slice per quest flow the seed's OWN role is measured over; the `implementation`
 * // seed returns one slice per (package, flow) cell instead
 */

import { operationItemContract } from '@dungeonmaster/shared/contracts';
import type { FlowId, OperationItem, PackageName, Quest } from '@dungeonmaster/shared/contracts';
import { packageBuildOrderStatics } from '@dungeonmaster/shared/statics';
import type { questTypeRegistryStatics } from '@dungeonmaster/shared/statics';
import {
  questContractSourceOwnerTransformer,
  questPackageEntryKindsTransformer,
} from '@dungeonmaster/shared/transformers';

import { signoffTrackEligibilityStatics } from '../../statics/signoff-track-eligibility/signoff-track-eligibility-statics';

type RegistryEntry = (typeof questTypeRegistryStatics)[keyof typeof questTypeRegistryStatics];

// BOTH seed lists, not just the tail: `startImplementationOps` carries a `fanOutBy` too — the
// codeweaver seed expands into the derived per-package ledger through this same transformer, so the
// seeding broker mints implementation items and tail items with one call shape and still learns no
// role name.
type SeedList = RegistryEntry['relayTail'] | RegistryEntry['startImplementationOps'];

type RelayTailEntry = SeedList extends readonly (infer Entry)[] ? Entry : never;

export type RelayTailSlice = Pick<OperationItem, 'text' | 'flowIds' | 'packageNames'>;

export const relayTailFanOutTransformer = ({
  entry,
  quest,
}: {
  entry: RelayTailEntry;
  quest: Quest;
}): RelayTailSlice[] => {
  const textContract = operationItemContract.shape.text;
  // Read with an `in` check rather than a "none" member, mirroring how `wardMode` is read at the
  // seed site: an entry that fans out to exactly one item states nothing.
  const fanOutBy = 'fanOutBy' in entry ? entry.fanOutBy : undefined;

  if (fanOutBy === 'flow') {
    // THE SEED'S OWN ROLE decides the cut, read off the one statics every denominator reader
    // shares, so the ledger and get-qa-checklist cannot disagree about what an item covers.
    const eligibility = new Map(Object.entries(signoffTrackEligibilityStatics.byTrack)).get(
      entry.role,
    );

    // One item per flow of a type this role's track MEASURES. An item minted over a flow type its
    // own track excludes carries a denominator of zero units, so no session of that role can sign a
    // single unit of it. A role the statics defines no track for is measured by nothing, so nothing
    // narrows it and it keeps every flow.
    const eligibleFlows = quest.flows.filter(
      (flow) =>
        eligibility === undefined || new Set(eligibility.flowTypes.map(String)).has(flow.flowType),
    );

    if (eligibleFlows.length === 0) {
      // Nothing eligible — a quest with no flows at all, or one whose every flow is a type this
      // track does not measure. Whether the role still gets ONE whole-quest item turns on `off-map`
      // in its `unitKinds`: the probe families — hostile-input and perf among them — are properties
      // of the BUILT SYSTEM rather than of any drawn flow, so a track that owns them keeps an owner
      // for them even here. A track that does not own them has nothing left to prove, and an item
      // whose denominator is empty is a session dispatched to do nothing.
      const ownsOffMapProbes =
        eligibility !== undefined && new Set(eligibility.unitKinds.map(String)).has('off-map');

      return ownsOffMapProbes
        ? [{ text: textContract.parse(entry.text), flowIds: [], packageNames: [] }]
        : [];
    }

    return eligibleFlows.map((flow) => ({
      text: textContract.parse(`${entry.text} — flow: ${String(flow.id)}`),
      flowIds: [flow.id],
      packageNames: [],
    }));
  }

  if (fanOutBy === 'implementation') {
    // Tier rank per KIND, read off the statics tuple's own index. This is the PRIMARY sort key and
    // it outranks `packageGraph` depth deliberately: depth is Kahn's order over the workspace
    // manifests, and across an HTTP seam that is inverted. Measured in this repo — `server` depends
    // on `web` because it serves the built bundle, so depth ranks the browser package AHEAD of the
    // backend whose routes it calls.
    const rankByKind = new Map(
      packageBuildOrderStatics.tiers.flatMap((tier, tierIndex) =>
        tier.map((kind) => [kind, tierIndex] as const),
      ),
    );
    const unrankedTier = packageBuildOrderStatics.tiers.length;

    // A package is ranked on its whole KIND SET at its EARLIEST tier, never on the detector's single
    // winning label: a package that serves HTTP and also renders widgets is depended upon as a
    // backend, so it must be built before the frontends calling it rather than alongside them.
    const rankByPackage = new Map(
      quest.packagesAffected.map((affected) => {
        const ranks = questPackageEntryKindsTransformer({ entry: affected }).flatMap((kind) => {
          const rank = rankByKind.get(kind);
          return rank === undefined ? [] : [rank];
        });
        return [
          String(affected.name),
          ranks.length === 0 ? unrankedTier : Math.min(...ranks),
        ] as const;
      }),
    );

    // Depth breaks ties WITHIN a tier, where the manifests are telling the truth — two libraries,
    // one importing the other. A quest with no graph stamped yet ranks every package equal here and
    // falls through to the name tiebreak, which keeps the output deterministic either way.
    const depthByPackage = new Map(
      quest.packageGraph.map((graphEntry) => [String(graphEntry.id), graphEntry.depth]),
    );

    // ONE ITEM PER (PACKAGE, FLOW) CELL — a cell exists wherever a package tags at least one node
    // on that flow — over BOTH flow types. A codeweaver session builds one package's half of one
    // flow and its prompt says exactly that, so an item carrying several flows makes that sentence
    // false and hands one session several unrelated pieces of work; it also makes the flow slice
    // that session fetches as large as the union of everything it owns.
    //
    // Both flow types, deliberately. The verification tracks filter to `runtime` because an
    // operational flow has nothing repeatable for a suite to assert — but an operational flow is
    // still implementation work, and filtering here would delete an init/migration flow's whole
    // scope from the ledger with nothing failing to say so.
    const flowsByPackage = new Map<unknown, FlowId[]>();
    const packageNamesByKey = new Map<unknown, PackageName>();
    for (const flow of quest.flows) {
      for (const node of flow.nodes) {
        // Membership is "this package TAGS this node", never "owns it". A glue node therefore
        // appears in BOTH sides' cells, which is correct — a seam has two halves and each side
        // builds its own. Every item stays single-package; only the node is shared.
        //
        // Awarding the node to one owner instead lost work whenever that node was the OTHER side's
        // ONLY node in the flow: no cell was minted for it at all, so its observables reached no
        // session's "Must satisfy" list and surfaced only in the owner's seam block — which asks a
        // session to verify a package its own item does not declare.
        for (const name of node.packages) {
          const key = String(name);
          packageNamesByKey.set(key, name);
          const flowIds = flowsByPackage.get(key) ?? [];
          if (!flowIds.some((flowId) => String(flowId) === String(flow.id))) {
            flowIds.push(flow.id);
          }
          flowsByPackage.set(key, flowIds);
        }
      }
    }

    // Contracts add a package that node tags alone would have missed, and that is the ONLY reason
    // a package with zero tagged nodes gets an item at all. On the quest that motivated this,
    // `shared` tagged no node and owned nine contracts — the status enum, the transitions table,
    // the role roster — so a partition read off node tags alone derived no shared scope whatsoever.
    // Such a package keeps an EMPTY flow list and becomes ONE item, which is not a foundation item:
    // a package that DOES tag nodes gets cells and nothing else, and its contracts reach it through
    // the `packageName`-only `get-quest` call every codeweaver prompt spells out, which routes
    // contracts by PATH rather than by flow.
    for (const contract of quest.contracts) {
      // An `existing` contract is reference material the spec points at, not work this quest does,
      // so it mints nothing. `questContractSourceCoverageViolationsTransformer` refuses an
      // unresolvable source at `approved` on exactly the same split, and through the SAME resolver
      // below — a divergence there would refuse work that routes, or pass work that does not.
      if (contract.status === 'existing') {
        continue;
      }
      // SEVERAL packages, not one: a property may carry its own `source`, which is how one
      // contract delivers into more than one package. Reading the contract's own path alone sent
      // every property to a single session, and a property whose file lives elsewhere then reached
      // nobody — the contract being, for a deliverable no observable mentions, its only carrier.
      const owners = [
        questContractSourceOwnerTransformer({
          contract,
          packagesAffected: quest.packagesAffected,
        }),
        ...contract.properties.map((property) =>
          questContractSourceOwnerTransformer({
            contract,
            property,
            packagesAffected: quest.packagesAffected,
          }),
        ),
      ];
      for (const owner of owners) {
        if (owner !== undefined) {
          const key = String(owner);
          packageNamesByKey.set(key, owner);
          if (!flowsByPackage.has(key)) {
            flowsByPackage.set(key, []);
          }
        }
      }
    }

    // Ordering has two levels. PACKAGE order is the outer one — KIND tier, then `packageGraph`
    // depth within a tier, then name — so a provider's cells all sit ahead of its consumers'. CELL
    // order within one package is the quest's own FLOW DECLARATION order, which is what the loop
    // above accumulates: it needs only to be deterministic, and the spec's order is the one a
    // reader of the ledger can also see on the quest.
    const ordered = [...flowsByPackage.entries()]
      .flatMap(([key, flowIds]) => {
        const name = packageNamesByKey.get(key);
        return name === undefined ? [] : [{ name, flowIds }];
      })
      .sort((left, right) => {
        const leftRank = rankByPackage.get(String(left.name)) ?? unrankedTier;
        const rightRank = rankByPackage.get(String(right.name)) ?? unrankedTier;
        if (leftRank !== rightRank) {
          return leftRank - rightRank;
        }
        const depthDelta =
          (depthByPackage.get(String(left.name)) ?? 0) -
          (depthByPackage.get(String(right.name)) ?? 0);
        if (depthDelta !== 0) {
          return depthDelta;
        }
        return String(left.name).localeCompare(String(right.name));
      });

    // The text is a LABEL, not the scope. What the session must satisfy — the nodes, the verbatim
    // observables, the contracts — is rendered live at dispatch by `workItemToPromptTransformer`,
    // because a scope baked in here is a snapshot: an observable a mid-quest session ADDS to a flow
    // would be invisible to every item minted before it. The label still names BOTH dimensions,
    // because it is what `operationPtChainTransformer` keys a pt chain on — a text naming only the
    // package would share one budget across every cell that package owns.
    if (ordered.length > 0) {
      return ordered.flatMap((slice) =>
        slice.flowIds.length === 0
          ? [
              {
                text: textContract.parse(`${entry.text} — package: ${String(slice.name)}`),
                flowIds: [],
                packageNames: [slice.name],
              },
            ]
          : slice.flowIds.map((flowId) => ({
              text: textContract.parse(
                `${entry.text} — package: ${String(slice.name)} · flow: ${String(flowId)}`,
              ),
              flowIds: [flowId],
              packageNames: [slice.name],
            })),
      );
    }

    // No node tags a package and no contract resolves to one — a quest drawn with no flows and no
    // authored contracts. One whole-quest item keeps the role owned rather than seeding a relay
    // with no implementation in it at all.
    return [{ text: textContract.parse(entry.text), flowIds: [], packageNames: [] }];
  }

  return [{ text: textContract.parse(entry.text), flowIds: [], packageNames: [] }];
};
