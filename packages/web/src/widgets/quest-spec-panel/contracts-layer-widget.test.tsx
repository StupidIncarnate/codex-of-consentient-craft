import { render, screen } from '#gateway/npm/testing-library__react';

import { ToolingRequirementStub } from '@dungeonmaster/shared/contracts/tooling-requirement/tooling-requirement.stub';

import { ContractsLayerWidget } from './contracts-layer-widget';
import { ContractsLayerWidgetProxy } from './contracts-layer-widget.proxy';

type ToolingRequirement = ReturnType<typeof ToolingRequirementStub>;

describe('ContractsLayerWidget', () => {
  describe('read mode - tooling', () => {
    it('VALID: {tooling: [tool]} => renders tool name', () => {
      ContractsLayerWidgetProxy();
      const tool = ToolingRequirementStub({ name: 'pg-driver' });

      render({
        ui: <ContractsLayerWidget tooling={[tool]} />,
      });

      expect(screen.getByTestId('TOOLING_NAME').textContent).toBe('pg-driver');
    });

    it('VALID: {tooling: [tool]} => renders tool package name', () => {
      ContractsLayerWidgetProxy();
      const tool = ToolingRequirementStub({ packageName: 'pg' });

      render({
        ui: <ContractsLayerWidget tooling={[tool]} />,
      });

      expect(screen.getByTestId('TOOLING_PACKAGE').textContent).toBe('pg');
    });

    it('VALID: {tooling: [tool]} => renders tool reason', () => {
      ContractsLayerWidgetProxy();
      const tool = ToolingRequirementStub({ reason: 'DB verification' });

      render({
        ui: <ContractsLayerWidget tooling={[tool]} />,
      });

      expect(screen.getByTestId('TOOLING_REASON').textContent).toBe('— DB verification');
    });

    it('VALID: {tooling: [tool]} => renders observables tag list', () => {
      ContractsLayerWidgetProxy();
      const tool = ToolingRequirementStub({ requiredByObservables: [] });

      render({
        ui: <ContractsLayerWidget tooling={[tool]} />,
      });

      expect(screen.getByTestId('FORM_TAG_LIST')).toBeInTheDocument();
    });

    it('EMPTY: {tooling: []} => renders section with TOOLING label', () => {
      ContractsLayerWidgetProxy();
      const tooling: ToolingRequirement[] = [];

      render({
        ui: <ContractsLayerWidget tooling={tooling} />,
      });

      expect(screen.getByTestId('SECTION_HEADER_LABEL').textContent).toBe('TOOLING');
    });
  });
});
