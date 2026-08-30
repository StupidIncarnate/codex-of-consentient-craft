import { ModifyQuestInputStub, SignoffStub } from '@dungeonmaster/shared/contracts';

import { questSignoffCoupledEditViolationsTransformer } from './quest-signoff-coupled-edit-violations-transformer';

describe('questSignoffCoupledEditViolationsTransformer', () => {
  describe('observables', () => {
    it('VALID: {observable carrying a sign-off and only its id} => returns empty array', () => {
      const input = ModifyQuestInputStub({
        flows: [
          {
            id: 'login-flow',
            nodes: [
              {
                id: 'login',
                observables: [{ id: 'redirects', siegemasterSignoff: SignoffStub() }],
              },
            ],
          },
        ] as never,
      });

      const offenders = questSignoffCoupledEditViolationsTransformer({ inputFlows: input.flows! });

      expect(offenders).toStrictEqual([]);
    });

    it("INVALID: {observable signing AND rewriting its description} => rejected, naming 'description'", () => {
      const input = ModifyQuestInputStub({
        flows: [
          {
            id: 'login-flow',
            nodes: [
              {
                id: 'login',
                observables: [
                  {
                    id: 'redirects',
                    description: 'redirects to /home instead',
                    siegemasterSignoff: SignoffStub(),
                  },
                ],
              },
            ],
          },
        ] as never,
      });

      const offenders = questSignoffCoupledEditViolationsTransformer({ inputFlows: input.flows! });

      expect(offenders.map(String)).toStrictEqual([
        "Sign-off on observable 'redirects' on node 'login' in flow 'login-flow' also writes 'description' — an observable carrying a sign-off may carry only its id and its sign-off fields; a sign-off is evidence about the unit as it stands, so one call may not both sign it and rewrite it — send the sign-off and the edit as two separate modify-quest calls",
      ]);
    });

    it('VALID: {observable rewriting its description with NO sign-off} => returns empty array, the additive spec authority is untouched', () => {
      const input = ModifyQuestInputStub({
        flows: [
          {
            id: 'login-flow',
            nodes: [
              {
                id: 'login',
                observables: [{ id: 'redirects', description: 'redirects to /home instead' }],
              },
            ],
          },
        ] as never,
      });

      const offenders = questSignoffCoupledEditViolationsTransformer({ inputFlows: input.flows! });

      expect(offenders).toStrictEqual([]);
    });
  });

  describe('nodes', () => {
    it('VALID: {node carrying a sign-off and only its id} => returns empty array', () => {
      const input = ModifyQuestInputStub({
        flows: [
          {
            id: 'login-flow',
            nodes: [{ id: 'login', flowriderSignoff: SignoffStub() }],
          },
        ] as never,
      });

      const offenders = questSignoffCoupledEditViolationsTransformer({ inputFlows: input.flows! });

      expect(offenders).toStrictEqual([]);
    });

    it("INVALID: {node signing AND rewriting its label} => rejected, naming 'label'", () => {
      const input = ModifyQuestInputStub({
        flows: [
          {
            id: 'login-flow',
            nodes: [{ id: 'login', label: 'Sign In Page', flowriderSignoff: SignoffStub() }],
          },
        ] as never,
      });

      const offenders = questSignoffCoupledEditViolationsTransformer({ inputFlows: input.flows! });

      expect(offenders.map(String)).toStrictEqual([
        "Sign-off on node 'login' in flow 'login-flow' also writes 'label' — a node carrying a sign-off may carry only its id, its sign-off fields and its observables; a sign-off is evidence about the unit as it stands, so one call may not both sign it and rewrite it — send the sign-off and the edit as two separate modify-quest calls",
      ]);
    });

    it("INVALID: {node signing AND retagging its packages} => rejected, naming 'packages'", () => {
      const input = ModifyQuestInputStub({
        flows: [
          {
            id: 'login-flow',
            nodes: [
              { id: 'login', packages: ['@dungeonmaster/web'], flowriderSignoff: SignoffStub() },
            ],
          },
        ] as never,
      });

      const offenders = questSignoffCoupledEditViolationsTransformer({ inputFlows: input.flows! });

      expect(offenders.map(String)).toStrictEqual([
        "Sign-off on node 'login' in flow 'login-flow' also writes 'packages' — a node carrying a sign-off may carry only its id, its sign-off fields and its observables; a sign-off is evidence about the unit as it stands, so one call may not both sign it and rewrite it — send the sign-off and the edit as two separate modify-quest calls",
      ]);
    });

    it('VALID: {node carrying a sign-off AND an observables container} => returns empty array, the batched slice write is the shape a reviewer sends', () => {
      const input = ModifyQuestInputStub({
        flows: [
          {
            id: 'login-flow',
            nodes: [
              {
                id: 'login',
                flowriderSignoff: SignoffStub(),
                observables: [{ id: 'redirects', flowriderSignoff: SignoffStub() }],
              },
            ],
          },
        ] as never,
      });

      const offenders = questSignoffCoupledEditViolationsTransformer({ inputFlows: input.flows! });

      expect(offenders).toStrictEqual([]);
    });

    it('VALID: {node rewriting its label with NO sign-off} => returns empty array', () => {
      const input = ModifyQuestInputStub({
        flows: [
          {
            id: 'login-flow',
            nodes: [{ id: 'login', label: 'Sign In Page' }],
          },
        ] as never,
      });

      const offenders = questSignoffCoupledEditViolationsTransformer({ inputFlows: input.flows! });

      expect(offenders).toStrictEqual([]);
    });

    it('INVALID: {node signing while rewriting TWO fields} => every offending key is named, so one round trip reports the whole coupling', () => {
      const input = ModifyQuestInputStub({
        flows: [
          {
            id: 'login-flow',
            nodes: [
              {
                id: 'login',
                label: 'Sign In Page',
                type: 'state',
                packages: ['@dungeonmaster/web'],
                flowriderSignoff: SignoffStub(),
              },
            ],
          },
        ] as never,
      });

      const offenders = questSignoffCoupledEditViolationsTransformer({ inputFlows: input.flows! });

      expect(offenders.map(String)).toStrictEqual([
        "Sign-off on node 'login' in flow 'login-flow' also writes 'label' — a node carrying a sign-off may carry only its id, its sign-off fields and its observables; a sign-off is evidence about the unit as it stands, so one call may not both sign it and rewrite it — send the sign-off and the edit as two separate modify-quest calls",
        "Sign-off on node 'login' in flow 'login-flow' also writes 'type' — a node carrying a sign-off may carry only its id, its sign-off fields and its observables; a sign-off is evidence about the unit as it stands, so one call may not both sign it and rewrite it — send the sign-off and the edit as two separate modify-quest calls",
        "Sign-off on node 'login' in flow 'login-flow' also writes 'packages' — a node carrying a sign-off may carry only its id, its sign-off fields and its observables; a sign-off is evidence about the unit as it stands, so one call may not both sign it and rewrite it — send the sign-off and the edit as two separate modify-quest calls",
      ]);
    });
  });

  describe('edges', () => {
    it('VALID: {edge carrying a sign-off and only its id} => returns empty array', () => {
      const input = ModifyQuestInputStub({
        flows: [
          {
            id: 'login-flow',
            edges: [{ id: 'login-to-dashboard', siegemasterSignoff: SignoffStub() }],
          },
        ] as never,
      });

      const offenders = questSignoffCoupledEditViolationsTransformer({ inputFlows: input.flows! });

      expect(offenders).toStrictEqual([]);
    });

    it("INVALID: {edge signing AND rewriting its label} => rejected, naming 'label'", () => {
      const input = ModifyQuestInputStub({
        flows: [
          {
            id: 'login-flow',
            edges: [
              { id: 'login-to-dashboard', label: 'failure', siegemasterSignoff: SignoffStub() },
            ],
          },
        ] as never,
      });

      const offenders = questSignoffCoupledEditViolationsTransformer({ inputFlows: input.flows! });

      expect(offenders.map(String)).toStrictEqual([
        "Sign-off on edge 'login-to-dashboard' in flow 'login-flow' also writes 'label' — an edge carrying a sign-off may carry only its id and its sign-off fields; a sign-off is evidence about the unit as it stands, so one call may not both sign it and rewrite it — send the sign-off and the edit as two separate modify-quest calls",
      ]);
    });

    it('VALID: {edge rewriting its label with NO sign-off} => returns empty array', () => {
      const input = ModifyQuestInputStub({
        flows: [
          {
            id: 'login-flow',
            edges: [{ id: 'login-to-dashboard', label: 'failure' }],
          },
        ] as never,
      });

      const offenders = questSignoffCoupledEditViolationsTransformer({ inputFlows: input.flows! });

      expect(offenders).toStrictEqual([]);
    });
  });

  describe('nothing to inspect', () => {
    it('EMPTY: {no flows in the payload} => returns empty array', () => {
      const offenders = questSignoffCoupledEditViolationsTransformer({ inputFlows: [] });

      expect(offenders).toStrictEqual([]);
    });

    it('EMPTY: {flow patch carrying neither nodes nor edges} => returns empty array', () => {
      const input = ModifyQuestInputStub({
        flows: [{ id: 'login-flow', name: 'Login Flow' }] as never,
      });

      const offenders = questSignoffCoupledEditViolationsTransformer({ inputFlows: input.flows! });

      expect(offenders).toStrictEqual([]);
    });
  });
});
