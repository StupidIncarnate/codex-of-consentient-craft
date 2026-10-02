import { QuestContractEntryStub } from '@dungeonmaster/shared/contracts/quest-contract-entry/quest-contract-entry.stub';

import { render } from '#gateway/npm/testing-library__react';
import { FlowDetailPanelContractEntryLayerWidget } from './flow-detail-panel-contract-entry-layer-widget';
import { FlowDetailPanelContractEntryLayerWidgetProxy } from './flow-detail-panel-contract-entry-layer-widget.proxy';

describe('FlowDetailPanelContractEntryLayerWidget', () => {
  describe('contract row content', () => {
    it('VALID: {contract with two properties} => renders the contract name and each "name: type" row', () => {
      const proxy = FlowDetailPanelContractEntryLayerWidgetProxy();
      const contract = QuestContractEntryStub({
        name: 'LoginCredentials',
        properties: [
          { name: 'email', type: 'EmailAddress', description: 'User email' },
          { name: 'password', type: 'Password', description: 'User password' },
        ],
      });

      render({
        ui: <FlowDetailPanelContractEntryLayerWidget contract={contract} />,
      });

      expect(proxy.getEntry()).toBeInTheDocument();
      expect(proxy.getName()).toBe('LoginCredentials');
      expect(proxy.getPropertyTexts()).toStrictEqual(['email: EmailAddress', 'password: Password']);
    });

    it('EMPTY: {contract with no properties} => renders the contract name with no property rows', () => {
      const proxy = FlowDetailPanelContractEntryLayerWidgetProxy();
      const contract = QuestContractEntryStub({ name: 'EmptyContract', properties: [] });

      render({
        ui: <FlowDetailPanelContractEntryLayerWidget contract={contract} />,
      });

      expect(proxy.getName()).toBe('EmptyContract');
      expect(proxy.getPropertyTexts()).toStrictEqual([]);
    });
  });
});
