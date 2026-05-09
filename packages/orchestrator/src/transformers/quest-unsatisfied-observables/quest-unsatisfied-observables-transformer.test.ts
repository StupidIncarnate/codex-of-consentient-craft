import {
  DependencyStepStub,
  FlowNodeStub,
  FlowObservableStub,
  FlowStub,
  StepAssertionStub,
} from '@dungeonmaster/shared/contracts';

import { questUnsatisfiedObservablesTransformer } from './quest-unsatisfied-observables-transformer';

describe('questUnsatisfiedObservablesTransformer', () => {
  describe('full coverage', () => {
    it('VALID: {every observable claimed by a mix of step-level and assertion-level coverage} => returns []', () => {
      const flows = [
        FlowStub({
          id: 'login-flow' as never,
          nodes: [
            FlowNodeStub({
              id: 'login-page' as never,
              observables: [
                FlowObservableStub({ id: 'login-redirects-to-dashboard' as never }),
                FlowObservableStub({ id: 'login-shows-error-on-invalid' as never }),
              ],
            }),
            FlowNodeStub({
              id: 'dashboard-page' as never,
              observables: [FlowObservableStub({ id: 'dashboard-renders-greeting' as never })],
            }),
          ],
        }),
      ];
      const steps = [
        DependencyStepStub({
          id: 'backend-create-login' as never,
          observablesSatisfied: ['login-redirects-to-dashboard' as never],
          assertions: [
            StepAssertionStub({
              prefix: 'VALID',
              input: '{valid creds}',
              expected: 'returns session',
              observablesSatisfied: ['dashboard-renders-greeting' as never],
            }),
          ],
        }),
        DependencyStepStub({
          id: 'backend-validate-login' as never,
          observablesSatisfied: [],
          assertions: [
            StepAssertionStub({
              prefix: 'INVALID',
              field: 'password' as never,
              input: '{invalid creds}',
              expected: 'rejects with error',
              observablesSatisfied: ['login-shows-error-on-invalid' as never],
            }),
          ],
        }),
      ];

      const result = questUnsatisfiedObservablesTransformer({ flows, steps });

      expect(result).toStrictEqual([]);
    });
  });

  describe('missing coverage', () => {
    it('INVALID: {observable claimed by no step and no assertion} => returns offender citing flow id and node id', () => {
      const flows = [
        FlowStub({
          id: 'login-flow' as never,
          nodes: [
            FlowNodeStub({
              id: 'login-page' as never,
              observables: [FlowObservableStub({ id: 'login-redirects-to-dashboard' as never })],
            }),
          ],
        }),
      ];
      const steps = [
        DependencyStepStub({
          id: 'backend-create-login' as never,
          observablesSatisfied: [],
          assertions: [
            StepAssertionStub({
              prefix: 'VALID',
              input: '{valid creds}',
              expected: 'returns session',
            }),
          ],
        }),
      ];

      const result = questUnsatisfiedObservablesTransformer({ flows, steps });

      expect(result).toStrictEqual([
        "observable 'login-redirects-to-dashboard' (flow 'login-flow', node 'login-page') is not claimed by any step.observablesSatisfied or step.assertions[].observablesSatisfied",
      ]);
    });
  });

  describe('coverage source variants', () => {
    it('EDGE: {observable covered ONLY at assertion level} => returns []', () => {
      const flows = [
        FlowStub({
          id: 'login-flow' as never,
          nodes: [
            FlowNodeStub({
              id: 'login-page' as never,
              observables: [FlowObservableStub({ id: 'login-redirects-to-dashboard' as never })],
            }),
          ],
        }),
      ];
      const steps = [
        DependencyStepStub({
          id: 'backend-create-login' as never,
          observablesSatisfied: [],
          assertions: [
            StepAssertionStub({
              prefix: 'VALID',
              input: '{valid creds}',
              expected: 'returns session',
              observablesSatisfied: ['login-redirects-to-dashboard' as never],
            }),
          ],
        }),
      ];

      const result = questUnsatisfiedObservablesTransformer({ flows, steps });

      expect(result).toStrictEqual([]);
    });

    it('EDGE: {observable covered ONLY at step level} => returns []', () => {
      const flows = [
        FlowStub({
          id: 'login-flow' as never,
          nodes: [
            FlowNodeStub({
              id: 'login-page' as never,
              observables: [FlowObservableStub({ id: 'login-redirects-to-dashboard' as never })],
            }),
          ],
        }),
      ];
      const steps = [
        DependencyStepStub({
          id: 'backend-create-login' as never,
          observablesSatisfied: ['login-redirects-to-dashboard' as never],
          assertions: [
            StepAssertionStub({
              prefix: 'VALID',
              input: '{valid creds}',
              expected: 'returns session',
            }),
          ],
        }),
      ];

      const result = questUnsatisfiedObservablesTransformer({ flows, steps });

      expect(result).toStrictEqual([]);
    });
  });

  describe('edge cases', () => {
    it('EDGE: {flow has no observables on any node} => returns []', () => {
      const flows = [
        FlowStub({
          id: 'login-flow' as never,
          nodes: [
            FlowNodeStub({ id: 'login-page' as never, observables: [] }),
            FlowNodeStub({ id: 'dashboard-page' as never, observables: [] }),
          ],
        }),
      ];
      const steps = [
        DependencyStepStub({
          id: 'backend-create-login' as never,
          observablesSatisfied: [],
          assertions: [
            StepAssertionStub({
              prefix: 'VALID',
              input: '{valid creds}',
              expected: 'returns session',
            }),
          ],
        }),
      ];

      const result = questUnsatisfiedObservablesTransformer({ flows, steps });

      expect(result).toStrictEqual([]);
    });
  });

  describe('empty', () => {
    it('EMPTY: {flows: undefined, steps: undefined} => returns []', () => {
      const result = questUnsatisfiedObservablesTransformer({});

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {flows: []} => returns []', () => {
      const result = questUnsatisfiedObservablesTransformer({ flows: [], steps: [] });

      expect(result).toStrictEqual([]);
    });
  });
});
