import {
  FlowEdgeStub,
  FlowNodeStub,
  FlowObservableStub,
  FlowStub,
  PackageNameStub,
  QuestPackageEntryStub,
} from '@dungeonmaster/shared/contracts';

import { qaUnitEnumerateTransformer } from '../qa-unit-enumerate/qa-unit-enumerate-transformer';
import { qaUnitsInPackageScopeTransformer } from './qa-units-in-package-scope-transformer';

// Two packages of DIFFERENT kinds, so the kind narrowing and the name narrowing can be told apart:
// `ui-app` is browser-reachable and `api-service` is not.
const UI_PACKAGE = PackageNameStub({ value: 'ui-app' });
const API_PACKAGE = PackageNameStub({ value: 'api-service' });
const GHOST_PACKAGE = PackageNameStub({ value: 'ghost-package' });
const UNUSED_PACKAGE = PackageNameStub({ value: 'unused-package' });

const PACKAGES_AFFECTED = [
  QuestPackageEntryStub({
    name: UI_PACKAGE,
    location: `./packages/${UI_PACKAGE}`,
    changeType: 'edit',
    packageType: 'frontend-react',
  }),
  QuestPackageEntryStub({
    name: API_PACKAGE,
    location: `./packages/${API_PACKAGE}`,
    changeType: 'edit',
    packageType: 'http-backend',
  }),
];

// One flow carrying every routing case: a UI-only node with an observable, a GLUE node tagged with
// both packages, an API-only terminal, a terminal tagged with a package `packagesAffected` never
// declares, and a labelled edge leaving a node the flow does not carry.
const FLOW = FlowStub({
  id: 'login-flow',
  flowType: 'runtime',
  nodes: [
    FlowNodeStub({
      id: 'login-form',
      label: 'Login form',
      packages: [UI_PACKAGE],
      observables: [FlowObservableStub({ id: 'shows-form' })],
    }),
    FlowNodeStub({
      id: 'submit-credentials',
      label: 'Submit credentials',
      type: 'decision',
      packages: [UI_PACKAGE, API_PACKAGE],
    }),
    FlowNodeStub({ id: 'auth-error', label: 'Auth error', packages: [API_PACKAGE] }),
    FlowNodeStub({ id: 'ghost-screen', label: 'Ghost screen', packages: [GHOST_PACKAGE] }),
  ],
  edges: [
    FlowEdgeStub({ id: 'open-form', from: 'login-form', to: 'submit-credentials' }),
    FlowEdgeStub({
      id: 'submit-invalid',
      from: 'submit-credentials',
      to: 'auth-error',
      label: 'credentials invalid',
    }),
    FlowEdgeStub({
      id: 'to-ghost',
      from: 'submit-credentials',
      to: 'ghost-screen',
      label: 'unknown route',
    }),
    FlowEdgeStub({
      id: 'orphan-branch',
      from: 'node-that-was-deleted',
      to: 'auth-error',
      label: 'session valid',
    }),
  ],
});

const UNITS = qaUnitEnumerateTransformer({ flow: FLOW });

// Everything that hangs off no resolvable node — the off-map families and the orphan branch. They
// are over-included on purpose: excluding a unit whose owning node cannot be read would empty a
// denominator on incomplete data, which is the one failure this narrowing must not cause.
const UNROUTABLE_UNIT_IDS = UNITS.map((unit) => String(unit.id)).filter(
  (id) => id.split(':')[1] === 'off-map' || id === 'login-flow:branch:orphan-branch',
);

