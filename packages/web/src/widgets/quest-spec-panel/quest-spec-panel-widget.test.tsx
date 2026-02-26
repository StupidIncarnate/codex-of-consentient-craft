import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  QuestStub,
  RequirementStub,
  DesignDecisionStub,
  QuestClarificationStub,
} from '@dungeonmaster/shared/contracts';

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

  describe('dynamic header', () => {
    it('VALID: {status: created} => renders FLOW APPROVAL header', () => {
      QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'created' });

      mantineRenderAdapter({
        ui: <QuestSpecPanelWidget quest={quest} onModify={jest.fn()} onRefresh={jest.fn()} />,
      });

      expect(screen.getByTestId('PANEL_HEADER').textContent).toBe('FLOW APPROVAL');
    });

    it('VALID: {status: pending} => renders FLOW APPROVAL header', () => {
      QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'pending' });

      mantineRenderAdapter({
        ui: <QuestSpecPanelWidget quest={quest} onModify={jest.fn()} onRefresh={jest.fn()} />,
      });

      expect(screen.getByTestId('PANEL_HEADER').textContent).toBe('FLOW APPROVAL');
    });

    it('VALID: {status: flows_approved} => renders REQUIREMENTS APPROVAL header', () => {
      QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'flows_approved' });

      mantineRenderAdapter({
        ui: <QuestSpecPanelWidget quest={quest} onModify={jest.fn()} onRefresh={jest.fn()} />,
      });

      expect(screen.getByTestId('PANEL_HEADER').textContent).toBe('REQUIREMENTS APPROVAL');
    });

    it('VALID: {status: requirements_approved} => renders OBSERVABLES APPROVAL header', () => {
      QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'requirements_approved' });

      mantineRenderAdapter({
        ui: <QuestSpecPanelWidget quest={quest} onModify={jest.fn()} onRefresh={jest.fn()} />,
      });

      expect(screen.getByTestId('PANEL_HEADER').textContent).toBe('OBSERVABLES APPROVAL');
    });

    it('VALID: {status: approved} => renders SPEC APPROVED header', () => {
      QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'approved' });

      mantineRenderAdapter({
        ui: <QuestSpecPanelWidget quest={quest} onModify={jest.fn()} onRefresh={jest.fn()} />,
      });

      expect(screen.getByTestId('PANEL_HEADER').textContent).toBe('SPEC APPROVED');
    });

    it('VALID: {click MODIFY} => switches to EDITING SPEC header', async () => {
      const proxy = QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub();

      mantineRenderAdapter({
        ui: <QuestSpecPanelWidget quest={quest} onModify={jest.fn()} onRefresh={jest.fn()} />,
      });

      await proxy.clickModify();

      expect(screen.getByTestId('PANEL_HEADER').textContent).toBe('EDITING SPEC');
    });
  });

  describe('user request', () => {
    it('VALID: {quest with userRequest} => renders user request section', () => {
      QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({
        userRequest: 'Add login with OAuth' as Quest['userRequest'],
      });

      mantineRenderAdapter({
        ui: <QuestSpecPanelWidget quest={quest} onModify={jest.fn()} onRefresh={jest.fn()} />,
      });

      expect(screen.getByTestId('USER_REQUEST_SECTION')).toBeInTheDocument();
      expect(screen.getByTestId('USER_REQUEST_TEXT').textContent).toBe('Add login with OAuth');
    });

    it('EMPTY: {quest without userRequest} => does not render user request section', () => {
      QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub();

      mantineRenderAdapter({
        ui: <QuestSpecPanelWidget quest={quest} onModify={jest.fn()} onRefresh={jest.fn()} />,
      });

      expect(screen.queryByTestId('USER_REQUEST_SECTION')).toBeNull();
    });
  });

  describe('gate visibility', () => {
    it('VALID: {status: created} => shows flows and design decisions, hides requirements/observables/contracts', () => {
      QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'created',
        requirements: [
          RequirementStub({ id: 'a12ac10b-58cc-4372-a567-0e02b2c3d479', name: 'Feature A' }),
        ],
      });

      mantineRenderAdapter({
        ui: <QuestSpecPanelWidget quest={quest} onModify={jest.fn()} onRefresh={jest.fn()} />,
      });

      expect(screen.getByTestId('FLOWS_LAYER')).toBeInTheDocument();
      expect(screen.getByTestId('DESIGN_DECISIONS_LAYER')).toBeInTheDocument();
      expect(screen.queryByTestId('REQUIREMENTS_LAYER')).toBeNull();
      expect(screen.queryByTestId('OBSERVABLES_LAYER')).toBeNull();
      expect(screen.queryByTestId('CONTRACTS_LAYER')).toBeNull();
    });

    it('VALID: {status: pending} => shows flows and design decisions, hides requirements/observables/contracts', () => {
      QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'pending' });

      mantineRenderAdapter({
        ui: <QuestSpecPanelWidget quest={quest} onModify={jest.fn()} onRefresh={jest.fn()} />,
      });

      expect(screen.getByTestId('FLOWS_LAYER')).toBeInTheDocument();
      expect(screen.getByTestId('DESIGN_DECISIONS_LAYER')).toBeInTheDocument();
      expect(screen.queryByTestId('REQUIREMENTS_LAYER')).toBeNull();
      expect(screen.queryByTestId('OBSERVABLES_LAYER')).toBeNull();
      expect(screen.queryByTestId('CONTRACTS_LAYER')).toBeNull();
    });

    it('VALID: {status: flows_approved} => shows flows, design decisions, and requirements', () => {
      QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'flows_approved',
        requirements: [
          RequirementStub({ id: 'a12ac10b-58cc-4372-a567-0e02b2c3d479', name: 'Feature A' }),
        ],
      });

      mantineRenderAdapter({
        ui: <QuestSpecPanelWidget quest={quest} onModify={jest.fn()} onRefresh={jest.fn()} />,
      });

      expect(screen.getByTestId('FLOWS_LAYER')).toBeInTheDocument();
      expect(screen.getByTestId('DESIGN_DECISIONS_LAYER')).toBeInTheDocument();
      expect(screen.getByTestId('REQUIREMENTS_LAYER')).toBeInTheDocument();
      expect(screen.queryByTestId('OBSERVABLES_LAYER')).toBeNull();
      expect(screen.queryByTestId('CONTRACTS_LAYER')).toBeNull();
    });

    it('VALID: {status: requirements_approved} => shows all sections', () => {
      QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'requirements_approved' });

      mantineRenderAdapter({
        ui: <QuestSpecPanelWidget quest={quest} onModify={jest.fn()} onRefresh={jest.fn()} />,
      });

      expect(screen.getByTestId('FLOWS_LAYER')).toBeInTheDocument();
      expect(screen.getByTestId('DESIGN_DECISIONS_LAYER')).toBeInTheDocument();
      expect(screen.getByTestId('REQUIREMENTS_LAYER')).toBeInTheDocument();
      expect(screen.getByTestId('OBSERVABLES_LAYER')).toBeInTheDocument();
      expect(screen.getByTestId('CONTRACTS_LAYER')).toBeInTheDocument();
    });

    it('VALID: {status: in_progress} => shows all sections', () => {
      QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'in_progress' });

      mantineRenderAdapter({
        ui: <QuestSpecPanelWidget quest={quest} onModify={jest.fn()} onRefresh={jest.fn()} />,
      });

      expect(screen.getByTestId('FLOWS_LAYER')).toBeInTheDocument();
      expect(screen.getByTestId('DESIGN_DECISIONS_LAYER')).toBeInTheDocument();
      expect(screen.getByTestId('REQUIREMENTS_LAYER')).toBeInTheDocument();
      expect(screen.getByTestId('OBSERVABLES_LAYER')).toBeInTheDocument();
      expect(screen.getByTestId('CONTRACTS_LAYER')).toBeInTheDocument();
    });
  });

  describe('clarifications', () => {
    it('VALID: {quest with clarifications} => renders clarifications layer (always visible)', () => {
      QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'created',
        clarifications: [
          QuestClarificationStub({
            id: 'b23bc10b-58cc-4372-a567-0e02b2c3d479',
            answer: 'Use REST API',
          }),
        ],
      });

      mantineRenderAdapter({
        ui: <QuestSpecPanelWidget quest={quest} onModify={jest.fn()} onRefresh={jest.fn()} />,
      });

      expect(screen.getByTestId('CLARIFICATIONS_LAYER')).toBeInTheDocument();
      expect(screen.getByText('Use REST API')).toBeInTheDocument();
    });

    it('EMPTY: {quest with empty clarifications} => still renders clarifications layer', () => {
      QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'created', clarifications: [] });

      mantineRenderAdapter({
        ui: <QuestSpecPanelWidget quest={quest} onModify={jest.fn()} onRefresh={jest.fn()} />,
      });

      expect(screen.getByTestId('CLARIFICATIONS_LAYER')).toBeInTheDocument();
    });
  });

  describe('edit mode', () => {
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
      const quest: Quest = QuestStub({ status: 'requirements_approved' });

      mantineRenderAdapter({
        ui: <QuestSpecPanelWidget quest={quest} onModify={jest.fn()} onRefresh={jest.fn()} />,
      });

      await proxy.clickModify();
      await proxy.clickCancel();

      expect(screen.getByTestId('PANEL_HEADER').textContent).toBe('OBSERVABLES APPROVAL');
    });

    it('VALID: {click MODIFY then SUBMIT without edits} => calls onModify with empty modifications', async () => {
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
    });

    it('VALID: {edit title then SUBMIT} => calls onModify with title modification', async () => {
      const proxy = QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({ title: 'Old Title' });
      const onModify = jest.fn();

      mantineRenderAdapter({
        ui: <QuestSpecPanelWidget quest={quest} onModify={onModify} onRefresh={jest.fn()} />,
      });

      await proxy.clickModify();

      const inputs = screen.getAllByTestId('FORM_INPUT');
      const titleInput = inputs[0] as HTMLInputElement;
      await userEvent.clear(titleInput);
      await userEvent.type(titleInput, 'New Title');

      await proxy.clickSubmit();

      expect(onModify).toHaveBeenCalledTimes(1);

      const callArg = onModify.mock.calls[0] as unknown[];
      const modifications = Reflect.get(callArg[0] as object, 'modifications') as Partial<Quest>;

      expect(modifications.title).toBe('New Title');
    });

    it('VALID: {edit title then CANCEL} => discards title change', async () => {
      const proxy = QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({ title: 'Original Title' });

      mantineRenderAdapter({
        ui: <QuestSpecPanelWidget quest={quest} onModify={jest.fn()} onRefresh={jest.fn()} />,
      });

      await proxy.clickModify();

      const inputs = screen.getAllByTestId('FORM_INPUT');
      const titleInput = inputs[0] as HTMLInputElement;
      await userEvent.clear(titleInput);
      await userEvent.type(titleInput, 'Changed Title');

      await proxy.clickCancel();

      expect(screen.getByTestId('QUEST_TITLE').textContent).toBe('Original Title');
    });

    it('VALID: {edit title then CANCEL then MODIFY again} => shows original quest title', async () => {
      const proxy = QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({ title: 'Original Title' });

      mantineRenderAdapter({
        ui: <QuestSpecPanelWidget quest={quest} onModify={jest.fn()} onRefresh={jest.fn()} />,
      });

      await proxy.clickModify();

      const inputs = screen.getAllByTestId('FORM_INPUT');
      const titleInput = inputs[0] as HTMLInputElement;
      await userEvent.clear(titleInput);
      await userEvent.type(titleInput, 'Changed Title');

      await proxy.clickCancel();
      await proxy.clickModify();

      const inputsAfterReopen = screen.getAllByTestId('FORM_INPUT');
      const titleInputAfterReopen = inputsAfterReopen[0] as HTMLInputElement;

      expect(titleInputAfterReopen.getAttribute('value')).toBe('Original Title');
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
    it('VALID: {quest with requirements, status: flows_approved} => renders requirements layer', () => {
      QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'flows_approved',
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

  describe('external update banner', () => {
    it('VALID: {editing + externalUpdatePending} => shows update banner', async () => {
      const proxy = QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub();

      mantineRenderAdapter({
        ui: (
          <QuestSpecPanelWidget
            quest={quest}
            onModify={jest.fn()}
            onRefresh={jest.fn()}
            externalUpdatePending={true}
            onDismissUpdate={jest.fn()}
          />
        ),
      });

      await proxy.clickModify();

      expect(proxy.hasBanner()).toBe(true);
    });

    it('VALID: {RELOAD clicked} => clears draft and dismisses', async () => {
      const proxy = QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({ title: 'Original Title' });
      const onDismissUpdate = jest.fn();

      mantineRenderAdapter({
        ui: (
          <QuestSpecPanelWidget
            quest={quest}
            onModify={jest.fn()}
            onRefresh={jest.fn()}
            externalUpdatePending={true}
            onDismissUpdate={onDismissUpdate}
          />
        ),
      });

      await proxy.clickModify();

      expect(proxy.hasBanner()).toBe(true);

      const callsBeforeReload = onDismissUpdate.mock.calls.length;

      await proxy.clickReload();

      expect(proxy.hasBanner()).toBe(false);
      expect(onDismissUpdate.mock.calls.length).toBeGreaterThan(callsBeforeReload);
    });

    it('VALID: {KEEP EDITING clicked} => dismisses without clearing draft', async () => {
      const proxy = QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub();
      const onDismissUpdate = jest.fn();

      mantineRenderAdapter({
        ui: (
          <QuestSpecPanelWidget
            quest={quest}
            onModify={jest.fn()}
            onRefresh={jest.fn()}
            externalUpdatePending={true}
            onDismissUpdate={onDismissUpdate}
          />
        ),
      });

      await proxy.clickModify();

      expect(proxy.hasBanner()).toBe(true);

      const callsBeforeKeep = onDismissUpdate.mock.calls.length;

      await proxy.clickKeepEditing();

      expect(onDismissUpdate.mock.calls.length).toBeGreaterThan(callsBeforeKeep);
      expect(screen.getByTestId('PANEL_HEADER').textContent).toBe('EDITING SPEC');
    });

    it('VALID: {not editing + externalUpdatePending} => auto-dismisses', () => {
      QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub();
      const onDismissUpdate = jest.fn();

      mantineRenderAdapter({
        ui: (
          <QuestSpecPanelWidget
            quest={quest}
            onModify={jest.fn()}
            onRefresh={jest.fn()}
            externalUpdatePending={true}
            onDismissUpdate={onDismissUpdate}
          />
        ),
      });

      expect(onDismissUpdate).toHaveBeenCalledTimes(1);
      expect(screen.queryByTestId('EXTERNAL_UPDATE_BANNER')).toBeNull();
    });
  });
});
