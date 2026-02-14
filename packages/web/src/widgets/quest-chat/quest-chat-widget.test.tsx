import { QuestIdStub } from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { QuestChatWidget } from './quest-chat-widget';
import { QuestChatWidgetProxy } from './quest-chat-widget.proxy';

describe('QuestChatWidget', () => {
  describe('layout structure', () => {
    it('VALID: {questId} => renders LogoWidget', () => {
      const proxy = QuestChatWidgetProxy();
      const questId = QuestIdStub({ value: 'chat-q1' });

      mantineRenderAdapter({ ui: <QuestChatWidget questId={questId} onBack={jest.fn()} /> });

      expect(proxy.hasLogo()).toBe(true);
    });

    it('VALID: {questId} => renders MapFrameWidget', () => {
      const proxy = QuestChatWidgetProxy();
      const questId = QuestIdStub({ value: 'chat-q2' });

      mantineRenderAdapter({ ui: <QuestChatWidget questId={questId} onBack={jest.fn()} /> });

      expect(proxy.hasMapFrame()).toBe(true);
    });

    it('VALID: {questId} => renders ChatPanelWidget', () => {
      const proxy = QuestChatWidgetProxy();
      const questId = QuestIdStub({ value: 'chat-q3' });

      mantineRenderAdapter({ ui: <QuestChatWidget questId={questId} onBack={jest.fn()} /> });

      expect(proxy.hasChatPanel()).toBe(true);
    });

    it('VALID: {questId} => renders vertical divider', () => {
      const proxy = QuestChatWidgetProxy();
      const questId = QuestIdStub({ value: 'chat-q4' });

      mantineRenderAdapter({ ui: <QuestChatWidget questId={questId} onBack={jest.fn()} /> });

      expect(proxy.hasDivider()).toBe(true);
    });
  });

  describe('right panel', () => {
    it('VALID: {questId} => renders activity placeholder text', () => {
      const proxy = QuestChatWidgetProxy();
      const questId = QuestIdStub({ value: 'chat-q5' });

      mantineRenderAdapter({ ui: <QuestChatWidget questId={questId} onBack={jest.fn()} /> });

      expect(proxy.hasActivityPlaceholder()).toBe(true);
      expect(proxy.getActivityText()).toBe('Awaiting quest activity...');
    });
  });
});
