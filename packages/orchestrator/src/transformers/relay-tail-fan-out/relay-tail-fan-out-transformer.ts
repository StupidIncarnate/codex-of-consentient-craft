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
 * EVERY branch reads its role's own `signoffTrackEligibilityStatics` entry before it mints
 * anything, so a slice can never declare a package kind the completion gate then narrows straight
 * back out — which would seed a full session, work item and pt budget over an empty denominator.
 * A node's contribution is therefore the subset of its `packages` whose KIND that role owns: none
 * of them means no slice, one means that package's slice, and two or more means the seam slice.
 *
 * A package is ranked on its whole KIND SET, never on the single winning label. A package can be
 * more than one kind, and the detector's priority table reports only its first match, so a package
 * that serves HTTP and also renders widgets reads as backend-only from the label — and mints no
 * groundstomper item at all, which is browser coverage lost with nothing failing to say so.
 *
 * USAGE:
 * relayTailFanOutTransformer({ entry: questTypeRegistryStatics.feature.relayTail[1], quest });
 * // Returns one slice per package the quest's runtime nodes tag, plus the seam slice
 */

import { operationItemContract } from '@dungeonmaster/shared/contracts';
import type { FlowId, OperationItem, PackageName, Quest } from '@dungeonmaster/shared/contracts';
import { packageBuildOrderStatics } from '@dungeonmaster/shared/statics';
import type { questTypeRegistryStatics } from '@dungeonmaster/shared/statics';
import { questPackageEntryKindsTransformer } from '@dungeonmaster/shared/transformers';

import { questContractSourceOwnerTransformer } from '../quest-contract-source-owner/quest-contract-source-owner-transformer';
import { signoffTrackEligibilityStatics } from '../../statics/signoff-track-eligibility/signoff-track-eligibility-statics';

type RegistryEntry = (typeof questTypeRegistryStatics)[keyof typeof questTypeRegistryStatics];

