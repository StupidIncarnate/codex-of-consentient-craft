import { SignoffStub } from '@dungeonmaster/shared/contracts';

import { qaVerificationUnitContract } from './qa-verification-unit-contract';
import { QaVerificationUnitStub } from './qa-verification-unit.stub';

describe('qaVerificationUnitContract', () => {
  describe('terminal variant', () => {
    it('VALID: {terminal unit} => parses to exactly the terminal fields', () => {
      expect(QaVerificationUnitStub()).toStrictEqual({
        kind: 'terminal',
        id: 'login-flow:terminal:dashboard',
        flowId: 'login-flow',
        nodeId: 'dashboard',
        nodeLabel: 'Dashboard',
      });
    });

    it('VALID: {terminal unit carrying both sign-offs} => both are kept, at the same names the flow uses', () => {
      const signoff = SignoffStub();

      expect(
        qaVerificationUnitContract.parse({
          kind: 'terminal',
          id: 'login-flow:terminal:dashboard',
          flowId: 'login-flow',
          nodeId: 'dashboard',
          nodeLabel: 'Dashboard',
          flowriderSignoff: signoff,
          siegemasterSignoff: signoff,
        }),
      ).toStrictEqual({
        kind: 'terminal',
        id: 'login-flow:terminal:dashboard',
        flowId: 'login-flow',
        nodeId: 'dashboard',
        nodeLabel: 'Dashboard',
        flowriderSignoff: signoff,
        siegemasterSignoff: signoff,
      });
    });

    it('VALID: {terminal unit built from a whole FlowNode} => the node fields the unit does not declare are stripped', () => {
      expect(
        qaVerificationUnitContract.parse({
          id: 'login-flow:terminal:dashboard',
          label: 'Dashboard',
          type: 'state',
          observables: [],
          kind: 'terminal',
          flowId: 'login-flow',
          nodeId: 'dashboard',
          nodeLabel: 'Dashboard',
        }),
      ).toStrictEqual({
        kind: 'terminal',
        id: 'login-flow:terminal:dashboard',
        flowId: 'login-flow',
        nodeId: 'dashboard',
        nodeLabel: 'Dashboard',
      });
    });
  });

  describe('branch variant', () => {
    it('VALID: {branch unit} => carries both endpoints and the edge label', () => {
      expect(
        QaVerificationUnitStub({
          kind: 'branch',
          id: 'login-flow:branch:login-to-dashboard',
          edgeId: 'login-to-dashboard',
          edgeFrom: 'login-page',
          edgeLabel: 'success',
          edgeTo: 'dashboard',
        }),
      ).toStrictEqual({
        kind: 'branch',
        id: 'login-flow:branch:login-to-dashboard',
        flowId: 'login-flow',
        edgeId: 'login-to-dashboard',
        edgeFrom: 'login-page',
        edgeLabel: 'success',
        edgeTo: 'dashboard',
      });
    });

    it('INVALID: {branch unit with an empty edgeLabel} => throws, because an unlabelled edge is not a branch unit', () => {
      expect(() =>
        qaVerificationUnitContract.parse({
          kind: 'branch',
          id: 'login-flow:branch:login-to-dashboard',
          flowId: 'login-flow',
          edgeId: 'login-to-dashboard',
          edgeFrom: 'login-page',
          edgeLabel: '',
          edgeTo: 'dashboard',
        }),
      ).toThrow(/at least 1 character/u);
    });
  });

  describe('observable variant', () => {
    it('VALID: {observable unit} => carries the outcome type, the verbatim description and the provenance', () => {
      expect(
        QaVerificationUnitStub({
          kind: 'observable',
          id: 'login-flow:observable:shows-form',
          nodeId: 'login-page',
          observableId: 'shows-form',
          observableType: 'ui-state',
          observableDescription: 'the login form is on screen',
          addedBy: 'siegemaster',
        }),
      ).toStrictEqual({
        kind: 'observable',
        id: 'login-flow:observable:shows-form',
        flowId: 'login-flow',
        nodeId: 'login-page',
        observableId: 'shows-form',
        observableType: 'ui-state',
        observableDescription: 'the login form is on screen',
        addedBy: 'siegemaster',
      });
    });

    it('EMPTY: {observable unit with a blank description} => still parses, so a spec hole never drops the unit', () => {
      expect(
        QaVerificationUnitStub({
          kind: 'observable',
          id: 'login-flow:observable:shows-form',
          nodeId: 'login-page',
          observableId: 'shows-form',
          observableType: 'ui-state',
          observableDescription: '',
          addedBy: 'spec',
        }),
      ).toStrictEqual({
        kind: 'observable',
        id: 'login-flow:observable:shows-form',
        flowId: 'login-flow',
        nodeId: 'login-page',
        observableId: 'shows-form',
        observableType: 'ui-state',
        observableDescription: '',
        addedBy: 'spec',
      });
    });

    it('INVALID: {observable unit with no addedBy} => throws, because provenance drives track eligibility', () => {
      expect(() =>
        qaVerificationUnitContract.parse({
          kind: 'observable',
          id: 'login-flow:observable:shows-form',
          flowId: 'login-flow',
          nodeId: 'login-page',
          observableId: 'shows-form',
          observableType: 'ui-state',
          observableDescription: 'the login form is on screen',
        }),
      ).toThrow(/Required/u);
    });
  });

  describe('off-map variant', () => {
    it('VALID: {off-map unit} => carries only the family and the sign-offs', () => {
      expect(
        QaVerificationUnitStub({
          kind: 'off-map',
          id: 'login-flow:off-map:perf',
          offMapFamily: 'perf',
        }),
      ).toStrictEqual({
        kind: 'off-map',
        id: 'login-flow:off-map:perf',
        flowId: 'login-flow',
        offMapFamily: 'perf',
      });
    });

    it('INVALID: {off-map unit naming a family that is not a probe family} => throws an enum error', () => {
      expect(() =>
        qaVerificationUnitContract.parse({
          kind: 'off-map',
          id: 'login-flow:off-map:vibes',
          flowId: 'login-flow',
          offMapFamily: 'vibes',
        }),
      ).toThrow(/Invalid enum value/u);
    });
  });

  describe('the discriminator', () => {
    it('INVALID: {kind: "path"} => throws, because a unit is one of exactly four kinds', () => {
      expect(() =>
        qaVerificationUnitContract.parse({
          kind: 'path',
          id: 'login-flow:path:one',
          flowId: 'login-flow',
        }),
      ).toThrow(/Invalid discriminator value/u);
    });

    it('INVALID: {terminal unit with a non-derived id} => throws, because ids follow flowId:kind:localId', () => {
      expect(() =>
        qaVerificationUnitContract.parse({
          kind: 'terminal',
          id: 'dashboard',
          flowId: 'login-flow',
          nodeId: 'dashboard',
          nodeLabel: 'Dashboard',
        }),
      ).toThrow(/Invalid/u);
    });
  });
});
