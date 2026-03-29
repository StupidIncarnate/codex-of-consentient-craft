import { screen } from '@testing-library/react';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { QuestApprovedModalWidget } from './quest-approved-modal-widget';
import { QuestApprovedModalWidgetProxy } from './quest-approved-modal-widget.proxy';

describe('QuestApprovedModalWidget', () => {
  describe('rendering', () => {
    it('VALID: {opened: true} => renders modal with dumpster diving title', () => {
      QuestApprovedModalWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <QuestApprovedModalWidget
            opened={true}
            onKeepChatting={jest.fn()}
            onNewQuest={jest.fn()}
            onBeginQuest={jest.fn()}
          />
        ),
      });

      expect(screen.getByTestId('QUEST_APPROVED_MODAL_TITLE')).toBeInTheDocument();
    });

    it('VALID: {opened: true} => renders Begin Quest button', () => {
      QuestApprovedModalWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <QuestApprovedModalWidget
            opened={true}
            onKeepChatting={jest.fn()}
            onNewQuest={jest.fn()}
            onBeginQuest={jest.fn()}
          />
        ),
      });

      expect(screen.getByRole('button', { name: 'Begin Quest' })).toBeInTheDocument();
    });

    it('VALID: {opened: true} => renders Keep Chatting button', () => {
      QuestApprovedModalWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <QuestApprovedModalWidget
            opened={true}
            onKeepChatting={jest.fn()}
            onNewQuest={jest.fn()}
            onBeginQuest={jest.fn()}
          />
        ),
      });

      expect(screen.getByRole('button', { name: 'Keep Chatting' })).toBeInTheDocument();
    });

    it('VALID: {opened: true} => renders Start a new Quest button', () => {
      QuestApprovedModalWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <QuestApprovedModalWidget
            opened={true}
            onKeepChatting={jest.fn()}
            onNewQuest={jest.fn()}
            onBeginQuest={jest.fn()}
          />
        ),
      });

      expect(screen.getByRole('button', { name: 'Start a new Quest' })).toBeInTheDocument();
    });

    it('VALID: {opened: false} => does not render modal title', () => {
      QuestApprovedModalWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <QuestApprovedModalWidget
            opened={false}
            onKeepChatting={jest.fn()}
            onNewQuest={jest.fn()}
            onBeginQuest={jest.fn()}
          />
        ),
      });

      expect(screen.queryByTestId('QUEST_APPROVED_MODAL_TITLE')).toBe(null);
    });
  });

  describe('interactions', () => {
    it('VALID: {click Begin Quest} => calls onBeginQuest', async () => {
      const proxy = QuestApprovedModalWidgetProxy();
      const onBeginQuest = jest.fn();

      mantineRenderAdapter({
        ui: (
          <QuestApprovedModalWidget
            opened={true}
            onKeepChatting={jest.fn()}
            onNewQuest={jest.fn()}
            onBeginQuest={onBeginQuest}
          />
        ),
      });

      await proxy.clickBeginQuest();

      expect(onBeginQuest).toHaveBeenCalledTimes(1);
    });

    it('VALID: {click Keep Chatting} => calls onKeepChatting', async () => {
      const proxy = QuestApprovedModalWidgetProxy();
      const onKeepChatting = jest.fn();

      mantineRenderAdapter({
        ui: (
          <QuestApprovedModalWidget
            opened={true}
            onKeepChatting={onKeepChatting}
            onNewQuest={jest.fn()}
            onBeginQuest={jest.fn()}
          />
        ),
      });

      await proxy.clickKeepChatting();

      expect(onKeepChatting).toHaveBeenCalledTimes(1);
    });

    it('VALID: {click Start a new Quest} => calls onNewQuest', async () => {
      const proxy = QuestApprovedModalWidgetProxy();
      const onNewQuest = jest.fn();

      mantineRenderAdapter({
        ui: (
          <QuestApprovedModalWidget
            opened={true}
            onKeepChatting={jest.fn()}
            onNewQuest={onNewQuest}
            onBeginQuest={jest.fn()}
          />
        ),
      });

      await proxy.clickNewQuest();

      expect(onNewQuest).toHaveBeenCalledTimes(1);
    });
  });
});
