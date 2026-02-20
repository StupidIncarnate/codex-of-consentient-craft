import { screen } from '@testing-library/react';

import { QuestStub, RequirementStub, DesignDecisionStub } from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { QuestSpecPanelWidget } from './quest-spec-panel-widget';
import { QuestSpecPanelWidgetProxy } from './quest-spec-panel-widget.proxy';

type Quest = ReturnType<typeof QuestStub>;

describe('QuestSpecPanelWidget', () => {
  describe('read mode', () => {
    it('VALID: {quest} => renders quest title', () => {
      QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({ title: 'Add Authentication' });

      mantineRenderAdapter({
        ui: <QuestSpecPanelWidget quest={quest} onModify={jest.fn()} onRefresh={jest.fn()} />,
      });

      expect(screen.getByTestId('QUEST_TITLE').textContent).toBe('Add Authentication');
    });

    it('VALID: {quest} => renders OBSERVABLES APPROVAL header', () => {
      QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub();

      mantineRenderAdapter({
        ui: <QuestSpecPanelWidget quest={quest} onModify={jest.fn()} onRefresh={jest.fn()} />,
      });

      expect(screen.getByTestId('PANEL_HEADER').textContent).toBe('OBSERVABLES APPROVAL');
    });

    it('VALID: {quest} => renders APPROVE and MODIFY buttons', () => {
      QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub();

      mantineRenderAdapter({
        ui: <QuestSpecPanelWidget quest={quest} onModify={jest.fn()} onRefresh={jest.fn()} />,
      });

      const buttons = screen.getAllByTestId('PIXEL_BTN');
      const buttonTexts = buttons.map((button) => button.textContent);

      expect(buttonTexts).toStrictEqual(['APPROVE', 'MODIFY']);
    });

    it('VALID: {click APPROVE} => calls onRefresh', async () => {
      const proxy = QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub();
      const onRefresh = jest.fn();

      mantineRenderAdapter({
        ui: <QuestSpecPanelWidget quest={quest} onModify={jest.fn()} onRefresh={onRefresh} />,
      });

      await proxy.clickApprove();

      expect(onRefresh).toHaveBeenCalledTimes(1);
    });
  });

  describe('edit mode', () => {
    it('VALID: {click MODIFY} => switches to EDITING SPEC header', async () => {
      const proxy = QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub();

      mantineRenderAdapter({
        ui: <QuestSpecPanelWidget quest={quest} onModify={jest.fn()} onRefresh={jest.fn()} />,
      });

      await proxy.clickModify();

      expect(screen.getByTestId('PANEL_HEADER').textContent).toBe('EDITING SPEC');
    });

    it('VALID: {click MODIFY} => renders SUBMIT and CANCEL buttons', async () => {
      const proxy = QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub();

      mantineRenderAdapter({
        ui: <QuestSpecPanelWidget quest={quest} onModify={jest.fn()} onRefresh={jest.fn()} />,
      });

      await proxy.clickModify();

      const actionBar = screen.getByTestId('ACTION_BAR');
      const buttons = actionBar.querySelectorAll('[data-testid="PIXEL_BTN"]');
      const buttonTexts = Array.from(buttons).map((button) => button.textContent);

      expect(buttonTexts).toStrictEqual(['SUBMIT', 'CANCEL']);
    });

    it('VALID: {click MODIFY then CANCEL} => returns to read mode', async () => {
      const proxy = QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub();

      mantineRenderAdapter({
        ui: <QuestSpecPanelWidget quest={quest} onModify={jest.fn()} onRefresh={jest.fn()} />,
      });

      await proxy.clickModify();
      await proxy.clickCancel();

      expect(screen.getByTestId('PANEL_HEADER').textContent).toBe('OBSERVABLES APPROVAL');
    });

    it('VALID: {click MODIFY then SUBMIT} => calls onModify and returns to read mode', async () => {
      const proxy = QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub();
      const onModify = jest.fn();

      mantineRenderAdapter({
        ui: <QuestSpecPanelWidget quest={quest} onModify={onModify} onRefresh={jest.fn()} />,
      });

      await proxy.clickModify();
      await proxy.clickSubmit();

      expect(onModify).toHaveBeenCalledTimes(1);
      expect(onModify).toHaveBeenCalledWith({ modifications: {} });
      expect(screen.getByTestId('PANEL_HEADER').textContent).toBe('OBSERVABLES APPROVAL');
    });

    it('VALID: {click MODIFY} => shows FormInputWidget for quest title', async () => {
      const proxy = QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({ title: 'My Quest' });

      mantineRenderAdapter({
        ui: <QuestSpecPanelWidget quest={quest} onModify={jest.fn()} onRefresh={jest.fn()} />,
      });

      await proxy.clickModify();

      const inputs = screen.getAllByTestId('FORM_INPUT');
      const firstInput = inputs[0] as HTMLInputElement | undefined;

      expect(firstInput?.getAttribute('value')).toBe('My Quest');
    });
  });

  describe('requirements layer', () => {
    it('VALID: {quest with requirements} => renders requirements layer', () => {
      QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({
        requirements: [
          RequirementStub({ id: 'a12ac10b-58cc-4372-a567-0e02b2c3d479', name: 'Feature A' }),
        ],
      });

      mantineRenderAdapter({
        ui: <QuestSpecPanelWidget quest={quest} onModify={jest.fn()} onRefresh={jest.fn()} />,
      });

      expect(screen.getByTestId('REQUIREMENTS_LAYER')).toBeInTheDocument();
      expect(screen.getByText('Feature A')).toBeInTheDocument();
    });

    it('VALID: {quest with design decisions} => renders design decisions', () => {
      QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({
        designDecisions: [
          DesignDecisionStub({
            id: 'c23bc10b-58cc-4372-a567-0e02b2c3d479',
            title: 'Use JWT',
          }),
        ],
      });

      mantineRenderAdapter({
        ui: <QuestSpecPanelWidget quest={quest} onModify={jest.fn()} onRefresh={jest.fn()} />,
      });

      expect(screen.getByText('Use JWT')).toBeInTheDocument();
    });
  });

  describe('empty states', () => {
    it('EDGE: {quest with no requirements} => renders without crash', () => {
      QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({ requirements: [], designDecisions: [] });

      mantineRenderAdapter({
        ui: <QuestSpecPanelWidget quest={quest} onModify={jest.fn()} onRefresh={jest.fn()} />,
      });

      expect(screen.getByTestId('QUEST_SPEC_PANEL')).toBeInTheDocument();
    });
  });
});
