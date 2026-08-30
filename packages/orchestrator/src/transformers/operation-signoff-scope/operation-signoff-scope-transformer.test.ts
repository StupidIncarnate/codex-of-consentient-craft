import {
  FlowStub,
  OperationItemStub,
  PackageNameStub,
  QuestStub,
} from '@dungeonmaster/shared/contracts';

import { operationSignoffScopeTransformer } from './operation-signoff-scope-transformer';

const RUNTIME_A = FlowStub({ id: 'runtime-a', flowType: 'runtime' });
const RUNTIME_B = FlowStub({ id: 'runtime-b', flowType: 'runtime' });
const OPERATIONAL = FlowStub({ id: 'operational-a', flowType: 'operational' });

const quest = QuestStub({ flows: [RUNTIME_A, RUNTIME_B, OPERATIONAL] });

const scopeFor = ({
  role,
  flowIds = [],
  packageNames = [],
}: {
  role: string;
  flowIds?: string[];
  packageNames?: string[];
}): ReturnType<typeof operationSignoffScopeTransformer> =>
  operationSignoffScopeTransformer({
    quest,
    operationItem: OperationItemStub({ role, flowIds, packageNames }),
  });

describe('operationSignoffScopeTransformer', () => {
  // Every track reads `flowScope: 'declared'` — one item per flow (or, for codeweaver, one item per
  // PACKAGE carrying every flow it tags a node in) — so the item's own `flowIds` list IS its scope
  // and a sibling item's flow is never in it.
  describe("declared tracks — the item's own flow list is the scope", () => {
    it.each(['codeweaver', 'flowrider', 'siegemaster'] as const)(
      'VALID: {role: %s, flowIds: [runtime-a]} => that flow alone',
      (role) => {
        const scope = scopeFor({ role, flowIds: ['runtime-a'] });

        expect({
          track: scope?.track,
          flowIds: scope?.flows.map((flow) => String(flow.id)),
        }).toStrictEqual({ track: role, flowIds: ['runtime-a'] });
      },
    );

    // Flowrider's `flowTypes` carries `runtime` alone — an operational flow's end state is
    // hand-checked rather than asserted by a suite, so a declared operational flow is dropped for
    // failing the type test, not for being undeclared.
    it('VALID: {role: flowrider, flowIds: [runtime-a, operational-a]} => the operational flow is dropped, ineligible type', () => {
      const scope = scopeFor({ role: 'flowrider', flowIds: ['runtime-a', 'operational-a'] });

      expect(scope?.flows.map((flow) => String(flow.id))).toStrictEqual(['runtime-a']);
    });

    // Siegemaster's `flowTypes` carries BOTH types — an operational flow's end state is hand-checked
    // rather than asserted by a suite, so it is the one track measured over them.
    it('VALID: {role: siegemaster, flowIds: [operational-a]} => the operational flow is in scope', () => {
      const scope = scopeFor({ role: 'siegemaster', flowIds: ['operational-a'] });

      expect({
        track: scope?.track,
        flowIds: scope?.flows.map((flow) => String(flow.id)),
      }).toStrictEqual({ track: 'siegemaster', flowIds: ['operational-a'] });
    });

    // A declared-track item that names no flow matches nothing, with no special case anywhere —
    // an empty scope is a valid, honest answer, not an error.
    it('EMPTY: {role: siegemaster, flowIds: []} => no flows in scope', () => {
      const scope = scopeFor({ role: 'siegemaster' });

      expect(scope?.flows).toStrictEqual([]);
    });
  });

  // `null` is the honest answer, not an error: these roles are measured on something other than the
  // flow graph, and both callers rely on being able to tell that apart from "measured, found empty".
  describe('roles with no sign-off track', () => {
    it.each(['spiritmender', 'warpgate'] as const)('VALID: {role: %s} => null', (role) => {
      expect(scopeFor({ role })).toBe(null);
    });
  });

  // The property the whole extraction exists for: the package slice is taken FROM THE ITEM, never
  // from a caller argument. An omitted `packageNames` used to widen the measurement to the whole
  // quest silently, because the tool's parameter was optional and the gate's was not.
  it('VALID: {item packageNames} => ride through verbatim rather than being supplied by a caller', () => {
    const scope = scopeFor({
      role: 'siegemaster',
      flowIds: ['runtime-a'],
      packageNames: ['web', 'server'],
    });

    expect(scope?.packageNames.map(String)).toStrictEqual([
      String(PackageNameStub({ value: 'web' })),
      String(PackageNameStub({ value: 'server' })),
    ]);
  });
});
