import { QuestContractEntryStub } from '@dungeonmaster/shared/contracts';

import { mantineRenderMiddleware } from '@dungeonmaster/testing/middleware/mantine-render';
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

      mantineRenderMiddleware({
        ui: <FlowDetailPanelContractEntryLayerWidget contract={contract} />,
      });

      expect(proxy.getEntry()).toBeInTheDocument();
      expect(proxy.getName()).toBe('LoginCredentials');
      expect(proxy.getPropertyTexts()).toStrictEqual(['email: EmailAddress', 'password: Password']);
    });

    it('EMPTY: {contract with no properties} => renders the contract name with no property rows', () => {
      const proxy = FlowDetailPanelContractEntryLayerWidgetProxy();
      const contract = QuestContractEntryStub({ name: 'EmptyContract', properties: [] });

      mantineRenderMiddleware({
        ui: <FlowDetailPanelContractEntryLayerWidget contract={contract} />,
      });

      expect(proxy.getName()).toBe('EmptyContract');
      expect(proxy.getPropertyTexts()).toStrictEqual([]);
    });
  });
});
