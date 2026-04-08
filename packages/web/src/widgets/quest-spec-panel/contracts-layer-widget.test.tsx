import { screen } from '@testing-library/react';

import { ToolingRequirementStub } from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { ContractsLayerWidget } from './contracts-layer-widget';
import { ContractsLayerWidgetProxy } from './contracts-layer-widget.proxy';

type ToolingRequirement = ReturnType<typeof ToolingRequirementStub>;

describe('ContractsLayerWidget', () => {
  describe('read mode - tooling', () => {
    it('VALID: {tooling: [tool]} => renders tool name', () => {
      ContractsLayerWidgetProxy();
      const tool = ToolingRequirementStub({ name: 'pg-driver' });

      mantineRenderAdapter({
        ui: (
          <ContractsLayerWidget
            contracts={[]}
            tooling={[tool]}
            editing={false}
            onChange={jest.fn()}
          />
        ),
      });

      expect(screen.getByTestId('TOOLING_NAME').textContent).toBe('pg-driver');
    });

    it('VALID: {tooling: [tool]} => renders tool package name', () => {
      ContractsLayerWidgetProxy();
      const tool = ToolingRequirementStub({ packageName: 'pg' });

      mantineRenderAdapter({
        ui: (
          <ContractsLayerWidget
            contracts={[]}
            tooling={[tool]}
            editing={false}
            onChange={jest.fn()}
          />
        ),
      });

      expect(screen.getByTestId('TOOLING_PACKAGE').textContent).toBe('pg');
    });

    it('VALID: {tooling: [tool]} => renders tool reason', () => {
      ContractsLayerWidgetProxy();
      const tool = ToolingRequirementStub({ reason: 'DB verification' });

      mantineRenderAdapter({
        ui: (
          <ContractsLayerWidget
            contracts={[]}
            tooling={[tool]}
            editing={false}
            onChange={jest.fn()}
          />
        ),
      });

      expect(screen.getByTestId('TOOLING_REASON').textContent).toBe('\u2014 DB verification');
    });

    it('VALID: {tooling: [tool]} => renders observables tag list', () => {
      ContractsLayerWidgetProxy();
      const tool = ToolingRequirementStub({ requiredByObservables: [] });

      mantineRenderAdapter({
        ui: (
          <ContractsLayerWidget
            contracts={[]}
            tooling={[tool]}
            editing={false}
            onChange={jest.fn()}
          />
        ),
      });

      expect(screen.getByTestId('FORM_TAG_LIST')).toBeInTheDocument();
    });

    it('EMPTY: {tooling: []} => renders section with TOOLING label', () => {
      ContractsLayerWidgetProxy();
      const tooling: ToolingRequirement[] = [];

      mantineRenderAdapter({
        ui: (
          <ContractsLayerWidget
            contracts={[]}
            tooling={tooling}
            editing={false}
            onChange={jest.fn()}
          />
        ),
      });

      expect(
        screen.getAllByTestId('SECTION_HEADER_LABEL').some((el) => el.textContent === 'TOOLING'),
      ).toBe(true);
    });
  });

  describe('edit mode - tooling', () => {
    it('VALID: {editing: true, tooling: [tool]} => renders FormInputWidget for name', () => {
      ContractsLayerWidgetProxy();
      const tool = ToolingRequirementStub({ name: 'pg-driver' });

      mantineRenderAdapter({
        ui: (
          <ContractsLayerWidget
            contracts={[]}
            tooling={[tool]}
            editing={true}
            onChange={jest.fn()}
          />
        ),
      });

      const inputs = screen.getAllByTestId('FORM_INPUT');
      const nameInput = inputs.find((input) => input.getAttribute('value') === 'pg-driver');

      expect(nameInput).toBeInTheDocument();
    });

    it('VALID: {editing: true, tooling: [tool]} => renders FormTagListWidget for observables', () => {
      ContractsLayerWidgetProxy();
      const tool = ToolingRequirementStub({ requiredByObservables: [] });

      mantineRenderAdapter({
        ui: (
          <ContractsLayerWidget
            contracts={[]}
            tooling={[tool]}
            editing={true}
            onChange={jest.fn()}
          />
        ),
      });

      expect(screen.getByTestId('FORM_TAG_LIST')).toBeInTheDocument();
    });
  });
});
