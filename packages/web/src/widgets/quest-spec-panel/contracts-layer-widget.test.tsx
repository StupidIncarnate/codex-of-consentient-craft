import { screen } from '@testing-library/react';

import { QuestContractEntryStub, ToolingRequirementStub } from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { ContractsLayerWidget } from './contracts-layer-widget';
import { ContractsLayerWidgetProxy } from './contracts-layer-widget.proxy';

type QuestContractEntry = ReturnType<typeof QuestContractEntryStub>;
type ToolingRequirement = ReturnType<typeof ToolingRequirementStub>;

describe('ContractsLayerWidget', () => {
  describe('read mode - contracts', () => {
    it('VALID: {contracts: [entry]} => renders contract name', () => {
      ContractsLayerWidgetProxy();
      const contract = QuestContractEntryStub({ name: 'LoginCredentials' });

      mantineRenderAdapter({
        ui: (
          <ContractsLayerWidget
            contracts={[contract]}
            tooling={[]}
            editing={false}
            onChange={jest.fn()}
          />
        ),
      });

      expect(screen.getByTestId('CONTRACT_NAME').textContent).toBe('LoginCredentials');
    });

    it('VALID: {contracts: [entry]} => renders contract kind', () => {
      ContractsLayerWidgetProxy();
      const contract = QuestContractEntryStub({ kind: 'endpoint' });

      mantineRenderAdapter({
        ui: (
          <ContractsLayerWidget
            contracts={[contract]}
            tooling={[]}
            editing={false}
            onChange={jest.fn()}
          />
        ),
      });

      expect(screen.getByTestId('CONTRACT_KIND').textContent).toBe('endpoint');
    });

    it('VALID: {contracts: [entry]} => renders contract status', () => {
      ContractsLayerWidgetProxy();
      const contract = QuestContractEntryStub({ status: 'existing' });

      mantineRenderAdapter({
        ui: (
          <ContractsLayerWidget
            contracts={[contract]}
            tooling={[]}
            editing={false}
            onChange={jest.fn()}
          />
        ),
      });

      expect(screen.getByTestId('CONTRACT_STATUS').textContent).toBe('existing');
    });

    it('VALID: {contracts: [entry with source]} => renders source path', () => {
      ContractsLayerWidgetProxy();
      const contract = QuestContractEntryStub({ source: 'src/contracts/login.ts' });

      mantineRenderAdapter({
        ui: (
          <ContractsLayerWidget
            contracts={[contract]}
            tooling={[]}
            editing={false}
            onChange={jest.fn()}
          />
        ),
      });

      expect(screen.getByTestId('CONTRACT_SOURCE').textContent).toBe('src/contracts/login.ts');
    });

    it('VALID: {contracts: [entry with properties]} => renders property with name and type', () => {
      ContractsLayerWidgetProxy();
      const contract = QuestContractEntryStub({
        properties: [{ name: 'email', type: 'EmailAddress' }],
      });

      mantineRenderAdapter({
        ui: (
          <ContractsLayerWidget
            contracts={[contract]}
            tooling={[]}
            editing={false}
            onChange={jest.fn()}
          />
        ),
      });

      const propertyElement = screen.getByTestId('CONTRACT_PROPERTY');

      expect(propertyElement.textContent).toBe('email: EmailAddress');
    });

    it('VALID: {contracts: [entry without source]} => does not render CONTRACT_SOURCE', () => {
      ContractsLayerWidgetProxy();
      const contract = QuestContractEntryStub({});

      mantineRenderAdapter({
        ui: (
          <ContractsLayerWidget
            contracts={[contract]}
            tooling={[]}
            editing={false}
            onChange={jest.fn()}
          />
        ),
      });

      expect(screen.queryByTestId('CONTRACT_SOURCE')).not.toBeInTheDocument();
    });

    it('VALID: {contracts: [entry with property value but no type]} => renders value as fallback', () => {
      ContractsLayerWidgetProxy();
      const contract = QuestContractEntryStub({
        properties: [{ name: 'timeout', value: '3000' }],
      });

      mantineRenderAdapter({
        ui: (
          <ContractsLayerWidget
            contracts={[contract]}
            tooling={[]}
            editing={false}
            onChange={jest.fn()}
          />
        ),
      });

      const propertyElement = screen.getByTestId('CONTRACT_PROPERTY');

      expect(propertyElement.textContent).toBe('timeout: 3000');
    });

    it('VALID: {contracts: [entry with property description]} => renders em-dash and description', () => {
      ContractsLayerWidgetProxy();
      const contract = QuestContractEntryStub({
        properties: [{ name: 'email', type: 'EmailAddress', description: 'User email for auth' }],
      });

      mantineRenderAdapter({
        ui: (
          <ContractsLayerWidget
            contracts={[contract]}
            tooling={[]}
            editing={false}
            onChange={jest.fn()}
          />
        ),
      });

      const propertyElement = screen.getByTestId('CONTRACT_PROPERTY');

      expect(propertyElement.textContent).toBe('email: EmailAddress \u2014 User email for auth');
    });

    it('EMPTY: {contracts: []} => renders section with zero count', () => {
      ContractsLayerWidgetProxy();
      const contracts: QuestContractEntry[] = [];

      mantineRenderAdapter({
        ui: (
          <ContractsLayerWidget
            contracts={contracts}
            tooling={[]}
            editing={false}
            onChange={jest.fn()}
          />
        ),
      });

      expect(screen.getByText('CONTRACTS')).toBeInTheDocument();
    });
  });

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

    it('EMPTY: {tooling: []} => renders section with zero count', () => {
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

      expect(screen.getByText('TOOLING')).toBeInTheDocument();
    });
  });

  describe('edit mode - contracts', () => {
    it('VALID: {editing: true, contracts: [entry]} => renders FormInputWidget for name', () => {
      ContractsLayerWidgetProxy();
      const contract = QuestContractEntryStub({ name: 'LoginCredentials' });

      mantineRenderAdapter({
        ui: (
          <ContractsLayerWidget
            contracts={[contract]}
            tooling={[]}
            editing={true}
            onChange={jest.fn()}
          />
        ),
      });

      const inputs = screen.getAllByTestId('FORM_INPUT');
      const nameInput = inputs.find((input) => input.getAttribute('value') === 'LoginCredentials');

      expect(nameInput).toBeInTheDocument();
    });

    it('VALID: {editing: true, contracts: [entry]} => renders FormDropdownWidget for kind', () => {
      ContractsLayerWidgetProxy();
      const contract = QuestContractEntryStub({ kind: 'data' });

      mantineRenderAdapter({
        ui: (
          <ContractsLayerWidget
            contracts={[contract]}
            tooling={[]}
            editing={true}
            onChange={jest.fn()}
          />
        ),
      });

      const dropdowns = screen.getAllByTestId('FORM_DROPDOWN');

      expect(dropdowns.length).toBeGreaterThanOrEqual(2);
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