// BOTH seed lists, not just the tail: `startImplementationOps` now carries a `fanOutBy` too — the
// feature quest's codeweaver seed expands into the derived per-cell ledger through this same
// transformer, so the seeding broker mints implementation items and tail items with one call shape
// and still learns no role name.
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
  // Read with an `in` check rather than a fourth "none" member, mirroring how `wardMode` is read at
  // the seed site: an entry that fans out to exactly one item states nothing.
  const fanOutBy = 'fanOutBy' in entry ? entry.fanOutBy : undefined;

  if (fanOutBy === 'flow') {
    // A flow-less quest still gets exactly one item. The off-map probe families — hostile-input and
    // perf among them — are the only place this quest's security and performance are established,
    // and they are properties of the built system rather than of any drawn flow, so dropping the
    // role because no flow exists would leave them unowned.
    if (quest.flows.length === 0) {
      return [{ text: textContract.parse(entry.text), flowIds: [], packageNames: [] }];
    }
    return quest.flows.map((flow) => ({
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

    // ONE ITEM PER PACKAGE, carrying every flow it tags a node in — over BOTH flow types. The
    // verification `package` branch below filters to `runtime` because an operational flow has
    // nothing repeatable for a suite to assert; an operational flow is still implementation work,
    // and filtering here would delete an init/migration flow's whole scope from the ledger with
    // nothing failing to say so.
    //
    // This used to be one item per (package, flow) CELL plus a separate flow-less FOUNDATION item
    // holding that package's contracts. Both halves are one item now, and the ordering the split
    // bought — a package's contracts landing before the flows built on them — is its planner's
    // `PHASES` instead, where the round's own phase gate re-reads the foundation before anything
    // sits on it. A cell ledger made that a property of dispatch order across several sessions,
    // which is a coarser instrument for the same guarantee and cost one session per flow to get.
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

    // Contracts add a package that node tags alone would have missed, and that is the only reason
    // a package with zero tagged nodes gets an item at all. On the quest that motivated this,
    // `shared` tagged no node and owned nine contracts — the status enum, the transitions table,
    // the role roster — so a partition read off node tags alone derived no shared scope whatsoever.
    // Such a package keeps an EMPTY flow list, which the scope block renders as contracts and no
    // nodes.
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

    if (ordered.length > 0) {
      return ordered.map((slice) => ({
        // The text is a LABEL, not the scope. What the session must satisfy — the nodes, the
        // verbatim observables, the contracts — is rendered live at dispatch by
        // `workItemToPromptTransformer`, because a scope baked in here is a snapshot: an observable
        // a mid-quest session ADDS to a flow would be invisible to every item minted before it.
        text: textContract.parse(`${entry.text} — package: ${String(slice.name)}`),
        flowIds: slice.flowIds,
        packageNames: [slice.name],
      }));
    }

    // No node tags a package and no contract resolves to one — a quest drawn with no flows and no
    // authored contracts. One whole-quest item keeps the role owned rather than seeding a relay
    // with no implementation in it at all.
    return [{ text: textContract.parse(entry.text), flowIds: [], packageNames: [] }];
  }

  if (fanOutBy === 'package') {
    const runtimeFlows = quest.flows.filter((flow) => flow.flowType === 'runtime');

    // Eligibility is read from the SAME list the completion gate narrows this role's denominator
    // with, so a seeded item can never own an empty denominator. Naming the package KINDS rather
    // than any package name is what lets this run in a repo with several UI packages, or none.
    const eligiblePackageTypes = new Set(
      signoffTrackEligibilityStatics.byTrack.flowrider.packageTypes.map(String),
    );
    // The entry's KIND SET, never its single display label: a package that serves HTTP and also
    // renders widgets is honestly both, and the detector's priority table can only report one
    // winner. Ranking the winner alone would hand every such package wholly to one track.
    const packageKindsByName = new Map(
      quest.packagesAffected.map((affected) => [
        String(affected.name),
        questPackageEntryKindsTransformer({ entry: affected }).map(String),
      ]),
    );

    const sliceByPackage = new Map<unknown, RelayTailSlice>();
    const seamNames = new Map<unknown, PackageName>();
    const seamFlowIds: FlowId[] = [];

    for (const flow of runtimeFlows) {
      for (const node of flow.nodes) {
        // A package whose kind does NOT resolve is kept, which is what the completion gate does
        // with it too: `packagesAffected` lagging a node tag is the coverage rule's own failure
        // case, and dropping the package here would delete its units from every denominator
        // instead of surfacing them.
        const owned = node.packages.filter((name) => {
          const kinds = packageKindsByName.get(String(name));
          return kinds === undefined || kinds.some((kind) => eligiblePackageTypes.has(kind));
        });

        // Every kind this node lands in belongs to the sibling authoring track — a node tagged
        // only with frontend packages, a two-frontend glue node included. Its units are outside
        // this role's denominator by KIND, so a slice minted for it would own nothing.
        if (owned.length === 0) {
          continue;
        }

        // A node is a SEAM for this role when more than one package THIS ROLE OWNS meets on it. A
        // glue node spanning a frontend and a backend package meets that bar on one side only, so
        // its units go to that one package's slice — the same arity the completion gate reads off
        // the item, which is what keeps slicer and gate exactly dual.
        if (owned.length > 1) {
          for (const name of owned) {
            seamNames.set(String(name), name);
          }
          if (!seamFlowIds.some((flowId) => String(flowId) === String(flow.id))) {
            seamFlowIds.push(flow.id);
          }
          continue;
        }

        for (const name of owned) {
          const key = String(name);
          const slice = sliceByPackage.get(key);
          if (slice === undefined) {
            sliceByPackage.set(key, {
              text: textContract.parse(`${entry.text} — package: ${key}`),
              flowIds: [flow.id],
              packageNames: [name],
            });
            continue;
          }
          if (!slice.flowIds.some((flowId) => String(flowId) === String(flow.id))) {
            slice.flowIds.push(flow.id);
          }
        }
      }
    }

    const slices = [...sliceByPackage.values()];

    // ONE seam slice for every glue node on the quest, not one per seam pair. The glue units are
    // the only part that structurally needs a cross-flow view, which is what makes them one scope.
    if (seamNames.size > 0) {
      const spanned = [...seamNames.values()];
      slices.push({
        text: textContract.parse(
          `${entry.text} — seam: ${spanned.map((name) => String(name)).join(' + ')}`,
        ),
        flowIds: seamFlowIds,
        packageNames: spanned,
      });
    }

    if (slices.length > 0) {
      return slices;
    }

    // Runtime nodes exist and every one of them lands wholly in the sibling track's package kinds.
    // NO item at all, rather than a whole-quest one: the gate computes that item's denominator as
    // empty, and an item satisfied the instant it signals still costs a session and a pt budget.
    if (runtimeFlows.some((flow) => flow.nodes.length > 0)) {
      return [];
    }

    // No runtime node carries a tag to slice on — a quest with no flows, none of runtime type, or
    // flows drawn without nodes. One whole-quest item keeps the role owned rather than dropping it.
    return [
      {
        text: textContract.parse(entry.text),
        flowIds: runtimeFlows.map((flow) => flow.id),
        packageNames: [],
      },
    ];
  }

  if (fanOutBy === 'e2e-flow') {
    // Eligibility is read from the SAME list the completion gate narrows this role's denominator
    // with, so a seeded item can never own an empty denominator. Naming the package KINDS rather
    // than any package name is what lets this run in a repo with several UI packages, or none.
    const eligiblePackageTypes = new Set(
      signoffTrackEligibilityStatics.byTrack.groundstomper.packageTypes.map(String),
    );
    // The entry's KIND SET, never its single display label. This is the line the whole file exists
    // for: a package whose hono adapter outranks its widgets folder classifies `http-backend`, and
    // reading that winner alone mints NO item here — zero browser coverage on a green run.
    const packageKindsByName = new Map(
      quest.packagesAffected.map((affected) => [
        String(affected.name),
        questPackageEntryKindsTransformer({ entry: affected }).map(String),
      ]),
    );

    const slices: RelayTailSlice[] = [];

    for (const flow of quest.flows) {
      if (flow.flowType !== 'runtime') {
        continue;
      }

      const reachable = new Map<unknown, PackageName>();
      for (const node of flow.nodes) {
        for (const name of node.packages) {
          const kinds = packageKindsByName.get(String(name));
          if (kinds?.some((kind) => eligiblePackageTypes.has(kind)) === true) {
            reachable.set(String(name), name);
          }
        }
      }

      if (reachable.size === 0) {
        continue;
      }

      slices.push({
        text: textContract.parse(`${entry.text} — flow: ${String(flow.id)}`),
        flowIds: [flow.id],
        packageNames: [...reachable.values()],
      });
    }

    return slices;
  }

  return [{ text: textContract.parse(entry.text), flowIds: [], packageNames: [] }];
};
