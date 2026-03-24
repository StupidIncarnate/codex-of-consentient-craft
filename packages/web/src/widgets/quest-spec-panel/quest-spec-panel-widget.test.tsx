import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { QuestStub, DesignDecisionStub, FlowStub } from '@dungeonmaster/shared/contracts';

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
        ui: <QuestSpecPanelWidget quest={quest} onModify={jest.fn()} />,
      });

      expect(screen.getByTestId('QUEST_TITLE').textContent).toBe('Add Authentication');
    });

    it('VALID: {quest with approvable status} => renders APPROVE and MODIFY buttons', () => {
      QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'review_flows',
        flows: [FlowStub()],
      });

      mantineRenderAdapter({
        ui: <QuestSpecPanelWidget quest={quest} onModify={jest.fn()} />,
      });

      const buttons = screen.getAllByTestId('PIXEL_BTN');
      const buttonTexts = buttons.map((button) => button.textContent);

      expect(buttonTexts).toStrictEqual(['APPROVE', 'MODIFY']);
    });

    it('VALID: {quest with terminal status} => renders only MODIFY button', () => {
      QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'approved' });

      mantineRenderAdapter({
        ui: <QuestSpecPanelWidget quest={quest} onModify={jest.fn()} />,
      });

      const buttons = screen.getAllByTestId('PIXEL_BTN');
      const buttonTexts = buttons.map((button) => button.textContent);

      expect(buttonTexts).toStrictEqual(['MODIFY']);
    });

    it('VALID: {click APPROVE, status: review_flows, has flows} => calls onModify with flows_approved status', async () => {
      const proxy = QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'review_flows',
        flows: [FlowStub()],
      });
      const onModify = jest.fn();

      mantineRenderAdapter({
        ui: <QuestSpecPanelWidget quest={quest} onModify={onModify} />,
      });

      await proxy.clickApprove();

      expect(onModify).toHaveBeenCalledTimes(1);
      expect(onModify).toHaveBeenCalledWith({
        modifications: { status: 'flows_approved' },
        action: 'approve',
        nextStatus: 'flows_approved',
      });
    });

    it('VALID: {status: created} => no APPROVE button (non-approvable status)', () => {
      QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'created',
        flows: [FlowStub()],
      });

      mantineRenderAdapter({
        ui: <QuestSpecPanelWidget quest={quest} onModify={jest.fn()} />,
      });

      const buttons = screen.getAllByTestId('PIXEL_BTN');
      const approveButton = buttons.find((button) => button.textContent === 'APPROVE');

      expect(approveButton).toBeUndefined();
    });

    it('VALID: {click APPROVE, status: review_observables, has flows} => calls onModify with approved status', async () => {
      const proxy = QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'review_observables',
        flows: [FlowStub()],
      });
      const onModify = jest.fn();

      mantineRenderAdapter({
        ui: <QuestSpecPanelWidget quest={quest} onModify={onModify} />,
      });

      await proxy.clickApprove();

      expect(onModify).toHaveBeenCalledTimes(1);
      expect(onModify).toHaveBeenCalledWith({
        modifications: { status: 'approved' },
        action: 'approve',
        nextStatus: 'approved',
      });
    });

    it('VALID: {status: approved} => APPROVE button is hidden', () => {
      QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'approved' });

      mantineRenderAdapter({
        ui: <QuestSpecPanelWidget quest={quest} onModify={jest.fn()} />,
      });

      const buttons = screen.getAllByTestId('PIXEL_BTN');
      const approveButton = buttons.find((button) => button.textContent === 'APPROVE');

      expect(approveButton).toBeUndefined();
    });
  });

  describe('approve gate content guard', () => {
    it('VALID: {status: review_flows, flows: [flow]} => APPROVE is enabled', () => {
      QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'review_flows',
        flows: [FlowStub()],
      });

      mantineRenderAdapter({
        ui: <QuestSpecPanelWidget quest={quest} onModify={jest.fn()} />,
      });

      const buttons = screen.getAllByTestId('PIXEL_BTN');
      const approveButton = buttons.find((button) => button.textContent === 'APPROVE');

      expect(approveButton?.style.opacity).toBe('1');
      expect(approveButton?.style.pointerEvents).toBe('auto');
    });

    it('VALID: {status: review_flows, flows: []} => APPROVE is disabled', () => {
      QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'review_flows',
        flows: [],
      });

      mantineRenderAdapter({
        ui: <QuestSpecPanelWidget quest={quest} onModify={jest.fn()} />,
      });

      const buttons = screen.getAllByTestId('PIXEL_BTN');
      const approveButton = buttons.find((button) => button.textContent === 'APPROVE');

      expect(approveButton?.style.opacity).toBe('0.4');
      expect(approveButton?.style.pointerEvents).toBe('none');
    });

    it('VALID: {status: review_observables, flows: [flow]} => APPROVE is enabled', () => {
      QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'review_observables',
        flows: [FlowStub()],
      });

      mantineRenderAdapter({
        ui: <QuestSpecPanelWidget quest={quest} onModify={jest.fn()} />,
      });

      const buttons = screen.getAllByTestId('PIXEL_BTN');
      const approveButton = buttons.find((button) => button.textContent === 'APPROVE');

      expect(approveButton?.style.opacity).toBe('1');
      expect(approveButton?.style.pointerEvents).toBe('auto');
    });

    it('VALID: {status: review_observables, flows: []} => APPROVE is disabled', () => {
      QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'review_observables',
        flows: [],
      });

      mantineRenderAdapter({
        ui: <QuestSpecPanelWidget quest={quest} onModify={jest.fn()} />,
      });

      const buttons = screen.getAllByTestId('PIXEL_BTN');
      const approveButton = buttons.find((button) => button.textContent === 'APPROVE');

      expect(approveButton?.style.opacity).toBe('0.4');
      expect(approveButton?.style.pointerEvents).toBe('none');
    });
  });

  describe('dynamic header', () => {
    it('VALID: {status: created} => renders QUEST CREATED header', () => {
      QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'created' });

      mantineRenderAdapter({
        ui: <QuestSpecPanelWidget quest={quest} onModify={jest.fn()} />,
      });

      expect(screen.getByTestId('PANEL_HEADER').textContent).toBe('QUEST CREATED');
    });

    it('VALID: {status: pending} => renders QUEST CREATED header', () => {
      QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'pending' });

      mantineRenderAdapter({
        ui: <QuestSpecPanelWidget quest={quest} onModify={jest.fn()} />,
      });

      expect(screen.getByTestId('PANEL_HEADER').textContent).toBe('QUEST CREATED');
    });

    it('VALID: {status: explore_flows} => renders EXPLORING FLOWS header', () => {
      QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'explore_flows' });

      mantineRenderAdapter({
        ui: <QuestSpecPanelWidget quest={quest} onModify={jest.fn()} />,
      });

      expect(screen.getByTestId('PANEL_HEADER').textContent).toBe('EXPLORING FLOWS');
    });

    it('VALID: {status: review_flows} => renders FLOW APPROVAL header', () => {
      QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'review_flows' });

      mantineRenderAdapter({
        ui: <QuestSpecPanelWidget quest={quest} onModify={jest.fn()} />,
      });

      expect(screen.getByTestId('PANEL_HEADER').textContent).toBe('FLOW APPROVAL');
    });

    it('VALID: {status: flows_approved} => renders FLOWS APPROVED header', () => {
      QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'flows_approved' });

      mantineRenderAdapter({
        ui: <QuestSpecPanelWidget quest={quest} onModify={jest.fn()} />,
      });

      expect(screen.getByTestId('PANEL_HEADER').textContent).toBe('FLOWS APPROVED');
    });

    it('VALID: {status: explore_observables} => renders EXPLORING OBSERVABLES header', () => {
      QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'explore_observables' });

      mantineRenderAdapter({
        ui: <QuestSpecPanelWidget quest={quest} onModify={jest.fn()} />,
      });

      expect(screen.getByTestId('PANEL_HEADER').textContent).toBe('EXPLORING OBSERVABLES');
    });

    it('VALID: {status: review_observables} => renders OBSERVABLES APPROVAL header', () => {
      QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'review_observables' });

      mantineRenderAdapter({
        ui: <QuestSpecPanelWidget quest={quest} onModify={jest.fn()} />,
      });

      expect(screen.getByTestId('PANEL_HEADER').textContent).toBe('OBSERVABLES APPROVAL');
    });

    it('VALID: {status: approved} => renders SPEC APPROVED header', () => {
      QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'approved' });

      mantineRenderAdapter({
        ui: <QuestSpecPanelWidget quest={quest} onModify={jest.fn()} />,
      });

      expect(screen.getByTestId('PANEL_HEADER').textContent).toBe('SPEC APPROVED');
    });

    it('VALID: {click MODIFY} => switches to EDITING SPEC header', async () => {
      const proxy = QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub();

      mantineRenderAdapter({
        ui: <QuestSpecPanelWidget quest={quest} onModify={jest.fn()} />,
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
        ui: <QuestSpecPanelWidget quest={quest} onModify={jest.fn()} />,
      });

      expect(screen.getByTestId('USER_REQUEST_SECTION')).toBeInTheDocument();
      expect(screen.getByTestId('USER_REQUEST_TEXT').textContent).toBe('Add login with OAuth');
    });

    it('VALID: {quest with default userRequest} => renders user request section', () => {
      QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub();

      mantineRenderAdapter({
        ui: <QuestSpecPanelWidget quest={quest} onModify={jest.fn()} />,
      });

      expect(screen.getByTestId('USER_REQUEST_SECTION')).toBeInTheDocument();
    });
  });

  describe('gate visibility', () => {
    it('VALID: {status: created} => shows flows and design decisions, hides contracts', () => {
      QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'created',
      });

      mantineRenderAdapter({
        ui: <QuestSpecPanelWidget quest={quest} onModify={jest.fn()} />,
      });

      expect(screen.getByTestId('FLOWS_LAYER')).toBeInTheDocument();
      expect(screen.getByTestId('DESIGN_DECISIONS_LAYER')).toBeInTheDocument();
      expect(screen.queryByTestId('CONTRACTS_LAYER')).toBeNull();
    });

    it('VALID: {status: pending} => shows flows and design decisions, hides contracts', () => {
      QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'pending' });

      mantineRenderAdapter({
        ui: <QuestSpecPanelWidget quest={quest} onModify={jest.fn()} />,
      });

      expect(screen.getByTestId('FLOWS_LAYER')).toBeInTheDocument();
      expect(screen.getByTestId('DESIGN_DECISIONS_LAYER')).toBeInTheDocument();
      expect(screen.queryByTestId('CONTRACTS_LAYER')).toBeNull();
    });

    it('VALID: {status: explore_flows} => shows flows and design decisions, hides contracts', () => {
      QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'explore_flows' });

      mantineRenderAdapter({
        ui: <QuestSpecPanelWidget quest={quest} onModify={jest.fn()} />,
      });

      expect(screen.getByTestId('FLOWS_LAYER')).toBeInTheDocument();
      expect(screen.getByTestId('DESIGN_DECISIONS_LAYER')).toBeInTheDocument();
      expect(screen.queryByTestId('CONTRACTS_LAYER')).toBeNull();
    });

    it('VALID: {status: review_flows} => shows flows and design decisions, hides contracts', () => {
      QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'review_flows' });

      mantineRenderAdapter({
        ui: <QuestSpecPanelWidget quest={quest} onModify={jest.fn()} />,
      });

      expect(screen.getByTestId('FLOWS_LAYER')).toBeInTheDocument();
      expect(screen.getByTestId('DESIGN_DECISIONS_LAYER')).toBeInTheDocument();
      expect(screen.queryByTestId('CONTRACTS_LAYER')).toBeNull();
    });

    it('VALID: {status: flows_approved} => shows flows, design decisions, and contracts', () => {
      QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'flows_approved',
      });

      mantineRenderAdapter({
        ui: <QuestSpecPanelWidget quest={quest} onModify={jest.fn()} />,
      });

      expect(screen.getByTestId('FLOWS_LAYER')).toBeInTheDocument();
      expect(screen.getByTestId('DESIGN_DECISIONS_LAYER')).toBeInTheDocument();
      expect(screen.getByTestId('CONTRACTS_LAYER')).toBeInTheDocument();
    });

    it('VALID: {status: explore_observables} => shows flows, design decisions, and contracts', () => {
      QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'explore_observables' });

      mantineRenderAdapter({
        ui: <QuestSpecPanelWidget quest={quest} onModify={jest.fn()} />,
      });

      expect(screen.getByTestId('FLOWS_LAYER')).toBeInTheDocument();
      expect(screen.getByTestId('DESIGN_DECISIONS_LAYER')).toBeInTheDocument();
      expect(screen.getByTestId('CONTRACTS_LAYER')).toBeInTheDocument();
    });

    it('VALID: {status: review_observables} => shows flows, design decisions, and contracts', () => {
      QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'review_observables' });

      mantineRenderAdapter({
        ui: <QuestSpecPanelWidget quest={quest} onModify={jest.fn()} />,
      });

      expect(screen.getByTestId('FLOWS_LAYER')).toBeInTheDocument();
      expect(screen.getByTestId('DESIGN_DECISIONS_LAYER')).toBeInTheDocument();
      expect(screen.getByTestId('CONTRACTS_LAYER')).toBeInTheDocument();
    });

    it('VALID: {status: in_progress} => shows all sections', () => {
      QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'in_progress' });

      mantineRenderAdapter({
        ui: <QuestSpecPanelWidget quest={quest} onModify={jest.fn()} />,
      });

      expect(screen.getByTestId('FLOWS_LAYER')).toBeInTheDocument();
      expect(screen.getByTestId('DESIGN_DECISIONS_LAYER')).toBeInTheDocument();
      expect(screen.getByTestId('CONTRACTS_LAYER')).toBeInTheDocument();
    });
  });

  describe('edit mode', () => {
    it('VALID: {click MODIFY} => renders SUBMIT and CANCEL buttons', async () => {
      const proxy = QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub();

      mantineRenderAdapter({
        ui: <QuestSpecPanelWidget quest={quest} onModify={jest.fn()} />,
      });

      await proxy.clickModify();

      const actionBar = screen.getByTestId('ACTION_BAR');
      const buttons = actionBar.querySelectorAll('[data-testid="PIXEL_BTN"]');
      const buttonTexts = Array.from(buttons).map((button) => button.textContent);

      expect(buttonTexts).toStrictEqual(['SUBMIT', 'CANCEL']);
    });

    it('VALID: {click MODIFY then CANCEL} => returns to read mode', async () => {
      const proxy = QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'flows_approved' });

      mantineRenderAdapter({
        ui: <QuestSpecPanelWidget quest={quest} onModify={jest.fn()} />,
      });

      await proxy.clickModify();
      await proxy.clickCancel();

      expect(screen.getByTestId('PANEL_HEADER').textContent).toBe('FLOWS APPROVED');
    });

    it('VALID: {click MODIFY then SUBMIT without edits} => calls onModify with empty modifications', async () => {
      const proxy = QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub();
      const onModify = jest.fn();

      mantineRenderAdapter({
        ui: <QuestSpecPanelWidget quest={quest} onModify={onModify} />,
      });

      await proxy.clickModify();
      await proxy.clickSubmit();

      expect(onModify).toHaveBeenCalledTimes(1);
      expect(onModify).toHaveBeenCalledWith({ modifications: {}, action: 'submit' });
    });

    it('VALID: {edit title then SUBMIT} => calls onModify with title modification', async () => {
      const proxy = QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({ title: 'Old Title' });
      const onModify = jest.fn();

      mantineRenderAdapter({
        ui: <QuestSpecPanelWidget quest={quest} onModify={onModify} />,
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
        ui: <QuestSpecPanelWidget quest={quest} onModify={jest.fn()} />,
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
        ui: <QuestSpecPanelWidget quest={quest} onModify={jest.fn()} />,
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
        ui: <QuestSpecPanelWidget quest={quest} onModify={jest.fn()} />,
      });

      await proxy.clickModify();

      const inputs = screen.getAllByTestId('FORM_INPUT');
      const firstInput = inputs[0] as HTMLInputElement | undefined;

      expect(firstInput?.getAttribute('value')).toBe('My Quest');
    });
  });

  describe('design decisions layer', () => {
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
        ui: <QuestSpecPanelWidget quest={quest} onModify={jest.fn()} />,
      });

      expect(screen.getByText('Use JWT')).toBeInTheDocument();
    });
  });

  describe('empty states', () => {
    it('EDGE: {quest with empty arrays} => renders without crash', () => {
      QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({ designDecisions: [] });

      mantineRenderAdapter({
        ui: <QuestSpecPanelWidget quest={quest} onModify={jest.fn()} />,
      });

      expect(screen.getByTestId('QUEST_SPEC_PANEL')).toBeInTheDocument();
    });
  });

  describe('readOnly mode', () => {
    it('VALID: {readOnly: true} => hides action bar', () => {
      QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'review_flows' });

      mantineRenderAdapter({
        ui: <QuestSpecPanelWidget quest={quest} readOnly={true} />,
      });

      expect(screen.queryByTestId('ACTION_BAR')).toBeNull();
    });

    it('VALID: {readOnly: false} => shows action bar', () => {
      QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'review_flows' });

      mantineRenderAdapter({
        ui: <QuestSpecPanelWidget quest={quest} readOnly={false} onModify={jest.fn()} />,
      });

      expect(screen.getByTestId('ACTION_BAR')).toBeInTheDocument();
    });

    it('VALID: {readOnly: true} => still renders quest title and content', () => {
      QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'review_flows',
        title: 'Read Only Quest',
      });

      mantineRenderAdapter({
        ui: <QuestSpecPanelWidget quest={quest} readOnly={true} />,
      });

      expect(screen.getByTestId('QUEST_TITLE').textContent).toBe('Read Only Quest');
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
