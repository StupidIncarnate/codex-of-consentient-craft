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

    it('VALID: {observable rewriting its description with legacy sign-off} => returns empty array because sign-off fields are retired', () => {
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

      expect(offenders).toStrictEqual([]);
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
    it('VALID: {node carrying only its id} => returns empty array', () => {
      const input = ModifyQuestInputStub({
        flows: [
          {
            id: 'login-flow',
            nodes: [{ id: 'login' }],
          },
        ] as never,
      });

      const offenders = questSignoffCoupledEditViolationsTransformer({ inputFlows: input.flows! });

      expect(offenders).toStrictEqual([]);
    });

    it('VALID: {node rewriting its label} => returns empty array', () => {
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

    it('VALID: {node retagging its packages} => returns empty array', () => {
      const input = ModifyQuestInputStub({
        flows: [
          {
            id: 'login-flow',
            nodes: [{ id: 'login', packages: ['@dungeonmaster/web'] }],
          },
        ] as never,
      });

      const offenders = questSignoffCoupledEditViolationsTransformer({ inputFlows: input.flows! });

      expect(offenders).toStrictEqual([]);
    });

    it('VALID: {node carrying an observables container} => returns empty array, the batched slice write is the shape a reviewer sends', () => {
      const input = ModifyQuestInputStub({
        flows: [
          {
            id: 'login-flow',
            nodes: [
              {
                id: 'login',
                observables: [{ id: 'redirects' }],
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

    it('VALID: {node rewriting multiple fields} => returns empty array', () => {
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
              },
            ],
          },
        ] as never,
      });

      const offenders = questSignoffCoupledEditViolationsTransformer({ inputFlows: input.flows! });

      expect(offenders).toStrictEqual([]);
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

    it('VALID: {edge rewriting its label with legacy sign-off} => returns empty array because sign-off fields are retired', () => {
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

      expect(offenders).toStrictEqual([]);
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
