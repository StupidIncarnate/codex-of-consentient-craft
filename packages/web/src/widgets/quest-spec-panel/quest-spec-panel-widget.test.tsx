import { screen, waitFor } from '@testing-library/react';

import {
  QuestStub,
  DesignDecisionStub,
  FlowEdgeStub,
  FlowNodeStub,
  FlowObservableStub,
  FlowStub,
  OperationItemStub,
  QuestCommentStub,
  SessionIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';
import { questStatusMetadataStatics } from '@dungeonmaster/shared/statics';

import { AskUserQuestionStub } from '@dungeonmaster/shared/contracts';
import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { CommentQueueEntryStub } from '../../contracts/comment-queue-entry/comment-queue-entry.stub';
import { QuestSpecPanelWidget } from './quest-spec-panel-widget';
import { QuestSpecPanelWidgetProxy } from './quest-spec-panel-widget.proxy';

type Quest = ReturnType<typeof QuestStub>;
type StatusKey = keyof typeof questStatusMetadataStatics.statuses;

describe('QuestSpecPanelWidget', () => {
  describe('read mode', () => {
    it('VALID: {quest} => renders quest title', () => {
      const proxy = QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({ title: 'Add Authentication' });

      mantineRenderAdapter({
        ui: (
          <QuestSpecPanelWidget
            quest={quest}
            onModify={jest.fn()}
            onSendComments={proxy.onSendComments}
          />
        ),
      });

      expect(screen.getByTestId('QUEST_TITLE').textContent).toBe('Add Authentication');
    });

    it('VALID: {quest with approvable status} => renders APPROVE button only', () => {
      const proxy = QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'review_flows',
        flows: [FlowStub()],
      });

      mantineRenderAdapter({
        ui: (
          <QuestSpecPanelWidget
            quest={quest}
            onModify={jest.fn()}
            onSendComments={proxy.onSendComments}
          />
        ),
      });

      expect(proxy.getActionBarButtonLabels()).toStrictEqual(['APPROVE']);
    });

    it('VALID: {quest with terminal status} => renders no action bar buttons', () => {
      const proxy = QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'approved' });

      mantineRenderAdapter({
        ui: (
          <QuestSpecPanelWidget
            quest={quest}
            onModify={jest.fn()}
            onSendComments={proxy.onSendComments}
          />
        ),
      });

      expect(proxy.getActionBarButtonLabels()).toStrictEqual([]);
    });

    it('VALID: {click APPROVE, status: review_flows, has flows} => calls onModify with flows_approved status', async () => {
      const proxy = QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'review_flows',
        flows: [FlowStub()],
      });
      const onModify = jest.fn();

      mantineRenderAdapter({
        ui: (
          <QuestSpecPanelWidget
            quest={quest}
            onModify={onModify}
            onSendComments={proxy.onSendComments}
          />
        ),
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
      const proxy = QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'created',
        flows: [FlowStub()],
      });

      mantineRenderAdapter({
        ui: (
          <QuestSpecPanelWidget
            quest={quest}
            onModify={jest.fn()}
            onSendComments={proxy.onSendComments}
          />
        ),
      });

      const buttons = screen.queryAllByTestId('PIXEL_BTN');
      const approveButton = buttons.find((button) => button.textContent === 'APPROVE');

      expect(approveButton).toBe(undefined);
    });

    it('VALID: {click APPROVE, status: review_observables, has flows and codeweaver operation} => calls onModify with approved status', async () => {
      const proxy = QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'review_observables',
        flows: [FlowStub()],
        operations: [OperationItemStub({ role: 'codeweaver' })],
      });
      const onModify = jest.fn();

      mantineRenderAdapter({
        ui: (
          <QuestSpecPanelWidget
            quest={quest}
            onModify={onModify}
            onSendComments={proxy.onSendComments}
          />
        ),
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
      const proxy = QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'approved' });

      mantineRenderAdapter({
        ui: (
          <QuestSpecPanelWidget
            quest={quest}
            onModify={jest.fn()}
            onSendComments={proxy.onSendComments}
          />
        ),
      });

      const buttons = screen.queryAllByTestId('PIXEL_BTN');
      const approveButton = buttons.find((button) => button.textContent === 'APPROVE');

      expect(approveButton).toBe(undefined);
    });
  });

  describe('approve without onModify', () => {
    // onModify is optional on the props — a caller that renders the panel purely to display an
    // approvable quest (no write path wired up) must not crash when APPROVE is clicked.
    it('EDGE: {no onModify provided, click APPROVE} => does not throw and the panel stays rendered', async () => {
      const proxy = QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'review_flows',
        flows: [FlowStub()],
      });

      mantineRenderAdapter({
        ui: <QuestSpecPanelWidget quest={quest} onSendComments={proxy.onSendComments} />,
      });

      await proxy.clickApprove();

      expect(screen.getByTestId('QUEST_SPEC_PANEL')).toBeInTheDocument();
    });
  });

  describe('approve gate content guard', () => {
    it('VALID: {status: review_flows, flows: [flow]} => APPROVE is enabled', () => {
      const proxy = QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'review_flows',
        flows: [FlowStub()],
      });

      mantineRenderAdapter({
        ui: (
          <QuestSpecPanelWidget
            quest={quest}
            onModify={jest.fn()}
            onSendComments={proxy.onSendComments}
          />
        ),
      });

      const buttons = screen.getAllByTestId('PIXEL_BTN');
      const approveButton = buttons.find((button) => button.textContent === 'APPROVE');

      expect(approveButton?.style.opacity).toBe('1');
      expect(approveButton?.style.pointerEvents).toBe('auto');
    });

    it('VALID: {status: review_flows, flows: []} => APPROVE is disabled', () => {
      const proxy = QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'review_flows',
        flows: [],
      });

      mantineRenderAdapter({
        ui: (
          <QuestSpecPanelWidget
            quest={quest}
            onModify={jest.fn()}
            onSendComments={proxy.onSendComments}
          />
        ),
      });

      const buttons = screen.getAllByTestId('PIXEL_BTN');
      const approveButton = buttons.find((button) => button.textContent === 'APPROVE');

      expect(approveButton?.style.opacity).toBe('0.4');
      expect(approveButton?.style.pointerEvents).toBe('none');
    });

    it('VALID: {status: review_observables, flows: [flow], operations: [codeweaver]} => APPROVE is enabled', () => {
      const proxy = QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'review_observables',
        flows: [FlowStub()],
        operations: [OperationItemStub({ role: 'codeweaver' })],
      });

      mantineRenderAdapter({
        ui: (
          <QuestSpecPanelWidget
            quest={quest}
            onModify={jest.fn()}
            onSendComments={proxy.onSendComments}
          />
        ),
      });

      const buttons = screen.getAllByTestId('PIXEL_BTN');
      const approveButton = buttons.find((button) => button.textContent === 'APPROVE');

      expect(approveButton?.style.opacity).toBe('1');
      expect(approveButton?.style.pointerEvents).toBe('auto');
    });

    it('VALID: {status: review_observables, flows: [flow], no codeweaver operation} => APPROVE is disabled (feature quests need a codeweaver operation item)', () => {
      const proxy = QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'review_observables',
        flows: [FlowStub()],
        operations: [],
      });

      mantineRenderAdapter({
        ui: (
          <QuestSpecPanelWidget
            quest={quest}
            onModify={jest.fn()}
            onSendComments={proxy.onSendComments}
          />
        ),
      });

      const buttons = screen.getAllByTestId('PIXEL_BTN');
      const approveButton = buttons.find((button) => button.textContent === 'APPROVE');

      expect(approveButton?.style.opacity).toBe('0.4');
      expect(approveButton?.style.pointerEvents).toBe('none');
    });

    it('VALID: {status: review_observables, flows: []} => APPROVE is disabled', () => {
      const proxy = QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'review_observables',
        flows: [],
      });

      mantineRenderAdapter({
        ui: (
          <QuestSpecPanelWidget
            quest={quest}
            onModify={jest.fn()}
            onSendComments={proxy.onSendComments}
          />
        ),
      });

      const buttons = screen.getAllByTestId('PIXEL_BTN');
      const approveButton = buttons.find((button) => button.textContent === 'APPROVE');

      expect(approveButton?.style.opacity).toBe('0.4');
      expect(approveButton?.style.pointerEvents).toBe('none');
    });
  });

  describe('dynamic header', () => {
    it('VALID: {status: created} => renders QUEST CREATED header', () => {
      const proxy = QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'created' });

      mantineRenderAdapter({
        ui: (
          <QuestSpecPanelWidget
            quest={quest}
            onModify={jest.fn()}
            onSendComments={proxy.onSendComments}
          />
        ),
      });

      expect(screen.getByTestId('PANEL_HEADER').textContent).toBe('QUEST CREATED');
    });

    it('VALID: {status: pending} => renders QUEST CREATED header', () => {
      const proxy = QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'pending' });

      mantineRenderAdapter({
        ui: (
          <QuestSpecPanelWidget
            quest={quest}
            onModify={jest.fn()}
            onSendComments={proxy.onSendComments}
          />
        ),
      });

      expect(screen.getByTestId('PANEL_HEADER').textContent).toBe('QUEST CREATED');
    });

    it('VALID: {status: explore_flows} => renders EXPLORING FLOWS header', () => {
      const proxy = QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'explore_flows' });

      mantineRenderAdapter({
        ui: (
          <QuestSpecPanelWidget
            quest={quest}
            onModify={jest.fn()}
            onSendComments={proxy.onSendComments}
          />
        ),
      });

      expect(screen.getByTestId('PANEL_HEADER').textContent).toBe('EXPLORING FLOWS');
    });

    it('VALID: {status: review_flows} => renders FLOW APPROVAL header', () => {
      const proxy = QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'review_flows' });

      mantineRenderAdapter({
        ui: (
          <QuestSpecPanelWidget
            quest={quest}
            onModify={jest.fn()}
            onSendComments={proxy.onSendComments}
          />
        ),
      });

      expect(screen.getByTestId('PANEL_HEADER').textContent).toBe('FLOW APPROVAL');
    });

    it('VALID: {status: flows_approved} => renders FLOWS APPROVED header', () => {
      const proxy = QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'flows_approved' });

      mantineRenderAdapter({
        ui: (
          <QuestSpecPanelWidget
            quest={quest}
            onModify={jest.fn()}
            onSendComments={proxy.onSendComments}
          />
        ),
      });

      expect(screen.getByTestId('PANEL_HEADER').textContent).toBe('FLOWS APPROVED');
    });

    it('VALID: {status: explore_observables} => renders EXPLORING OBSERVABLES header', () => {
      const proxy = QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'explore_observables' });

      mantineRenderAdapter({
        ui: (
          <QuestSpecPanelWidget
            quest={quest}
            onModify={jest.fn()}
            onSendComments={proxy.onSendComments}
          />
        ),
      });

      expect(screen.getByTestId('PANEL_HEADER').textContent).toBe('EXPLORING OBSERVABLES');
    });

    it('VALID: {status: review_observables} => renders OBSERVABLES APPROVAL header', () => {
      const proxy = QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'review_observables' });

      mantineRenderAdapter({
        ui: (
          <QuestSpecPanelWidget
            quest={quest}
            onModify={jest.fn()}
            onSendComments={proxy.onSendComments}
          />
        ),
      });

      expect(screen.getByTestId('PANEL_HEADER').textContent).toBe('OBSERVABLES APPROVAL');
    });

    it('VALID: {status: approved} => renders SPEC APPROVED header', () => {
      const proxy = QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'approved' });

      mantineRenderAdapter({
        ui: (
          <QuestSpecPanelWidget
            quest={quest}
            onModify={jest.fn()}
            onSendComments={proxy.onSendComments}
          />
        ),
      });

      expect(screen.getByTestId('PANEL_HEADER').textContent).toBe('SPEC APPROVED');
    });
  });

  describe('user request', () => {
    it('VALID: {quest with userRequest} => renders user request section', () => {
      const proxy = QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({
        userRequest: 'Add login with OAuth' as Quest['userRequest'],
      });

      mantineRenderAdapter({
        ui: (
          <QuestSpecPanelWidget
            quest={quest}
            onModify={jest.fn()}
            onSendComments={proxy.onSendComments}
          />
        ),
      });

      expect(screen.getByTestId('USER_REQUEST_SECTION')).toBeInTheDocument();
      expect(screen.getByTestId('USER_REQUEST_TEXT').textContent).toBe('Add login with OAuth');
    });

    it('VALID: {quest with default userRequest} => renders user request section', () => {
      const proxy = QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub();

      mantineRenderAdapter({
        ui: (
          <QuestSpecPanelWidget
            quest={quest}
            onModify={jest.fn()}
            onSendComments={proxy.onSendComments}
          />
        ),
      });

      expect(screen.getByTestId('USER_REQUEST_SECTION')).toBeInTheDocument();
    });
  });

  describe('operations section', () => {
    it('VALID: {quest with operations, DETAILS tab} => renders OPERATIONS section with ledger rows in order', async () => {
      const proxy = QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({
        operations: [
          OperationItemStub({
            id: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d401',
            role: 'codeweaver',
            text: 'build the broker',
            status: 'complete',
          }),
          OperationItemStub({
            id: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d402',
            role: 'ward',
            text: 'verify: ward',
            status: 'pending',
            wardMode: 'full',
          }),
        ],
      });

      mantineRenderAdapter({
        ui: (
          <QuestSpecPanelWidget
            quest={quest}
            onModify={jest.fn()}
            onSendComments={proxy.onSendComments}
          />
        ),
      });

      await proxy.clickDetailsTab();

      expect(proxy.hasOperationsSection()).toBe(true);
      expect(proxy.getOperationsLedgerRows().map((r) => r.textContent)).toStrictEqual([
        '[x][CODEWEAVER]build the broker',
        '[ ][WARD]verify: ward(full)',
      ]);
    });

    it('EMPTY: {quest with no operations, DETAILS tab} => does not render OPERATIONS section', async () => {
      const proxy = QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({ operations: [] });

      mantineRenderAdapter({
        ui: (
          <QuestSpecPanelWidget
            quest={quest}
            onModify={jest.fn()}
            onSendComments={proxy.onSendComments}
          />
        ),
      });

      // On the tab that WOULD show it — otherwise "absent" only proves the SPEC tab was showing.
      await proxy.clickDetailsTab();

      expect(proxy.hasOperationsSection()).toBe(false);
      expect(proxy.getOperationsLedgerRows()).toStrictEqual([]);
    });
  });

  describe('spec / details tabs', () => {
    it('VALID: {panel rendered} => SPEC and DETAILS are the whole tab set, SPEC active', () => {
      const proxy = QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'in_progress' });

      mantineRenderAdapter({
        ui: (
          <QuestSpecPanelWidget
            quest={quest}
            onModify={jest.fn()}
            onSendComments={proxy.onSendComments}
          />
        ),
      });

      expect(proxy.getTabLabels()).toStrictEqual(['SPEC', 'DETAILS']);
      expect(proxy.getActiveTabLabel()).toBe('SPEC');
    });

    it('VALID: {SPEC tab active} => user request and flows render, design decisions and tooling do not', () => {
      const proxy = QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'in_progress',
        userRequest: 'Fill the bubble when a comment is queued',
        designDecisions: [
          DesignDecisionStub({
            id: 'c23bc10b-58cc-4372-a567-0e02b2c3d479',
            title: 'Use JWT',
          }),
        ],
      });

      mantineRenderAdapter({
        ui: (
          <QuestSpecPanelWidget
            quest={quest}
            onModify={jest.fn()}
            onSendComments={proxy.onSendComments}
          />
        ),
      });

      expect(screen.getByTestId('USER_REQUEST_TEXT').textContent).toBe(
        'Fill the bubble when a comment is queued',
      );
      expect(screen.getByTestId('FLOWS_LAYER')).toBeInTheDocument();
      expect(screen.queryByTestId('DESIGN_DECISIONS_LAYER')).toBe(null);
      expect(screen.queryByTestId('CONTRACTS_LAYER')).toBe(null);
    });

    it('VALID: {DETAILS tab clicked} => design decisions and tooling render, flows and user request do not', async () => {
      const proxy = QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'in_progress',
        userRequest: 'Fill the bubble when a comment is queued',
        designDecisions: [
          DesignDecisionStub({
            id: 'c23bc10b-58cc-4372-a567-0e02b2c3d479',
            title: 'Use JWT',
          }),
        ],
      });

      mantineRenderAdapter({
        ui: (
          <QuestSpecPanelWidget
            quest={quest}
            onModify={jest.fn()}
            onSendComments={proxy.onSendComments}
          />
        ),
      });

      await proxy.clickDetailsTab();

      expect(proxy.getActiveTabLabel()).toBe('DETAILS');
      expect(screen.getByTestId('DESIGN_DECISIONS_LAYER')).toBeInTheDocument();
      expect(screen.getByTestId('CONTRACTS_LAYER')).toBeInTheDocument();
      // The flow view is unmounted rather than hidden — it is what the SPEC tab gives its whole
      // remaining height to, so a DETAILS tab that kept it mounted would still be paying for it.
      expect(screen.queryByTestId('FLOWS_LAYER')).toBe(null);
      expect(screen.queryByTestId('USER_REQUEST_SECTION')).toBe(null);
    });

    it('VALID: {DETAILS tab then SPEC tab} => the flow view comes back', async () => {
      const proxy = QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'in_progress' });

      mantineRenderAdapter({
        ui: (
          <QuestSpecPanelWidget
            quest={quest}
            onModify={jest.fn()}
            onSendComments={proxy.onSendComments}
          />
        ),
      });

      await proxy.clickDetailsTab();
      await proxy.clickSpecTab();

      expect(proxy.getActiveTabLabel()).toBe('SPEC');
      expect(screen.getByTestId('FLOWS_LAYER')).toBeInTheDocument();
      expect(screen.queryByTestId('DESIGN_DECISIONS_LAYER')).toBe(null);
    });

    it('VALID: {DETAILS tab clicked} => APPROVE and the queue bar stay reachable', async () => {
      const proxy = QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'review_flows' });
      proxy.setupQueuedComments({
        questId: quest.id,
        entries: [CommentQueueEntryStub({ text: 'still queued while reading DETAILS' })],
      });

      mantineRenderAdapter({
        ui: (
          <QuestSpecPanelWidget
            quest={quest}
            onModify={jest.fn()}
            onSendComments={proxy.onSendComments}
          />
        ),
      });

      await proxy.clickDetailsTab();

      // Both bars are siblings of the tab content, not children of it, so switching tabs must not
      // strand a queued batch or take the gate control away mid-review.
      expect(proxy.getActionBarButtonLabels()).toStrictEqual(['APPROVE']);
      expect(proxy.hasQueueBar()).toBe(true);
    });

    it('VALID: {readOnly panel, DETAILS tab clicked} => the execution surface splits the same way', async () => {
      const proxy = QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'in_progress',
        designDecisions: [
          DesignDecisionStub({
            id: 'c23bc10b-58cc-4372-a567-0e02b2c3d479',
            title: 'Use JWT',
          }),
        ],
      });

      mantineRenderAdapter({ ui: <QuestSpecPanelWidget quest={quest} readOnly={true} /> });

      expect(screen.getByTestId('FLOWS_LAYER')).toBeInTheDocument();

      await proxy.clickDetailsTab();

      expect(screen.getByTestId('DECISION_TITLE').textContent).toBe('Use JWT');
      expect(screen.queryByTestId('FLOWS_LAYER')).toBe(null);
    });

    it('VALID: {long user request} => the request block is capped and scrolls instead of growing', () => {
      const proxy = QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'in_progress',
        userRequest: 'a very long request '.repeat(50),
      });

      mantineRenderAdapter({
        ui: (
          <QuestSpecPanelWidget
            quest={quest}
            onModify={jest.fn()}
            onSendComments={proxy.onSendComments}
          />
        ),
      });

      // The cap is what keeps "request on top, flow view taking the rest" true for a request of
      // any length — uncapped, a long one pushes the diagram off the bottom of the panel.
      const userRequest = screen.getByTestId('USER_REQUEST_SECTION');

      expect({
        maxHeight: userRequest.style.maxHeight,
        overflowY: userRequest.style.overflowY,
        flexShrink: userRequest.style.flexShrink,
      }).toStrictEqual({ maxHeight: '120px', overflowY: 'auto', flexShrink: '0' });
    });
  });

  describe('gate visibility', () => {
    it('VALID: {status: created} => SPEC shows flows, DETAILS shows design decisions and hides contracts', async () => {
      const proxy = QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'created',
      });

      mantineRenderAdapter({
        ui: (
          <QuestSpecPanelWidget
            quest={quest}
            onModify={jest.fn()}
            onSendComments={proxy.onSendComments}
          />
        ),
      });

      expect(screen.getByTestId('FLOWS_LAYER')).toBeInTheDocument();

      await proxy.clickDetailsTab();

      expect(screen.getByTestId('DESIGN_DECISIONS_LAYER')).toBeInTheDocument();
      expect(screen.queryByTestId('CONTRACTS_LAYER')).toBe(null);
    });

    it('VALID: {status: pending} => SPEC shows flows, DETAILS shows design decisions and hides contracts', async () => {
      const proxy = QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'pending' });

      mantineRenderAdapter({
        ui: (
          <QuestSpecPanelWidget
            quest={quest}
            onModify={jest.fn()}
            onSendComments={proxy.onSendComments}
          />
        ),
      });

      expect(screen.getByTestId('FLOWS_LAYER')).toBeInTheDocument();

      await proxy.clickDetailsTab();

      expect(screen.getByTestId('DESIGN_DECISIONS_LAYER')).toBeInTheDocument();
      expect(screen.queryByTestId('CONTRACTS_LAYER')).toBe(null);
    });

    it('VALID: {status: explore_flows} => SPEC shows flows, DETAILS shows design decisions and hides contracts', async () => {
      const proxy = QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'explore_flows' });

      mantineRenderAdapter({
        ui: (
          <QuestSpecPanelWidget
            quest={quest}
            onModify={jest.fn()}
            onSendComments={proxy.onSendComments}
          />
        ),
      });

      expect(screen.getByTestId('FLOWS_LAYER')).toBeInTheDocument();

      await proxy.clickDetailsTab();

      expect(screen.getByTestId('DESIGN_DECISIONS_LAYER')).toBeInTheDocument();
      expect(screen.queryByTestId('CONTRACTS_LAYER')).toBe(null);
    });

    it('VALID: {status: review_flows} => SPEC shows flows, DETAILS shows design decisions and hides contracts', async () => {
      const proxy = QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'review_flows' });

      mantineRenderAdapter({
        ui: (
          <QuestSpecPanelWidget
            quest={quest}
            onModify={jest.fn()}
            onSendComments={proxy.onSendComments}
          />
        ),
      });

      expect(screen.getByTestId('FLOWS_LAYER')).toBeInTheDocument();

      await proxy.clickDetailsTab();

      expect(screen.getByTestId('DESIGN_DECISIONS_LAYER')).toBeInTheDocument();
      expect(screen.queryByTestId('CONTRACTS_LAYER')).toBe(null);
    });

    it('VALID: {status: flows_approved} => SPEC shows flows, DETAILS shows design decisions and contracts', async () => {
      const proxy = QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'flows_approved',
      });

      mantineRenderAdapter({
        ui: (
          <QuestSpecPanelWidget
            quest={quest}
            onModify={jest.fn()}
            onSendComments={proxy.onSendComments}
          />
        ),
      });

      expect(screen.getByTestId('FLOWS_LAYER')).toBeInTheDocument();

      await proxy.clickDetailsTab();

      expect(screen.getByTestId('DESIGN_DECISIONS_LAYER')).toBeInTheDocument();
      expect(screen.getByTestId('CONTRACTS_LAYER')).toBeInTheDocument();
    });

    it('VALID: {status: explore_observables} => SPEC shows flows, DETAILS shows design decisions and contracts', async () => {
      const proxy = QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'explore_observables' });

      mantineRenderAdapter({
        ui: (
          <QuestSpecPanelWidget
            quest={quest}
            onModify={jest.fn()}
            onSendComments={proxy.onSendComments}
          />
        ),
      });

      expect(screen.getByTestId('FLOWS_LAYER')).toBeInTheDocument();

      await proxy.clickDetailsTab();

      expect(screen.getByTestId('DESIGN_DECISIONS_LAYER')).toBeInTheDocument();
      expect(screen.getByTestId('CONTRACTS_LAYER')).toBeInTheDocument();
    });

    it('VALID: {status: review_observables} => SPEC shows flows, DETAILS shows design decisions and contracts', async () => {
      const proxy = QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'review_observables' });

      mantineRenderAdapter({
        ui: (
          <QuestSpecPanelWidget
            quest={quest}
            onModify={jest.fn()}
            onSendComments={proxy.onSendComments}
          />
        ),
      });

      expect(screen.getByTestId('FLOWS_LAYER')).toBeInTheDocument();

      await proxy.clickDetailsTab();

      expect(screen.getByTestId('DESIGN_DECISIONS_LAYER')).toBeInTheDocument();
      expect(screen.getByTestId('CONTRACTS_LAYER')).toBeInTheDocument();
    });

    it('VALID: {status: in_progress} => SPEC shows flows, DETAILS shows design decisions and contracts', async () => {
      const proxy = QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'in_progress' });

      mantineRenderAdapter({
        ui: (
          <QuestSpecPanelWidget
            quest={quest}
            onModify={jest.fn()}
            onSendComments={proxy.onSendComments}
          />
        ),
      });

      expect(screen.getByTestId('FLOWS_LAYER')).toBeInTheDocument();

      await proxy.clickDetailsTab();

      expect(screen.getByTestId('DESIGN_DECISIONS_LAYER')).toBeInTheDocument();
      expect(screen.getByTestId('CONTRACTS_LAYER')).toBeInTheDocument();
    });
  });

  describe('design decisions layer', () => {
    it('VALID: {quest with design decisions, DETAILS tab} => renders design decisions', async () => {
      const proxy = QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({
        designDecisions: [
          DesignDecisionStub({
            id: 'c23bc10b-58cc-4372-a567-0e02b2c3d479',
            title: 'Use JWT',
          }),
        ],
      });

      mantineRenderAdapter({
        ui: (
          <QuestSpecPanelWidget
            quest={quest}
            onModify={jest.fn()}
            onSendComments={proxy.onSendComments}
          />
        ),
      });

      await proxy.clickDetailsTab();

      expect(screen.getByTestId('DECISION_TITLE').textContent).toBe('Use JWT');
    });
  });

  describe('empty states', () => {
    it('EDGE: {quest with empty arrays} => renders without crash', () => {
      const proxy = QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({ designDecisions: [] });

      mantineRenderAdapter({
        ui: (
          <QuestSpecPanelWidget
            quest={quest}
            onModify={jest.fn()}
            onSendComments={proxy.onSendComments}
          />
        ),
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

      expect(screen.queryByTestId('ACTION_BAR')).toBe(null);
    });

    it('VALID: {readOnly: false} => shows action bar', () => {
      const proxy = QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'review_flows' });

      mantineRenderAdapter({
        ui: (
          <QuestSpecPanelWidget
            quest={quest}
            readOnly={false}
            onModify={jest.fn()}
            onSendComments={proxy.onSendComments}
          />
        ),
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

  describe('pending question in action bar', () => {
    it('VALID: {pendingQuestion provided} => renders clarify panel in action bar', () => {
      const proxy = QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'review_flows', flows: [FlowStub()] });
      const parsed = AskUserQuestionStub({
        questions: [
          {
            question: 'Which approach?',
            header: 'Approach',
            options: [{ label: 'Option A', description: 'First approach' }],
            multiSelect: false,
          },
        ],
      });
      const onSubmitAnswers = jest.fn();

      mantineRenderAdapter({
        ui: (
          <QuestSpecPanelWidget
            quest={quest}
            onModify={jest.fn()}
            onSendComments={proxy.onSendComments}
            pendingQuestion={parsed}
            onSubmitAnswers={onSubmitAnswers}
          />
        ),
      });

      expect(proxy.hasClarifyPanel()).toBe(true);
    });

    it('VALID: {pendingQuestion provided} => hides action buttons', () => {
      const proxy = QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'review_flows', flows: [FlowStub()] });
      const parsed = AskUserQuestionStub({
        questions: [
          {
            question: 'Which approach?',
            header: 'Approach',
            options: [{ label: 'Option A', description: 'First approach' }],
            multiSelect: false,
          },
        ],
      });
      const onSubmitAnswers = jest.fn();

      mantineRenderAdapter({
        ui: (
          <QuestSpecPanelWidget
            quest={quest}
            onModify={jest.fn()}
            onSendComments={proxy.onSendComments}
            pendingQuestion={parsed}
            onSubmitAnswers={onSubmitAnswers}
          />
        ),
      });

      expect(proxy.hasActionButtons()).toBe(false);
    });

    it('VALID: {no pendingQuestion} => shows action buttons, no clarify panel', () => {
      const proxy = QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'review_flows', flows: [FlowStub()] });

      mantineRenderAdapter({
        ui: (
          <QuestSpecPanelWidget
            quest={quest}
            onModify={jest.fn()}
            onSendComments={proxy.onSendComments}
          />
        ),
      });

      expect(proxy.hasActionButtons()).toBe(true);
      expect(proxy.hasClarifyPanel()).toBe(false);
    });

    it('VALID: {pendingQuestion: null} => shows action buttons, no clarify panel', () => {
      const proxy = QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({ status: 'review_flows', flows: [FlowStub()] });

      mantineRenderAdapter({
        ui: (
          <QuestSpecPanelWidget
            quest={quest}
            onModify={jest.fn()}
            onSendComments={proxy.onSendComments}
            pendingQuestion={null}
            onSubmitAnswers={jest.fn()}
          />
        ),
      });

      expect(proxy.hasActionButtons()).toBe(true);
      expect(proxy.hasClarifyPanel()).toBe(false);
    });
  });

  describe('abandon button', () => {
    it('VALID: {onAbandon provided} => renders ABANDON QUEST button in title bar', () => {
      const proxy = QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub();

      mantineRenderAdapter({
        ui: (
          <QuestSpecPanelWidget
            quest={quest}
            onModify={jest.fn()}
            onSendComments={proxy.onSendComments}
            onAbandon={jest.fn()}
          />
        ),
      });

      expect(proxy.hasAbandonButton()).toBe(true);
    });

    it('VALID: {no onAbandon} => does not render ABANDON QUEST button', () => {
      const proxy = QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub();

      mantineRenderAdapter({
        ui: (
          <QuestSpecPanelWidget
            quest={quest}
            onModify={jest.fn()}
            onSendComments={proxy.onSendComments}
          />
        ),
      });

      expect(proxy.hasAbandonButton()).toBe(false);
    });

    it('VALID: {click ABANDON QUEST} => shows CONFIRM ABANDON and CANCEL buttons', async () => {
      const proxy = QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub();
      const onAbandon = jest.fn();

      mantineRenderAdapter({
        ui: (
          <QuestSpecPanelWidget
            quest={quest}
            onModify={jest.fn()}
            onSendComments={proxy.onSendComments}
            onAbandon={onAbandon}
          />
        ),
      });

      await proxy.clickAbandon();

      const abandonBar = screen.getByTestId('ABANDON_BAR');
      const buttons = abandonBar.querySelectorAll('[data-testid="PIXEL_BTN"]');
      const buttonTexts = Array.from(buttons).map((button) => button.textContent);

      expect(buttonTexts).toStrictEqual(['CONFIRM ABANDON', 'CANCEL']);
      expect(onAbandon).toHaveBeenCalledTimes(0);
    });

    it('VALID: {click CONFIRM ABANDON} => calls onAbandon', async () => {
      const proxy = QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub();
      const onAbandon = jest.fn();

      mantineRenderAdapter({
        ui: (
          <QuestSpecPanelWidget
            quest={quest}
            onModify={jest.fn()}
            onSendComments={proxy.onSendComments}
            onAbandon={onAbandon}
          />
        ),
      });

      await proxy.clickAbandon();
      await proxy.clickConfirmAbandon();

      expect(onAbandon).toHaveBeenCalledTimes(1);
      expect(onAbandon).toHaveBeenCalledWith();
    });

    it('VALID: {click CANCEL after ABANDON} => returns to ABANDON QUEST button, does not call onAbandon', async () => {
      const proxy = QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub();
      const onAbandon = jest.fn();

      mantineRenderAdapter({
        ui: (
          <QuestSpecPanelWidget
            quest={quest}
            onModify={jest.fn()}
            onSendComments={proxy.onSendComments}
            onAbandon={onAbandon}
          />
        ),
      });

      await proxy.clickAbandon();
      await proxy.clickCancelAbandon();

      expect(proxy.hasAbandonButton()).toBe(true);
      expect(onAbandon).toHaveBeenCalledTimes(0);
    });
  });

  describe('edit mode absent', () => {
    const ALL_STATUSES = Object.keys(questStatusMetadataStatics.statuses) as readonly StatusKey[];

    it.each(ALL_STATUSES)(
      'VALID: {status: %s} => ACTION_BAR renders no MODIFY, SUBMIT or CANCEL button',
      (status) => {
        const proxy = QuestSpecPanelWidgetProxy();
        const quest: Quest = QuestStub({ status, flows: [FlowStub()] });

        mantineRenderAdapter({
          ui: (
            <QuestSpecPanelWidget
              quest={quest}
              onModify={jest.fn()}
              onSendComments={proxy.onSendComments}
            />
          ),
        });

        const labels = proxy.getActionBarButtonLabels().map((label) => String(label));

        expect(
          labels.filter((label) => ['MODIFY', 'SUBMIT', 'CANCEL'].includes(label)),
        ).toStrictEqual([]);
      },
    );
  });

  describe('comment compose controls', () => {
    it('VALID: {status review_flows with a resumable chaoswhisperer session} => the diagram card renders a COMMENT_BUTTON', async () => {
      const proxy = QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'review_flows',
        flows: [
          FlowStub({
            id: 'login-flow',
            nodes: [FlowNodeStub({ id: 'login-page', type: 'state', observables: [] })],
            edges: [],
          }),
        ],
        workItems: [WorkItemStub({ role: 'chaoswhisperer', sessionId: SessionIdStub() })],
      });
      proxy.setupPositions({ children: [{ id: 'login-page', x: 0, y: 0 }] });

      mantineRenderAdapter({
        ui: (
          <QuestSpecPanelWidget
            quest={quest}
            onModify={jest.fn()}
            onSendComments={proxy.onSendComments}
          />
        ),
      });

      await waitFor(() => {
        expect(screen.queryByTestId('FLOW_NODE')).toBeInTheDocument();
      });

      expect(proxy.countCommentButtons()).toBe(1);
    });

    it('VALID: {status approved, editable panel} => the diagram card still renders a COMMENT_BUTTON', async () => {
      const proxy = QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'approved',
        flows: [
          FlowStub({
            id: 'login-flow',
            nodes: [FlowNodeStub({ id: 'login-page', type: 'state', observables: [] })],
            edges: [],
          }),
        ],
        workItems: [WorkItemStub({ role: 'chaoswhisperer', sessionId: SessionIdStub() })],
      });
      proxy.setupPositions({ children: [{ id: 'login-page', x: 0, y: 0 }] });

      mantineRenderAdapter({
        ui: (
          <QuestSpecPanelWidget
            quest={quest}
            onModify={jest.fn()}
            onSendComments={proxy.onSendComments}
          />
        ),
      });

      await waitFor(() => {
        expect(screen.queryByTestId('FLOW_NODE')).toBeInTheDocument();
      });

      expect(proxy.countCommentButtons()).toBe(1);
    });

    it('VALID: {quest whose workItems array is EMPTY, editable panel} => one COMMENT_BUTTON per FLOW_NODE and per FLOW_OBSERVABLE_NODE card, none on the portal card', async () => {
      const proxy = QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'review_flows',
        flows: [
          FlowStub({
            id: 'login-flow',
            nodes: [
              FlowNodeStub({
                id: 'login-page',
                type: 'state',
                observables: [
                  FlowObservableStub({
                    id: 'redirects',
                    type: 'ui-state',
                    description: 'redirects to dashboard',
                  }),
                ],
              }),
              FlowNodeStub({ id: 'dashboard', type: 'state', observables: [] }),
            ],
            edges: [
              FlowEdgeStub({ id: 'to-compile', from: 'dashboard', to: 'compile-flow:entry' }),
            ],
          }),
        ],
        // The shape the create-quest MCP tool mints: BugHunt/ChaosWhisperer author the spec from a
        // Claude Code session and no work item is ever spawned. A comment anchors on flowId +
        // nodeId, which is spec data, so an empty ledger cannot make a box uncommentable.
        workItems: [],
      });
      proxy.setupPositions({
        children: [
          { id: 'login-page', x: 0, y: 0 },
          { id: 'dashboard', x: 0, y: 200 },
          { id: 'compile-flow:entry', x: 0, y: 400 },
        ],
      });

      mantineRenderAdapter({
        ui: (
          <QuestSpecPanelWidget
            quest={quest}
            onModify={jest.fn()}
            onSendComments={proxy.onSendComments}
          />
        ),
      });

      await waitFor(() => {
        expect(screen.queryByTestId('FLOW_PORTAL_NODE')).toBeInTheDocument();
      });

      // Read off the same render the buttons were counted on, so the assertion is the RATIO
      // (one button per box) and not "at least one button somewhere on the canvas".
      const nodeCards = proxy.countCardsOn({ testId: 'FLOW_NODE' });
      const assertionCards = proxy.countCardsOn({ testId: 'FLOW_OBSERVABLE_NODE' });

      expect({
        nodeCards,
        assertionCards,
        commentButtons: proxy.countCommentButtons(),
        portalCommentButtons: proxy.countCommentButtonsOn({ testId: 'FLOW_PORTAL_NODE' }),
      }).toStrictEqual({
        nodeCards: 2,
        assertionCards: 1,
        commentButtons: nodeCards + assertionCards,
        portalCommentButtons: 0,
      });
    });

    it('EMPTY: {readOnly panel on a review_flows quest with a resumable session} => renders zero COMMENT_BUTTON elements while the COMMENT_COUNT_BADGE still reads its count', async () => {
      const proxy = QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({
        // Status and session both say "composable"; the ONLY thing suppressing the button here is
        // the declared readOnly mode, which is what the execution panel renders the diagram in.
        status: 'review_flows',
        flows: [
          FlowStub({
            id: 'login-flow',
            nodes: [FlowNodeStub({ id: 'login-page', type: 'state', observables: [] })],
            edges: [],
          }),
        ],
        workItems: [WorkItemStub({ role: 'chaoswhisperer', sessionId: SessionIdStub() })],
        comments: [
          QuestCommentStub({ flowId: 'login-flow', nodeId: 'login-page', text: 'a sent note' }),
        ],
      });
      proxy.setupPositions({ children: [{ id: 'login-page', x: 0, y: 0 }] });

      mantineRenderAdapter({
        ui: <QuestSpecPanelWidget quest={quest} readOnly={true} />,
      });

      await waitFor(() => {
        expect(screen.queryByTestId('FLOW_NODE')).toBeInTheDocument();
      });

      expect({
        commentButtons: proxy.countCommentButtons(),
        badges: proxy.getCommentBadgeTextsOn({ testId: 'FLOW_NODE' }),
      }).toStrictEqual({ commentButtons: 0, badges: ['1'] });
    });

    it('VALID: {status review_flows with a work item carrying NO sessionId} => the diagram card still renders a COMMENT_BUTTON', async () => {
      const proxy = QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'review_flows',
        flows: [
          FlowStub({
            id: 'login-flow',
            nodes: [FlowNodeStub({ id: 'login-page', type: 'state', observables: [] })],
            edges: [],
          }),
        ],
        workItems: [WorkItemStub({ role: 'chaoswhisperer' })],
      });
      proxy.setupPositions({ children: [{ id: 'login-page', x: 0, y: 0 }] });

      mantineRenderAdapter({
        ui: (
          <QuestSpecPanelWidget
            quest={quest}
            onModify={jest.fn()}
            onSendComments={proxy.onSendComments}
          />
        ),
      });

      await waitFor(() => {
        expect(screen.queryByTestId('FLOW_NODE')).toBeInTheDocument();
      });

      expect(proxy.countCommentButtons()).toBe(1);
    });
  });

  describe('comment queue bar', () => {
    it('EMPTY: {composable quest with an empty queue} => COMMENT_QUEUE_BAR is absent', () => {
      const proxy = QuestSpecPanelWidgetProxy();
      proxy.setupEmptyQueue();
      const quest: Quest = QuestStub({
        status: 'review_flows',
        workItems: [WorkItemStub({ role: 'chaoswhisperer', sessionId: SessionIdStub() })],
      });

      mantineRenderAdapter({
        ui: (
          <QuestSpecPanelWidget
            quest={quest}
            onModify={jest.fn()}
            onSendComments={proxy.onSendComments}
          />
        ),
      });

      expect(proxy.hasQueueBar()).toBe(false);
    });

    it('VALID: {composable quest with three queued comments} => COMMENT_QUEUE_BAR reads 3 COMMENTS QUEUED', () => {
      const proxy = QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'review_flows',
        workItems: [WorkItemStub({ role: 'chaoswhisperer', sessionId: SessionIdStub() })],
      });
      proxy.setupQueuedComments({
        questId: quest.id,
        entries: [
          CommentQueueEntryStub({ flowId: 'flow-a', nodeId: 'node-a' }),
          CommentQueueEntryStub({ flowId: 'flow-b', nodeId: 'node-b' }),
          CommentQueueEntryStub({ flowId: 'flow-c', nodeId: 'node-c' }),
        ],
      });

      mantineRenderAdapter({
        ui: (
          <QuestSpecPanelWidget
            quest={quest}
            onModify={jest.fn()}
            onSendComments={proxy.onSendComments}
          />
        ),
      });

      expect(proxy.getQueueBarCountText()).toBe('3 COMMENTS QUEUED');
    });

    it('VALID: {queued comments} => COMMENT_QUEUE_BAR is the immediate previous sibling of ACTION_BAR', () => {
      const proxy = QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'review_flows',
        workItems: [WorkItemStub({ role: 'chaoswhisperer', sessionId: SessionIdStub() })],
      });
      proxy.setupQueuedComments({
        questId: quest.id,
        entries: [CommentQueueEntryStub()],
      });

      mantineRenderAdapter({
        ui: (
          <QuestSpecPanelWidget
            quest={quest}
            onModify={jest.fn()}
            onSendComments={proxy.onSendComments}
          />
        ),
      });

      expect(proxy.isQueueBarPreviousSiblingOfActionBar()).toBe(true);
    });

    it('VALID: {session-less quest whose localStorage already holds queued comments} => COMMENT_QUEUE_BAR renders', () => {
      const proxy = QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'review_flows',
        workItems: [WorkItemStub({ role: 'chaoswhisperer' })],
      });
      proxy.setupQueuedComments({
        questId: quest.id,
        entries: [CommentQueueEntryStub()],
      });

      mantineRenderAdapter({
        ui: (
          <QuestSpecPanelWidget
            quest={quest}
            onModify={jest.fn()}
            onSendComments={proxy.onSendComments}
          />
        ),
      });

      expect(proxy.hasQueueBar()).toBe(true);
    });

    it('VALID: {approved quest with queued comments} => COMMENT_QUEUE_BAR renders', () => {
      const proxy = QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'approved',
        workItems: [WorkItemStub({ role: 'chaoswhisperer', sessionId: SessionIdStub() })],
      });
      proxy.setupQueuedComments({
        questId: quest.id,
        entries: [CommentQueueEntryStub()],
      });

      mantineRenderAdapter({
        ui: (
          <QuestSpecPanelWidget
            quest={quest}
            onModify={jest.fn()}
            onSendComments={proxy.onSendComments}
          />
        ),
      });

      expect(proxy.hasQueueBar()).toBe(true);
    });

    // readOnly renders neither the queue bar nor a send path (onSendComments is typed `never` on
    // this arm) — a quest that already has comments queued in local storage from an earlier
    // editable session must not surface a bar with nowhere to deliver a send.
    it('VALID: {readOnly panel whose quest already has queued comments in local storage} => COMMENT_QUEUE_BAR is absent', () => {
      const proxy = QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'review_flows',
        workItems: [WorkItemStub({ role: 'chaoswhisperer', sessionId: SessionIdStub() })],
      });
      proxy.setupQueuedComments({
        questId: quest.id,
        entries: [CommentQueueEntryStub()],
      });

      mantineRenderAdapter({
        ui: <QuestSpecPanelWidget quest={quest} readOnly={true} />,
      });

      expect(proxy.hasQueueBar()).toBe(false);
    });
  });

  describe('send wiring', () => {
    it('VALID: {composable quest with one queued comment, click COMMENT_SEND_BUTTON} => invokes onSendComments with the queued comments', async () => {
      const proxy = QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'review_flows',
        workItems: [WorkItemStub({ role: 'chaoswhisperer', sessionId: SessionIdStub() })],
      });
      const entry = CommentQueueEntryStub();
      proxy.setupQueuedComments({ questId: quest.id, entries: [entry] });
      const { onSendComments } = proxy;

      mantineRenderAdapter({
        ui: (
          <QuestSpecPanelWidget
            quest={quest}
            onModify={jest.fn()}
            onSendComments={onSendComments}
          />
        ),
      });

      await proxy.clickQueueSend();

      await waitFor(() => {
        expect(onSendComments).toHaveBeenCalledTimes(1);
      });

      expect(onSendComments).toHaveBeenCalledWith({ comments: [entry] });
    });
  });

  describe('persisted comment display', () => {
    it('VALID: {approved quest with a commented box, editable panel} => the badge and the COMMENT_BUTTON render on the same box', async () => {
      const proxy = QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'approved',
        flows: [
          FlowStub({
            id: 'login-flow',
            nodes: [FlowNodeStub({ id: 'login-page', type: 'state', observables: [] })],
            edges: [],
          }),
        ],
        workItems: [WorkItemStub({ role: 'chaoswhisperer', sessionId: SessionIdStub() })],
        comments: [
          QuestCommentStub({ flowId: 'login-flow', nodeId: 'login-page', text: 'a sent note' }),
        ],
      });
      proxy.setupPositions({ children: [{ id: 'login-page', x: 0, y: 0 }] });

      mantineRenderAdapter({
        ui: (
          <QuestSpecPanelWidget
            quest={quest}
            onModify={jest.fn()}
            onSendComments={proxy.onSendComments}
          />
        ),
      });

      await waitFor(() => {
        expect(screen.queryByTestId('FLOW_NODE')).toBeInTheDocument();
      });

      expect(proxy.getCommentBadgeTextsOn({ testId: 'FLOW_NODE' })).toStrictEqual(['1']);
      expect(proxy.countCommentButtons()).toBe(1);
    });

    it('VALID: {session-less review_flows quest with a commented box, editable panel} => the badge and the COMMENT_BUTTON render on the same box', async () => {
      const proxy = QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'review_flows',
        flows: [
          FlowStub({
            id: 'login-flow',
            nodes: [FlowNodeStub({ id: 'login-page', type: 'state', observables: [] })],
            edges: [],
          }),
        ],
        // The chaoswhisperer role stays; only its sessionId is missing. Execution state does not
        // participate in the anchor, so the box stays commentable.
        workItems: [WorkItemStub({ role: 'chaoswhisperer' })],
        comments: [
          QuestCommentStub({ flowId: 'login-flow', nodeId: 'login-page', text: 'a sent note' }),
        ],
      });
      proxy.setupPositions({ children: [{ id: 'login-page', x: 0, y: 0 }] });

      mantineRenderAdapter({
        ui: (
          <QuestSpecPanelWidget
            quest={quest}
            onModify={jest.fn()}
            onSendComments={proxy.onSendComments}
          />
        ),
      });

      await waitFor(() => {
        expect(screen.queryByTestId('FLOW_NODE')).toBeInTheDocument();
      });

      expect(proxy.getCommentBadgeTextsOn({ testId: 'FLOW_NODE' })).toStrictEqual(['1']);
      expect(proxy.countCommentButtons()).toBe(1);
    });

    it('VALID: {read-only panel on a complete quest} => the clicked box still lists its comment rows', async () => {
      const proxy = QuestSpecPanelWidgetProxy();
      const quest: Quest = QuestStub({
        status: 'complete',
        flows: [
          FlowStub({
            id: 'login-flow',
            nodes: [FlowNodeStub({ id: 'login-page', type: 'state', observables: [] })],
            edges: [],
          }),
        ],
        comments: [
          QuestCommentStub({ flowId: 'login-flow', nodeId: 'login-page', text: 'a sent note' }),
        ],
      });
      proxy.setupPositions({ children: [{ id: 'login-page', x: 0, y: 0 }] });

      mantineRenderAdapter({
        ui: <QuestSpecPanelWidget quest={quest} readOnly={true} />,
      });

      await waitFor(() => {
        expect(screen.queryByTestId('FLOW_NODE')).toBeInTheDocument();
      });

      await proxy.clickNode({ nodeId: 'login-page' });

      expect(proxy.getPanelCommentTexts()).toStrictEqual(['a sent note']);
    });
  });
});
