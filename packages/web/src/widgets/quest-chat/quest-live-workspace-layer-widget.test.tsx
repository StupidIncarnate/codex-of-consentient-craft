import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import { QuestStub, QuestWorkItemIdStub, WorkItemStub } from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { QuestLiveWorkspaceLayerWidget } from './quest-live-workspace-layer-widget';
import { QuestLiveWorkspaceLayerWidgetProxy } from './quest-live-workspace-layer-widget.proxy';

const hasTestId = ({
  queryByTestId,
  testId,
}: {
  queryByTestId: (id: string) => HTMLElement | null;
  testId: string;
}): boolean => queryByTestId(testId) !== null;

describe('QuestLiveWorkspaceLayerWidget', () => {
  describe('loading state', () => {
    it('VALID: {binding has no quest yet} => renders dumpster raccoon loading view', () => {
      QuestLiveWorkspaceLayerWidgetProxy();

      const { queryByTestId } = mantineRenderAdapter({
        ui: (
          <MemoryRouter>
            <QuestLiveWorkspaceLayerWidget questId={'live-q-loading' as never} />
          </MemoryRouter>
        ),
      });

      expect(hasTestId({ queryByTestId, testId: 'QUEST_CHAT_LOADING' })).toBe(true);
    });
  });

  describe('execution-phase quest', () => {
    it('VALID: {quest in_progress} => renders execution panel', async () => {
      const proxy = QuestLiveWorkspaceLayerWidgetProxy();
      const quest = QuestStub({
        id: 'live-q-exec',
        status: 'in_progress',
        workItems: [WorkItemStub({ sessionId: 'sess-x' as never })],
      });

      const { queryByTestId } = mantineRenderAdapter({
        ui: (
          <MemoryRouter>
            <QuestLiveWorkspaceLayerWidget questId={'live-q-exec' as never} />
          </MemoryRouter>
        ),
      });

      act(() => {
        proxy.receiveWsMessage({
          data: JSON.stringify({
            type: 'quest-modified',
            payload: { questId: quest.id, quest },
            timestamp: '2025-01-01T00:00:00.000Z',
          }),
        });
      });

      await waitFor(() => {
        expect(hasTestId({ queryByTestId, testId: 'execution-panel-widget' })).toBe(true);
      });

      expect(hasTestId({ queryByTestId, testId: 'execution-panel-widget' })).toBe(true);
    });
  });

  describe('pre-execution quest', () => {
    it('VALID: {quest at review_flows} => renders chat panel', async () => {
      const proxy = QuestLiveWorkspaceLayerWidgetProxy();
      const quest = QuestStub({
        id: 'live-q-pre',
        status: 'review_flows',
      });

      const { queryByTestId } = mantineRenderAdapter({
        ui: (
          <MemoryRouter>
            <QuestLiveWorkspaceLayerWidget questId={'live-q-pre' as never} />
          </MemoryRouter>
        ),
      });

      act(() => {
        proxy.receiveWsMessage({
          data: JSON.stringify({
            type: 'quest-modified',
            payload: { questId: quest.id, quest },
            timestamp: '2025-01-01T00:00:00.000Z',
          }),
        });
      });

      await waitFor(() => {
        expect(hasTestId({ queryByTestId, testId: 'CHAT_PANEL' })).toBe(true);
      });

      expect(hasTestId({ queryByTestId, testId: 'CHAT_PANEL' })).toBe(true);
    });
  });

  describe('entriesBySession forwarding', () => {
    it('VALID: {chat-output for active workitem sessionId} => execution panel renders the entries from that session bucket', async () => {
      const proxy = QuestLiveWorkspaceLayerWidgetProxy();
      const workItemSessionId = 'cw-session-fwd';
      const quest = QuestStub({
        id: 'live-q-fwd',
        status: 'in_progress',
        steps: [],
        workItems: [
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000010',
            role: 'codeweaver',
            status: 'in_progress',
            sessionId: workItemSessionId as never,
          }),
        ],
      });

      const { queryByTestId } = mantineRenderAdapter({
        ui: (
          <MemoryRouter>
            <QuestLiveWorkspaceLayerWidget questId={'live-q-fwd' as never} />
          </MemoryRouter>
        ),
      });

      act(() => {
        proxy.receiveWsMessage({
          data: JSON.stringify({
            type: 'quest-modified',
            payload: { questId: quest.id, quest },
            timestamp: '2025-01-01T00:00:00.000Z',
          }),
        });
      });

      await waitFor(() => {
        expect(hasTestId({ queryByTestId, testId: 'execution-panel-widget' })).toBe(true);
      });

      act(() => {
        proxy.receiveWsMessage({
          data: JSON.stringify({
            type: 'chat-output',
            payload: {
              questId: quest.id,
              workItemId: QuestWorkItemIdStub(),
              sessionId: workItemSessionId,
              entries: [{ role: 'assistant', type: 'text', content: 'forwarded entry' }],
            },
            timestamp: '2025-01-01T00:00:00.000Z',
          }),
        });
      });

      const codeweaverRows = await screen.findAllByTestId('execution-row-layer-widget');
      const codeweaverRow = codeweaverRows[0]!;
      const rowHeader = within(codeweaverRow).getByTestId('execution-row-header');

      await userEvent.click(rowHeader);

      const message = await within(codeweaverRow).findByTestId('CHAT_MESSAGE');

      expect(codeweaverRow.contains(message)).toBe(true);
      expect(message.textContent?.includes('forwarded entry')).toBe(true);
    });
  });

  describe('sendMessage wiring', () => {
    it('VALID: {chat panel onSendMessage fires} => binding sendMessage invokes questChatBroker once with the message', async () => {
      const proxy = QuestLiveWorkspaceLayerWidgetProxy();
      proxy.setupChat({ chatProcessId: 'proc-send-1' as never });
      const quest = QuestStub({
        id: 'live-q-send',
        status: 'review_flows',
      });

      const { queryByTestId } = mantineRenderAdapter({
        ui: (
          <MemoryRouter>
            <QuestLiveWorkspaceLayerWidget questId={'live-q-send' as never} />
          </MemoryRouter>
        ),
      });

      act(() => {
        proxy.receiveWsMessage({
          data: JSON.stringify({
            type: 'quest-modified',
            payload: { questId: quest.id, quest },
            timestamp: '2025-01-01T00:00:00.000Z',
          }),
        });
      });

      await waitFor(() => {
        expect(hasTestId({ queryByTestId, testId: 'CHAT_PANEL' })).toBe(true);
      });

      const textarea = screen.getByTestId('CHAT_INPUT');
      await userEvent.type(textarea, 'wire me up');
      await userEvent.click(screen.getByTestId('SEND_BUTTON'));

      await waitFor(() => {
        expect(proxy.getChatRequestCount()).toBe(1);
      });

      expect(proxy.getChatRequestCount()).toBe(1);
    });
  });

  describe('stopChat wiring', () => {
    it('VALID: {chat panel onStopChat fires} => binding stopChat invokes questPauseBroker once', async () => {
      const proxy = QuestLiveWorkspaceLayerWidgetProxy();
      proxy.setupPause();
      const quest = QuestStub({
        id: 'live-q-stop',
        status: 'review_flows',
      });

      const { queryByTestId } = mantineRenderAdapter({
        ui: (
          <MemoryRouter>
            <QuestLiveWorkspaceLayerWidget questId={'live-q-stop' as never} />
          </MemoryRouter>
        ),
      });

      act(() => {
        proxy.receiveWsMessage({
          data: JSON.stringify({
            type: 'quest-modified',
            payload: { questId: quest.id, quest },
            timestamp: '2025-01-01T00:00:00.000Z',
          }),
        });
      });

      await waitFor(() => {
        expect(hasTestId({ queryByTestId, testId: 'CHAT_PANEL' })).toBe(true);
      });

      // Drive isStreaming=true so the input swaps to the STOP button.
      act(() => {
        proxy.receiveWsMessage({
          data: JSON.stringify({
            type: 'chat-output',
            payload: {
              questId: quest.id,
              workItemId: QuestWorkItemIdStub(),
              entries: [{ role: 'assistant', type: 'text', content: 'streaming...' }],
            },
            timestamp: '2025-01-01T00:00:00.000Z',
          }),
        });
      });

      const stopButton = await screen.findByTestId('STOP_BUTTON');
      await userEvent.click(stopButton);

      await waitFor(() => {
        expect(proxy.getPauseRequestCount()).toBe(1);
      });

      expect(proxy.getPauseRequestCount()).toBe(1);
    });
  });
});
