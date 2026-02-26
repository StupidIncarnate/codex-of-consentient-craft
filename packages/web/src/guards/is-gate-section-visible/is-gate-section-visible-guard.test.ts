import { QuestStatusStub } from '@dungeonmaster/shared/contracts';

import { GateSectionKeyStub } from '../../contracts/gate-section-key/gate-section-key.stub';
import { isGateSectionVisibleGuard } from './is-gate-section-visible-guard';

describe('isGateSectionVisibleGuard', () => {
  describe('created status', () => {
    it('VALID: {status: created, section: flows} => returns true', () => {
      const status = QuestStatusStub({ value: 'created' });
      const section = GateSectionKeyStub({ value: 'flows' });

      const result = isGateSectionVisibleGuard({ status, section });

      expect(result).toBe(true);
    });

    it('VALID: {status: created, section: designDecisions} => returns true', () => {
      const status = QuestStatusStub({ value: 'created' });
      const section = GateSectionKeyStub({ value: 'designDecisions' });

      const result = isGateSectionVisibleGuard({ status, section });

      expect(result).toBe(true);
    });

    it('VALID: {status: created, section: requirements} => returns false', () => {
      const status = QuestStatusStub({ value: 'created' });
      const section = GateSectionKeyStub({ value: 'requirements' });

      const result = isGateSectionVisibleGuard({ status, section });

      expect(result).toBe(false);
    });

    it('VALID: {status: created, section: observables} => returns false', () => {
      const status = QuestStatusStub({ value: 'created' });
      const section = GateSectionKeyStub({ value: 'observables' });

      const result = isGateSectionVisibleGuard({ status, section });

      expect(result).toBe(false);
    });
  });

  describe('pending status', () => {
    it('VALID: {status: pending, section: flows} => returns true', () => {
      const status = QuestStatusStub({ value: 'pending' });
      const section = GateSectionKeyStub({ value: 'flows' });

      const result = isGateSectionVisibleGuard({ status, section });

      expect(result).toBe(true);
    });

    it('VALID: {status: pending, section: contracts} => returns false', () => {
      const status = QuestStatusStub({ value: 'pending' });
      const section = GateSectionKeyStub({ value: 'contracts' });

      const result = isGateSectionVisibleGuard({ status, section });

      expect(result).toBe(false);
    });
  });

  describe('flows_approved status', () => {
    it('VALID: {status: flows_approved, section: requirements} => returns true', () => {
      const status = QuestStatusStub({ value: 'flows_approved' });
      const section = GateSectionKeyStub({ value: 'requirements' });

      const result = isGateSectionVisibleGuard({ status, section });

      expect(result).toBe(true);
    });

    it('VALID: {status: flows_approved, section: flows} => returns true', () => {
      const status = QuestStatusStub({ value: 'flows_approved' });
      const section = GateSectionKeyStub({ value: 'flows' });

      const result = isGateSectionVisibleGuard({ status, section });

      expect(result).toBe(true);
    });

    it('VALID: {status: flows_approved, section: observables} => returns false', () => {
      const status = QuestStatusStub({ value: 'flows_approved' });
      const section = GateSectionKeyStub({ value: 'observables' });

      const result = isGateSectionVisibleGuard({ status, section });

      expect(result).toBe(false);
    });
  });

  describe('requirements_approved status', () => {
    it('VALID: {status: requirements_approved, section: contexts} => returns true', () => {
      const status = QuestStatusStub({ value: 'requirements_approved' });
      const section = GateSectionKeyStub({ value: 'contexts' });

      const result = isGateSectionVisibleGuard({ status, section });

      expect(result).toBe(true);
    });

    it('VALID: {status: requirements_approved, section: observables} => returns true', () => {
      const status = QuestStatusStub({ value: 'requirements_approved' });
      const section = GateSectionKeyStub({ value: 'observables' });

      const result = isGateSectionVisibleGuard({ status, section });

      expect(result).toBe(true);
    });

    it('VALID: {status: requirements_approved, section: contracts} => returns true', () => {
      const status = QuestStatusStub({ value: 'requirements_approved' });
      const section = GateSectionKeyStub({ value: 'contracts' });

      const result = isGateSectionVisibleGuard({ status, section });

      expect(result).toBe(true);
    });

    it('VALID: {status: requirements_approved, section: toolingRequirements} => returns true', () => {
      const status = QuestStatusStub({ value: 'requirements_approved' });
      const section = GateSectionKeyStub({ value: 'toolingRequirements' });

      const result = isGateSectionVisibleGuard({ status, section });

      expect(result).toBe(true);
    });
  });

  describe('approved and beyond', () => {
    it('VALID: {status: approved, section: toolingRequirements} => returns true', () => {
      const status = QuestStatusStub({ value: 'approved' });
      const section = GateSectionKeyStub({ value: 'toolingRequirements' });

      const result = isGateSectionVisibleGuard({ status, section });

      expect(result).toBe(true);
    });

    it('VALID: {status: in_progress, section: observables} => returns true', () => {
      const status = QuestStatusStub({ value: 'in_progress' });
      const section = GateSectionKeyStub({ value: 'observables' });

      const result = isGateSectionVisibleGuard({ status, section });

      expect(result).toBe(true);
    });

    it('VALID: {status: complete, section: flows} => returns true', () => {
      const status = QuestStatusStub({ value: 'complete' });
      const section = GateSectionKeyStub({ value: 'flows' });

      const result = isGateSectionVisibleGuard({ status, section });

      expect(result).toBe(true);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {status undefined} => returns false', () => {
      const section = GateSectionKeyStub({ value: 'flows' });

      const result = isGateSectionVisibleGuard({ section });

      expect(result).toBe(false);
    });

    it('EMPTY: {section undefined} => returns false', () => {
      const status = QuestStatusStub({ value: 'created' });

      const result = isGateSectionVisibleGuard({ status });

      expect(result).toBe(false);
    });

    it('EMPTY: {both undefined} => returns false', () => {
      const result = isGateSectionVisibleGuard({});

      expect(result).toBe(false);
    });
  });
});
