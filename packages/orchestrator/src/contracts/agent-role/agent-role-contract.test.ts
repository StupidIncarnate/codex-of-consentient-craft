import { agentRoleContract } from './agent-role-contract';
import { AgentRoleStub } from './agent-role.stub';

describe('agentRoleContract', () => {
  describe('valid roles', () => {
    it('VALID: codeweaver => parses successfully', () => {
      const role = AgentRoleStub({ value: 'codeweaver' });

      const result = agentRoleContract.parse(role);

      expect(result).toBe('codeweaver');
    });

    it('VALID: spiritmender => parses successfully', () => {
      const role = AgentRoleStub({ value: 'spiritmender' });

      const result = agentRoleContract.parse(role);

      expect(result).toBe('spiritmender');
    });

    it('VALID: flowrider => parses successfully', () => {
      const role = AgentRoleStub({ value: 'flowrider' });

      const result = agentRoleContract.parse(role);

      expect(result).toBe('flowrider');
    });

    it('VALID: siegemaster => parses successfully', () => {
      const role = AgentRoleStub({ value: 'siegemaster' });

      const result = agentRoleContract.parse(role);

      expect(result).toBe('siegemaster');
    });

    it('VALID: groundstomper => parses successfully', () => {
      const role = AgentRoleStub({ value: 'groundstomper' });

      const result = agentRoleContract.parse(role);

      expect(result).toBe('groundstomper');
    });

    it('VALID: warpgate => parses successfully', () => {
      const role = AgentRoleStub({ value: 'warpgate' });

      const result = agentRoleContract.parse(role);

      expect(result).toBe('warpgate');
    });

    it('VALID: pesteater => parses successfully', () => {
      const role = AgentRoleStub({ value: 'pesteater' });

      const result = agentRoleContract.parse(role);

      expect(result).toBe('pesteater');
    });
  });

  describe('invalid roles', () => {
    it('INVALID: {unknown role} => throws validation error', () => {
      expect(() => {
        agentRoleContract.parse('unknown_role');
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID: pathseeker => throws validation error (removed role)', () => {
      expect(() => {
        agentRoleContract.parse('pathseeker');
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID: pathseeker-surface => throws validation error (removed role)', () => {
      expect(() => {
        agentRoleContract.parse('pathseeker-surface');
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID: pathseeker-dedup => throws validation error (removed role)', () => {
      expect(() => {
        agentRoleContract.parse('pathseeker-dedup');
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID: pathseeker-assertion-correctness => throws validation error (removed role)', () => {
      expect(() => {
        agentRoleContract.parse('pathseeker-assertion-correctness');
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID: lawbringer => throws validation error (removed role)', () => {
      expect(() => {
        agentRoleContract.parse('lawbringer');
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID: blightscout => throws validation error (removed role)', () => {
      expect(() => {
        agentRoleContract.parse('blightscout');
      }).toThrow(/Invalid enum value/u);
    });

    // The generic minions are parameterized by a discipline their parent hands them, so none can
    // ever hold an operation item of its own.
    it.each(['planner-minion', 'worker-minion', 'reviewer-minion'])(
      'INVALID: %s => throws validation error (a minion is never a dispatchable role)',
      (value) => {
        expect(() => {
          agentRoleContract.parse(value);
        }).toThrow(/Invalid enum value/u);
      },
    );

    it('VALID: {stub default} => defaults to codeweaver', () => {
      const role = AgentRoleStub();

      expect(role).toBe('codeweaver');
    });

    it('INVALID: {number} => throws validation error', () => {
      expect(() => {
        agentRoleContract.parse(123 as never);
      }).toThrow(/Expected/u);
    });

    it('INVALID: {null} => throws validation error', () => {
      expect(() => {
        agentRoleContract.parse(null as never);
      }).toThrow(/Expected/u);
    });

    it('INVALID: {undefined} => throws validation error', () => {
      expect(() => {
        agentRoleContract.parse(undefined as never);
      }).toThrow(/Required/u);
    });

    it('INVALID: {object} => throws validation error', () => {
      expect(() => {
        agentRoleContract.parse({} as never);
      }).toThrow(/Expected/u);
    });
  });
});
