import { screen } from '@testing-library/react';

import { DesignDecisionStub, RequirementStub } from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { RequirementsLayerWidget } from './requirements-layer-widget';
import { RequirementsLayerWidgetProxy } from './requirements-layer-widget.proxy';

type Requirement = ReturnType<typeof RequirementStub>;
type DesignDecision = ReturnType<typeof DesignDecisionStub>;

describe('RequirementsLayerWidget', () => {
  describe('read mode - requirements', () => {
    it('VALID: {requirements: [req]} => renders requirement name', () => {
      RequirementsLayerWidgetProxy();
      const requirement = RequirementStub({ name: 'CLI Mode' });

      mantineRenderAdapter({
        ui: (
          <RequirementsLayerWidget
            requirements={[requirement]}
            designDecisions={[]}
            editing={false}
            onChange={jest.fn()}
          />
        ),
      });

      expect(screen.getByTestId('REQUIREMENT_NAME').textContent).toBe('CLI Mode');
    });

    it('VALID: {requirements: [req]} => renders requirement description', () => {
      RequirementsLayerWidgetProxy();
      const requirement = RequirementStub({ description: 'Support interactive prompts' });

      mantineRenderAdapter({
        ui: (
          <RequirementsLayerWidget
            requirements={[requirement]}
            designDecisions={[]}
            editing={false}
            onChange={jest.fn()}
          />
        ),
      });

      expect(screen.getByTestId('REQUIREMENT_DESCRIPTION').textContent).toBe(
        'Support interactive prompts',
      );
    });

    it('VALID: {requirements: [req]} => renders requirement scope', () => {
      RequirementsLayerWidgetProxy();
      const requirement = RequirementStub({ scope: 'packages/cli' });

      mantineRenderAdapter({
        ui: (
          <RequirementsLayerWidget
            requirements={[requirement]}
            designDecisions={[]}
            editing={false}
            onChange={jest.fn()}
          />
        ),
      });

      expect(screen.getByTestId('REQUIREMENT_SCOPE').textContent).toBe('scope: packages/cli');
    });

    it('VALID: {requirements: [req with status approved]} => renders APPROVED status', () => {
      RequirementsLayerWidgetProxy();
      const requirement = RequirementStub({ status: 'approved' });

      mantineRenderAdapter({
        ui: (
          <RequirementsLayerWidget
            requirements={[requirement]}
            designDecisions={[]}
            editing={false}
            onChange={jest.fn()}
          />
        ),
      });

      expect(screen.getByTestId('REQUIREMENT_STATUS').textContent).toBe('APPROVED');
    });

    it('EDGE: {requirements: [req with no status]} => renders PROPOSED as default', () => {
      RequirementsLayerWidgetProxy();
      const requirement = RequirementStub({});
      const requirements: Requirement[] = [requirement];

      mantineRenderAdapter({
        ui: (
          <RequirementsLayerWidget
            requirements={requirements}
            designDecisions={[]}
            editing={false}
            onChange={jest.fn()}
          />
        ),
      });

      expect(screen.getByTestId('REQUIREMENT_STATUS').textContent).toBe('PROPOSED');
    });

    it('EMPTY: {requirements: []} => renders section with zero count', () => {
      RequirementsLayerWidgetProxy();
      const requirements: Requirement[] = [];

      mantineRenderAdapter({
        ui: (
          <RequirementsLayerWidget
            requirements={requirements}
            designDecisions={[]}
            editing={false}
            onChange={jest.fn()}
          />
        ),
      });

      expect(screen.getByText('REQUIREMENTS')).toBeInTheDocument();
    });
  });

  describe('read mode - design decisions', () => {
    it('VALID: {designDecisions: [dec]} => renders decision title', () => {
      RequirementsLayerWidgetProxy();
      const decision = DesignDecisionStub({ title: 'Use JWT' });

      mantineRenderAdapter({
        ui: (
          <RequirementsLayerWidget
            requirements={[]}
            designDecisions={[decision]}
            editing={false}
            onChange={jest.fn()}
          />
        ),
      });

      expect(screen.getByTestId('DECISION_TITLE').textContent).toBe('Use JWT');
    });

    it('VALID: {designDecisions: [dec]} => renders decision rationale', () => {
      RequirementsLayerWidgetProxy();
      const decision = DesignDecisionStub({ rationale: 'Stateless auth' });

      mantineRenderAdapter({
        ui: (
          <RequirementsLayerWidget
            requirements={[]}
            designDecisions={[decision]}
            editing={false}
            onChange={jest.fn()}
          />
        ),
      });

      expect(screen.getByTestId('DECISION_RATIONALE').textContent).toBe('Stateless auth');
    });

    it('VALID: {designDecisions: [dec with relatedRequirements]} => renders tag list', () => {
      RequirementsLayerWidgetProxy();
      const decision = DesignDecisionStub({
        relatedRequirements: ['a12ac10b-58cc-4372-a567-0e02b2c3d479'],
      });

      mantineRenderAdapter({
        ui: (
          <RequirementsLayerWidget
            requirements={[]}
            designDecisions={[decision]}
            editing={false}
            onChange={jest.fn()}
          />
        ),
      });

      expect(screen.getByTestId('FORM_TAG_LIST')).toBeInTheDocument();
    });

    it('EMPTY: {designDecisions: []} => renders section with zero count', () => {
      RequirementsLayerWidgetProxy();
      const decisions: DesignDecision[] = [];

      mantineRenderAdapter({
        ui: (
          <RequirementsLayerWidget
            requirements={[]}
            designDecisions={decisions}
            editing={false}
            onChange={jest.fn()}
          />
        ),
      });

      expect(screen.getByText('DESIGN DECISIONS')).toBeInTheDocument();
    });
  });

  describe('edit mode - requirements', () => {
    it('VALID: {editing: true, requirements: [req]} => renders FormInputWidget for name', () => {
      RequirementsLayerWidgetProxy();
      const requirement = RequirementStub({ name: 'CLI Mode' });

      mantineRenderAdapter({
        ui: (
          <RequirementsLayerWidget
            requirements={[requirement]}
            designDecisions={[]}
            editing={true}
            onChange={jest.fn()}
          />
        ),
      });

      const inputs = screen.getAllByTestId('FORM_INPUT');
      const firstInput = inputs[0] as HTMLInputElement | undefined;

      expect(firstInput?.getAttribute('value')).toBe('CLI Mode');
    });

    it('VALID: {editing: true, requirements: [req]} => renders FormDropdownWidget for status', () => {
      RequirementsLayerWidgetProxy();
      const requirement = RequirementStub({ status: 'approved' });

      mantineRenderAdapter({
        ui: (
          <RequirementsLayerWidget
            requirements={[requirement]}
            designDecisions={[]}
            editing={true}
            onChange={jest.fn()}
          />
        ),
      });

      expect(screen.getByTestId('FORM_DROPDOWN')).toBeInTheDocument();
    });
  });

  describe('edit mode - design decisions', () => {
    it('VALID: {editing: true, designDecisions: [dec]} => renders FormInputWidget for title', () => {
      RequirementsLayerWidgetProxy();
      const decision = DesignDecisionStub({ title: 'Use JWT' });

      mantineRenderAdapter({
        ui: (
          <RequirementsLayerWidget
            requirements={[]}
            designDecisions={[decision]}
            editing={true}
            onChange={jest.fn()}
          />
        ),
      });

      const inputs = screen.getAllByTestId('FORM_INPUT');
      const titleInput = inputs.find((input) => input.getAttribute('value') === 'Use JWT');

      expect(titleInput).toBeInTheDocument();
    });
  });
});
