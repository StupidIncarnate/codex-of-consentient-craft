import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { QuestStub } from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { QuestTitleBarWidget } from './quest-title-bar-widget';
import { QuestTitleBarWidgetProxy } from './quest-title-bar-widget.proxy';

describe('QuestTitleBarWidget', () => {
  describe('title rendering', () => {
    it('VALID: {title provided} => renders title text', () => {
      const proxy = QuestTitleBarWidgetProxy();
      const { title } = QuestStub({ title: 'Add Authentication' as never });

      mantineRenderAdapter({ ui: <QuestTitleBarWidget title={title} /> });

      expect(proxy.hasTitleBar()).toBe(true);
      expect(proxy.hasTitleText()).toBe(true);
      expect(screen.getByTestId('QUEST_TITLE').textContent).toBe('Add Authentication');
    });

    it('VALID: {editing: true with onTitleChange} => renders FormInput instead of title text', () => {
      const proxy = QuestTitleBarWidgetProxy();
      const { title } = QuestStub({ title: 'Add Authentication' as never });

      mantineRenderAdapter({
        ui: <QuestTitleBarWidget title={title} editing={true} onTitleChange={jest.fn()} />,
      });

      expect(proxy.hasTitleInput()).toBe(true);
      expect(proxy.hasTitleText()).toBe(false);
    });

    it('VALID: {editing: true without onTitleChange} => falls back to title text', () => {
      const proxy = QuestTitleBarWidgetProxy();
      const { title } = QuestStub({ title: 'Add Authentication' as never });

      mantineRenderAdapter({ ui: <QuestTitleBarWidget title={title} editing={true} /> });

      expect(proxy.hasTitleInput()).toBe(false);
      expect(proxy.hasTitleText()).toBe(true);
    });

    it('VALID: {editing typing} => calls onTitleChange with new value', async () => {
      QuestTitleBarWidgetProxy();
      const { title } = QuestStub({ title: 'Old' as never });
      const onTitleChange = jest.fn();

      mantineRenderAdapter({
        ui: <QuestTitleBarWidget title={title} editing={true} onTitleChange={onTitleChange} />,
      });

      const input = screen.getByTestId('FORM_INPUT');
      await userEvent.type(input, '!');

      expect(onTitleChange).toHaveBeenCalledWith('Old!');
    });
  });

  describe('abandon button', () => {
    it('VALID: {onAbandon provided} => renders ABANDON QUEST button', () => {
      const proxy = QuestTitleBarWidgetProxy();
      const { title } = QuestStub({ title: 'Add Authentication' as never });

      mantineRenderAdapter({ ui: <QuestTitleBarWidget title={title} onAbandon={jest.fn()} /> });

      expect(proxy.hasAbandonButton()).toBe(true);
    });

    it('VALID: {no onAbandon} => does not render ABANDON QUEST button', () => {
      const proxy = QuestTitleBarWidgetProxy();
      const { title } = QuestStub({ title: 'Add Authentication' as never });

      mantineRenderAdapter({ ui: <QuestTitleBarWidget title={title} /> });

      expect(proxy.hasAbandonButton()).toBe(false);
    });

    it('VALID: {editing: true + onAbandon} => does not render ABANDON QUEST button', () => {
      const proxy = QuestTitleBarWidgetProxy();
      const { title } = QuestStub({ title: 'Add Authentication' as never });

      mantineRenderAdapter({
        ui: (
          <QuestTitleBarWidget
            title={title}
            editing={true}
            onTitleChange={jest.fn()}
            onAbandon={jest.fn()}
          />
        ),
      });

      expect(proxy.hasAbandonButton()).toBe(false);
    });

    it('VALID: {click ABANDON QUEST} => shows CONFIRM ABANDON and CANCEL buttons', async () => {
      const proxy = QuestTitleBarWidgetProxy();
      const { title } = QuestStub({ title: 'Add Authentication' as never });
      const onAbandon = jest.fn();

      mantineRenderAdapter({ ui: <QuestTitleBarWidget title={title} onAbandon={onAbandon} /> });

      await proxy.clickAbandon();

      const labels = proxy.getAbandonButtons().map((btn) => btn.textContent);

      expect(labels).toStrictEqual(['CONFIRM ABANDON', 'CANCEL']);
      expect(onAbandon).toHaveBeenCalledTimes(0);
    });

    it('VALID: {click CONFIRM ABANDON} => calls onAbandon once', async () => {
      const proxy = QuestTitleBarWidgetProxy();
      const { title } = QuestStub({ title: 'Add Authentication' as never });
      const onAbandon = jest.fn();

      mantineRenderAdapter({ ui: <QuestTitleBarWidget title={title} onAbandon={onAbandon} /> });

      await proxy.clickAbandon();
      await proxy.clickConfirmAbandon();

      expect(onAbandon).toHaveBeenCalledTimes(1);
    });

    it('VALID: {click CANCEL after ABANDON} => returns to ABANDON QUEST button, does not call onAbandon', async () => {
      const proxy = QuestTitleBarWidgetProxy();
      const { title } = QuestStub({ title: 'Add Authentication' as never });
      const onAbandon = jest.fn();

      mantineRenderAdapter({ ui: <QuestTitleBarWidget title={title} onAbandon={onAbandon} /> });

      await proxy.clickAbandon();
      await proxy.clickCancelAbandon();

      const labels = proxy.getAbandonButtons().map((btn) => btn.textContent);

      expect(labels).toStrictEqual(['ABANDON QUEST']);
      expect(onAbandon).toHaveBeenCalledTimes(0);
    });
  });
});
