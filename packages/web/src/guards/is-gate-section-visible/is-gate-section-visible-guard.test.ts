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

    it('VALID: {status: created, section: contracts} => returns false', () => {
      const status = QuestStatusStub({ value: 'created' });
      const section = GateSectionKeyStub({ value: 'contracts' });

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
    it('VALID: {status: flows_approved, section: contracts} => returns true', () => {
      const status = QuestStatusStub({ value: 'flows_approved' });
      const section = GateSectionKeyStub({ value: 'contracts' });

      const result = isGateSectionVisibleGuard({ status, section });

      expect(result).toBe(true);
    });

    it('VALID: {status: flows_approved, section: flows} => returns true', () => {
      const status = QuestStatusStub({ value: 'flows_approved' });
      const section = GateSectionKeyStub({ value: 'flows' });

      const result = isGateSectionVisibleGuard({ status, section });

      expect(result).toBe(true);
    });

    it('VALID: {status: flows_approved, section: toolingRequirements} => returns true', () => {
      const status = QuestStatusStub({ value: 'flows_approved' });
      const section = GateSectionKeyStub({ value: 'toolingRequirements' });

      const result = isGateSectionVisibleGuard({ status, section });

      expect(result).toBe(true);
    });
  });

  describe('explore_flows status', () => {
    it('VALID: {status: explore_flows, section: flows} => returns true', () => {
      const status = QuestStatusStub({ value: 'explore_flows' });
      const section = GateSectionKeyStub({ value: 'flows' });

      const result = isGateSectionVisibleGuard({ status, section });

      expect(result).toBe(true);
    });

    it('VALID: {status: explore_flows, section: designDecisions} => returns true', () => {
      const status = QuestStatusStub({ value: 'explore_flows' });
      const section = GateSectionKeyStub({ value: 'designDecisions' });

      const result = isGateSectionVisibleGuard({ status, section });

      expect(result).toBe(true);
    });

    it('VALID: {status: explore_flows, section: contracts} => returns false', () => {
      const status = QuestStatusStub({ value: 'explore_flows' });
      const section = GateSectionKeyStub({ value: 'contracts' });

      const result = isGateSectionVisibleGuard({ status, section });

      expect(result).toBe(false);
    });
  });

  describe('review_flows status', () => {
    it('VALID: {status: review_flows, section: flows} => returns true', () => {
      const status = QuestStatusStub({ value: 'review_flows' });
      const section = GateSectionKeyStub({ value: 'flows' });

      const result = isGateSectionVisibleGuard({ status, section });

      expect(result).toBe(true);
    });

    it('VALID: {status: review_flows, section: contracts} => returns false', () => {
      const status = QuestStatusStub({ value: 'review_flows' });
      const section = GateSectionKeyStub({ value: 'contracts' });

      const result = isGateSectionVisibleGuard({ status, section });

      expect(result).toBe(false);
    });
  });

  describe('explore_observables status', () => {
    it('VALID: {status: explore_observables, section: contracts} => returns true', () => {
      const status = QuestStatusStub({ value: 'explore_observables' });
      const section = GateSectionKeyStub({ value: 'contracts' });

      const result = isGateSectionVisibleGuard({ status, section });

      expect(result).toBe(true);
    });

    it('VALID: {status: explore_observables, section: flows} => returns true', () => {
      const status = QuestStatusStub({ value: 'explore_observables' });
      const section = GateSectionKeyStub({ value: 'flows' });

      const result = isGateSectionVisibleGuard({ status, section });

      expect(result).toBe(true);
    });
  });

  describe('review_observables status', () => {
    it('VALID: {status: review_observables, section: contracts} => returns true', () => {
      const status = QuestStatusStub({ value: 'review_observables' });
      const section = GateSectionKeyStub({ value: 'contracts' });

      const result = isGateSectionVisibleGuard({ status, section });

      expect(result).toBe(true);
    });

    it('VALID: {status: review_observables, section: toolingRequirements} => returns true', () => {
      const status = QuestStatusStub({ value: 'review_observables' });
      const section = GateSectionKeyStub({ value: 'toolingRequirements' });

      const result = isGateSectionVisibleGuard({ status, section });

      expect(result).toBe(true);
    });
  });

  describe('explore_design status', () => {
    it('VALID: {status: explore_design, section: flows} => returns true', () => {
      const status = QuestStatusStub({ value: 'explore_design' });
      const section = GateSectionKeyStub({ value: 'flows' });

      const result = isGateSectionVisibleGuard({ status, section });

      expect(result).toBe(true);
    });

    it('VALID: {status: explore_design, section: contracts} => returns true', () => {
      const status = QuestStatusStub({ value: 'explore_design' });
      const section = GateSectionKeyStub({ value: 'contracts' });

      const result = isGateSectionVisibleGuard({ status, section });

      expect(result).toBe(true);
    });
  });

  describe('review_design status', () => {
    it('VALID: {status: review_design, section: flows} => returns true', () => {
      const status = QuestStatusStub({ value: 'review_design' });
      const section = GateSectionKeyStub({ value: 'flows' });

      const result = isGateSectionVisibleGuard({ status, section });

      expect(result).toBe(true);
    });

    it('VALID: {status: review_design, section: toolingRequirements} => returns true', () => {
      const status = QuestStatusStub({ value: 'review_design' });
      const section = GateSectionKeyStub({ value: 'toolingRequirements' });

      const result = isGateSectionVisibleGuard({ status, section });

      expect(result).toBe(true);
    });
  });

  describe('design_approved status', () => {
    it('VALID: {status: design_approved, section: contracts} => returns true', () => {
      const status = QuestStatusStub({ value: 'design_approved' });
      const section = GateSectionKeyStub({ value: 'contracts' });

      const result = isGateSectionVisibleGuard({ status, section });

      expect(result).toBe(true);
    });

    it('VALID: {status: design_approved, section: toolingRequirements} => returns true', () => {
      const status = QuestStatusStub({ value: 'design_approved' });
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

    it('VALID: {status: in_progress, section: contracts} => returns true', () => {
      const status = QuestStatusStub({ value: 'in_progress' });
      const section = GateSectionKeyStub({ value: 'contracts' });

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
