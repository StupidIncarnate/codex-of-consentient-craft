import { screen } from '@testing-library/react';

import { RequirementStub } from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { RequirementsLayerWidget } from './requirements-layer-widget';
import { RequirementsLayerWidgetProxy } from './requirements-layer-widget.proxy';

type Requirement = ReturnType<typeof RequirementStub>;

describe('RequirementsLayerWidget', () => {
  describe('read mode - requirements', () => {
    it('VALID: {requirements: [req]} => renders requirement name', () => {
      RequirementsLayerWidgetProxy();
      const requirement = RequirementStub({ name: 'CLI Mode' });

      mantineRenderAdapter({
        ui: (
          <RequirementsLayerWidget
            requirements={[requirement]}
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
            editing={false}
            onChange={jest.fn()}
          />
        ),
      });

      expect(screen.getByText('REQUIREMENTS')).toBeInTheDocument();
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
            editing={true}
            onChange={jest.fn()}
          />
        ),
      });

      expect(screen.getByTestId('FORM_DROPDOWN')).toBeInTheDocument();
    });
  });
});
