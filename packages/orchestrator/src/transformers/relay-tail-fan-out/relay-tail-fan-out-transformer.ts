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
 * USAGE:
 * relayTailFanOutTransformer({ entry: questTypeRegistryStatics.feature.relayTail[1], quest });
 * // Returns one slice per package the quest's runtime nodes tag, plus the seam slice
 */

import { operationItemContract } from '@dungeonmaster/shared/contracts';
import type { FlowId, OperationItem, PackageName, Quest } from '@dungeonmaster/shared/contracts';
import type { questTypeRegistryStatics } from '@dungeonmaster/shared/statics';

import { signoffTrackEligibilityStatics } from '../../statics/signoff-track-eligibility/signoff-track-eligibility-statics';

type RelayTail =
  (typeof questTypeRegistryStatics)[keyof typeof questTypeRegistryStatics]['relayTail'];

type RelayTailEntry = RelayTail extends readonly (infer Entry)[] ? Entry : never;

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

  if (fanOutBy === 'package') {
    const runtimeFlows = quest.flows.filter((flow) => flow.flowType === 'runtime');

    // Eligibility is read from the SAME list the completion gate narrows this role's denominator
    // with, so a seeded item can never own an empty denominator. Naming the package KINDS rather
    // than any package name is what lets this run in a repo with several UI packages, or none.
    const eligiblePackageTypes = new Set(
      signoffTrackEligibilityStatics.byTrack.flowrider.packageTypes.map(String),
    );
    const packageTypeByName = new Map(
      quest.packagesAffected.map((affected) => [
        String(affected.name),
        String(affected.packageType),
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
          const packageType = packageTypeByName.get(String(name));
          return packageType === undefined || eligiblePackageTypes.has(packageType);
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
    const packageTypeByName = new Map(
      quest.packagesAffected.map((affected) => [
        String(affected.name),
        String(affected.packageType),
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
          const packageType = packageTypeByName.get(String(name));
          if (packageType !== undefined && eligiblePackageTypes.has(packageType)) {
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