describe('qaUnitsInPackageScopeTransformer', () => {
  describe('no narrowing asked for', () => {
    it('EMPTY: {no packagesAffected, no packageNames} => every unit stays, so an untagged quest is narrowed by nothing', () => {
      expect(
        qaUnitsInPackageScopeTransformer({
          flow: FLOW,
          units: UNITS,
          track: 'flowrider',
        }).map((unit) => String(unit.id)),
      ).toStrictEqual(UNITS.map((unit) => String(unit.id)));
    });
  });

  describe('narrowing by the track’s package KINDS', () => {
    it('VALID: {flowrider, packagesAffected} => drops the UI-only observable and keeps the glue, the backend and the unresolvable', () => {
      expect(
        qaUnitsInPackageScopeTransformer({
          flow: FLOW,
          units: UNITS,
          track: 'flowrider',
          packagesAffected: PACKAGES_AFFECTED,
        }).map((unit) => String(unit.id)),
      ).toStrictEqual([
        'login-flow:terminal:auth-error',
        'login-flow:terminal:ghost-screen',
        'login-flow:branch:submit-invalid',
        'login-flow:branch:to-ghost',
        'login-flow:branch:orphan-branch',
        ...UNROUTABLE_UNIT_IDS.filter((id) => id.split(':')[1] === 'off-map'),
      ]);
    });

    it('VALID: {groundstomper, packagesAffected} => keeps the UI observable and the glue, and drops the backend terminal', () => {
      expect(
        qaUnitsInPackageScopeTransformer({
          flow: FLOW,
          units: UNITS,
          track: 'groundstomper',
          packagesAffected: PACKAGES_AFFECTED,
        }).map((unit) => String(unit.id)),
      ).toStrictEqual([
        'login-flow:terminal:ghost-screen',
        'login-flow:branch:submit-invalid',
        'login-flow:branch:to-ghost',
        'login-flow:branch:orphan-branch',
        'login-flow:observable:shows-form',
        ...UNROUTABLE_UNIT_IDS.filter((id) => id.split(':')[1] === 'off-map'),
      ]);
    });

    it('VALID: {a node tagged with a package packagesAffected never declares} => stays on both authoring tracks, because an unresolvable kind must not empty a denominator', () => {
      expect({
        flowrider: qaUnitsInPackageScopeTransformer({
          flow: FLOW,
          units: UNITS,
          track: 'flowrider',
          packagesAffected: PACKAGES_AFFECTED,
        })
          .map((unit) => String(unit.id))
          .filter((id) => id === 'login-flow:terminal:ghost-screen'),
        groundstomper: qaUnitsInPackageScopeTransformer({
          flow: FLOW,
          units: UNITS,
          track: 'groundstomper',
          packagesAffected: PACKAGES_AFFECTED,
        })
          .map((unit) => String(unit.id))
          .filter((id) => id === 'login-flow:terminal:ghost-screen'),
      }).toStrictEqual({
        flowrider: ['login-flow:terminal:ghost-screen'],
        groundstomper: ['login-flow:terminal:ghost-screen'],
      });
    });
  });

  describe('partition scope — one name is a per-package slice, more than one is the seam slice', () => {
    it('VALID: {flowrider, packageNames: [api-service]} => owns the units whose node tags that package ALONE, never the glue', () => {
      expect(
        qaUnitsInPackageScopeTransformer({
          flow: FLOW,
          units: UNITS,
          track: 'flowrider',
          packageNames: [API_PACKAGE],
        }).map((unit) => String(unit.id)),
      ).toStrictEqual(['login-flow:terminal:auth-error', ...UNROUTABLE_UNIT_IDS]);
    });

    it('VALID: {flowrider, packageNames: [ui-app]} => owns the UI-only node’s observable and nothing the glue node holds', () => {
      expect(
        qaUnitsInPackageScopeTransformer({
          flow: FLOW,
          units: UNITS,
          track: 'flowrider',
          packageNames: [UI_PACKAGE],
        }).map((unit) => String(unit.id)),
      ).toStrictEqual([
        'login-flow:branch:orphan-branch',
        'login-flow:observable:shows-form',
        ...UNROUTABLE_UNIT_IDS.filter((id) => id.split(':')[1] === 'off-map'),
      ]);
    });

    it('VALID: {flowrider, packageNames: [ui-app, api-service]} => the SEAM slice: the glue node’s branches and no single-tagged unit at all', () => {
      expect(
        qaUnitsInPackageScopeTransformer({
          flow: FLOW,
          units: UNITS,
          track: 'flowrider',
          packageNames: [UI_PACKAGE, API_PACKAGE],
        }).map((unit) => String(unit.id)),
      ).toStrictEqual([
        'login-flow:branch:submit-invalid',
        'login-flow:branch:to-ghost',
        ...UNROUTABLE_UNIT_IDS,
      ]);
    });

    it('VALID: {flowrider, packageNames naming a package no node tags alone} => owns nothing routable, rather than falling back to the whole flow', () => {
      expect(
        qaUnitsInPackageScopeTransformer({
          flow: FLOW,
          units: UNITS,
          track: 'flowrider',
          packageNames: [UNUSED_PACKAGE],
        }).map((unit) => String(unit.id)),
      ).toStrictEqual(UNROUTABLE_UNIT_IDS);
    });
  });

  describe('intersection scope — an item owns every unit its packages touch, glue included', () => {
    it('VALID: {groundstomper, packageNames: [ui-app]} => keeps the glue node’s branches, because there is no groundstomper seam item to catch them', () => {
      expect(
        qaUnitsInPackageScopeTransformer({
          flow: FLOW,
          units: UNITS,
          track: 'groundstomper',
          packageNames: [UI_PACKAGE],
        }).map((unit) => String(unit.id)),
      ).toStrictEqual([
        'login-flow:branch:submit-invalid',
        'login-flow:branch:to-ghost',
        'login-flow:branch:orphan-branch',
        'login-flow:observable:shows-form',
        ...UNROUTABLE_UNIT_IDS.filter((id) => id.split(':')[1] === 'off-map'),
      ]);
    });

    it('VALID: {siegemaster, packageNames: [api-service]} => keeps the glue too, so the union of an intersecting track’s items never loses a seam unit', () => {
      expect(
        qaUnitsInPackageScopeTransformer({
          flow: FLOW,
          units: UNITS,
          track: 'siegemaster',
          packageNames: [API_PACKAGE],
        }).map((unit) => String(unit.id)),
      ).toStrictEqual([
        'login-flow:terminal:auth-error',
        'login-flow:branch:submit-invalid',
        'login-flow:branch:to-ghost',
        ...UNROUTABLE_UNIT_IDS,
      ]);
    });

    it('VALID: {siegemaster, packageNames matching no node} => owns only what hangs off no node', () => {
      expect(
        qaUnitsInPackageScopeTransformer({
          flow: FLOW,
          units: UNITS,
          track: 'siegemaster',
          packageNames: [UNUSED_PACKAGE],
        }).map((unit) => String(unit.id)),
      ).toStrictEqual(UNROUTABLE_UNIT_IDS);
    });
  });

  describe('the two narrowings compose', () => {
    it('VALID: {flowrider, packagesAffected AND packageNames: [ui-app]} => the kind narrowing removes the UI observable the name narrowing selected, leaving nothing routable', () => {
      expect(
        qaUnitsInPackageScopeTransformer({
          flow: FLOW,
          units: UNITS,
          track: 'flowrider',
          packagesAffected: PACKAGES_AFFECTED,
          packageNames: [UI_PACKAGE],
        }).map((unit) => String(unit.id)),
      ).toStrictEqual(UNROUTABLE_UNIT_IDS);
    });
  });
});
