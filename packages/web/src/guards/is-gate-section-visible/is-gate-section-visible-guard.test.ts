import { isGateSectionVisibleGuard } from './is-gate-section-visible-guard';

describe('isGateSectionVisibleGuard', () => {
  describe('created status', () => {
    it('VALID: {status: created, section: flows} => returns true', () => {
      const status = 'created';
      const section = 'flows';

      const result = isGateSectionVisibleGuard({ status, section });

      expect(result).toBe(true);
    });

    it('VALID: {status: created, section: designDecisions} => returns true', () => {
      const status = 'created';
      const section = 'designDecisions';

      const result = isGateSectionVisibleGuard({ status, section });

      expect(result).toBe(true);
    });

    it('VALID: {status: created, section: contracts} => returns false', () => {
      const status = 'created';
      const section = 'contracts';

      const result = isGateSectionVisibleGuard({ status, section });

      expect(result).toBe(false);
    });
  });

  describe('pending status', () => {
    it('VALID: {status: pending, section: flows} => returns true', () => {
      const status = 'pending';
      const section = 'flows';

      const result = isGateSectionVisibleGuard({ status, section });

      expect(result).toBe(true);
    });

    it('VALID: {status: pending, section: contracts} => returns false', () => {
      const status = 'pending';
      const section = 'contracts';

      const result = isGateSectionVisibleGuard({ status, section });

      expect(result).toBe(false);
    });
  });

  describe('flows_approved status', () => {
    it('VALID: {status: flows_approved, section: contracts} => returns true', () => {
      const status = 'flows_approved';
      const section = 'contracts';

      const result = isGateSectionVisibleGuard({ status, section });

      expect(result).toBe(true);
    });

    it('VALID: {status: flows_approved, section: flows} => returns true', () => {
      const status = 'flows_approved';
      const section = 'flows';

      const result = isGateSectionVisibleGuard({ status, section });

      expect(result).toBe(true);
    });

    it('VALID: {status: flows_approved, section: toolingRequirements} => returns true', () => {
      const status = 'flows_approved';
      const section = 'toolingRequirements';

      const result = isGateSectionVisibleGuard({ status, section });

      expect(result).toBe(true);
    });
  });

  describe('explore_flows status', () => {
    it('VALID: {status: explore_flows, section: flows} => returns true', () => {
      const status = 'explore_flows';
      const section = 'flows';

      const result = isGateSectionVisibleGuard({ status, section });

      expect(result).toBe(true);
    });

    it('VALID: {status: explore_flows, section: designDecisions} => returns true', () => {
      const status = 'explore_flows';
      const section = 'designDecisions';

      const result = isGateSectionVisibleGuard({ status, section });

      expect(result).toBe(true);
    });

    it('VALID: {status: explore_flows, section: contracts} => returns false', () => {
      const status = 'explore_flows';
      const section = 'contracts';

      const result = isGateSectionVisibleGuard({ status, section });

      expect(result).toBe(false);
    });
  });

  describe('review_flows status', () => {
    it('VALID: {status: review_flows, section: flows} => returns true', () => {
      const status = 'review_flows';
      const section = 'flows';

      const result = isGateSectionVisibleGuard({ status, section });

      expect(result).toBe(true);
    });

    it('VALID: {status: review_flows, section: contracts} => returns false', () => {
      const status = 'review_flows';
      const section = 'contracts';

      const result = isGateSectionVisibleGuard({ status, section });

      expect(result).toBe(false);
    });
  });

  describe('explore_observables status', () => {
    it('VALID: {status: explore_observables, section: contracts} => returns true', () => {
      const status = 'explore_observables';
      const section = 'contracts';

      const result = isGateSectionVisibleGuard({ status, section });

      expect(result).toBe(true);
    });

    it('VALID: {status: explore_observables, section: flows} => returns true', () => {
      const status = 'explore_observables';
      const section = 'flows';

      const result = isGateSectionVisibleGuard({ status, section });

      expect(result).toBe(true);
    });
  });

  describe('review_observables status', () => {
    it('VALID: {status: review_observables, section: contracts} => returns true', () => {
      const status = 'review_observables';
      const section = 'contracts';

      const result = isGateSectionVisibleGuard({ status, section });

      expect(result).toBe(true);
    });

    it('VALID: {status: review_observables, section: toolingRequirements} => returns true', () => {
      const status = 'review_observables';
      const section = 'toolingRequirements';

      const result = isGateSectionVisibleGuard({ status, section });

      expect(result).toBe(true);
    });
  });

  describe('approved and beyond', () => {
    it('VALID: {status: approved, section: toolingRequirements} => returns true', () => {
      const status = 'approved';
      const section = 'toolingRequirements';

      const result = isGateSectionVisibleGuard({ status, section });

      expect(result).toBe(true);
    });

    it('VALID: {status: in_progress, section: contracts} => returns true', () => {
      const status = 'in_progress';
      const section = 'contracts';

      const result = isGateSectionVisibleGuard({ status, section });

      expect(result).toBe(true);
    });

    it('VALID: {status: complete, section: flows} => returns true', () => {
      const status = 'complete';
      const section = 'flows';

      const result = isGateSectionVisibleGuard({ status, section });

      expect(result).toBe(true);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {status undefined} => returns false', () => {
      const section = 'flows';

      const result = isGateSectionVisibleGuard({ section });

      expect(result).toBe(false);
    });

    it('EMPTY: {section undefined} => returns false', () => {
      const status = 'created';

      const result = isGateSectionVisibleGuard({ status });

      expect(result).toBe(false);
    });

    it('EMPTY: {both undefined} => returns false', () => {
      const result = isGateSectionVisibleGuard({});

      expect(result).toBe(false);
    });
  });
});
