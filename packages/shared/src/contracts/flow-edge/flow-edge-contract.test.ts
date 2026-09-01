import { flowEdgeContract } from './flow-edge-contract';
import { FlowEdgeStub } from './flow-edge.stub';
import { SignoffStub } from '../signoff/signoff.stub';

describe('flowEdgeContract', () => {
  describe('valid edges', () => {
    it('VALID: {id, from, to} => parses successfully', () => {
      const edge = FlowEdgeStub();

      expect(edge).toStrictEqual({
        id: 'login-to-dashboard',
        from: 'login-page',
        to: 'dashboard',
      });
    });

    it('VALID: {with label} => parses with label', () => {
      const edge = FlowEdgeStub({ label: 'on success' });

      expect(edge).toStrictEqual({
        id: 'login-to-dashboard',
        from: 'login-page',
        to: 'dashboard',
        label: 'on success',
      });
    });

    it('VALID: {cross-flow refs} => parses cross-flow edge', () => {
      const edge = FlowEdgeStub({
        id: 'cross-flow-edge',
        from: 'login-flow:end',
        to: 'dashboard-flow:start',
      });

      expect(edge).toStrictEqual({
        id: 'cross-flow-edge',
        from: 'login-flow:end',
        to: 'dashboard-flow:start',
      });
    });
  });

  describe('track sign-offs', () => {
    it('VALID: {siegemasterSignoff only} => keeps the flowrider field absent rather than nulled', () => {
      const edge = FlowEdgeStub({
        siegemasterSignoff: SignoffStub({
          verdict: 'unconfirmable',
          evidence: 'the success transition needs a real credential this session cannot mint',
          toSettle: 'Seed a session cookie, then walk the success edge and read the redirect.',
        }),
      });

      expect(edge).toStrictEqual({
        id: 'login-to-dashboard',
        from: 'login-page',
        to: 'dashboard',
        siegemasterSignoff: {
          verdict: 'unconfirmable',
          evidence: 'the success transition needs a real credential this session cannot mint',
          toSettle: 'Seed a session cookie, then walk the success edge and read the redirect.',
          workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          at: '2026-01-01T00:00:00.000Z',
        },
      });
    });

    it('VALID: {both sign-offs present} => parses each track onto its own top-level field', () => {
      const edge = FlowEdgeStub({
        flowriderSignoff: SignoffStub(),
        siegemasterSignoff: SignoffStub({
          evidence: 'clicking submit landed the browser on /dashboard',
          workItemId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
          at: '2026-01-02T00:00:00.000Z',
        }),
      });

      expect(edge).toStrictEqual({
        id: 'login-to-dashboard',
        from: 'login-page',
        to: 'dashboard',
        flowriderSignoff: {
          verdict: 'confirmed',
          evidence:
            'packages/x/src/a-transformer.test.ts:42 — flips to red when the guard returns true',
          workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          at: '2026-01-01T00:00:00.000Z',
        },
        siegemasterSignoff: {
          verdict: 'confirmed',
          evidence: 'clicking submit landed the browser on /dashboard',
          workItemId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
          at: '2026-01-02T00:00:00.000Z',
        },
      });
    });
  });

  describe('invalid edges', () => {
    it('INVALID: {from: ""} => throws validation error', () => {
      expect(() => {
        flowEdgeContract.parse({
          id: 'test-edge',
          from: '',
          to: 'dashboard',
        });
      }).toThrow(/too_small/u);
    });

    it('INVALID: {to: ""} => throws validation error', () => {
      expect(() => {
        flowEdgeContract.parse({
          id: 'test-edge',
          from: 'login-page',
          to: '',
        });
      }).toThrow(/too_small/u);
    });

    it('INVALID: {missing required fields} => throws validation error', () => {
      expect(() => {
        flowEdgeContract.parse({});
      }).toThrow(/Required/u);
    });
  });
});
