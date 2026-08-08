import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { elkLayoutAdapterProxy } from '../../adapters/elk/layout/elk-layout-adapter.proxy';
import { xyflowEdgeAdapterProxy } from '../../adapters/xyflow/edge/xyflow-edge-adapter.proxy';
import { xyflowReactFlowAdapterProxy } from '../../adapters/xyflow/react-flow/xyflow-react-flow-adapter.proxy';
import { IconButtonWidgetProxy } from '../icon-button/icon-button-widget.proxy';
import { FlowNodeCardLayerWidgetProxy } from './flow-node-card-layer-widget.proxy';
import { FlowNodeDetailPanelLayerWidgetProxy } from './flow-node-detail-panel-layer-widget.proxy';
import { FlowObservableNodeLayerWidgetProxy } from './flow-observable-node-layer-widget.proxy';
import { FlowPortalNodeLayerWidgetProxy } from './flow-portal-node-layer-widget.proxy';

type ProxyInstance = ReturnType<typeof elkLayoutAdapterProxy>;
type ReturnsPositionsArgs = Parameters<ProxyInstance['returnsPositions']>[0];

interface ReactFlowDiagramWidgetProxyResult {
  setupPositions: (args: ReturnsPositionsArgs) => void;
  setupLayoutError: ({ error }: { error: Error }) => void;
  clickNode: ({ nodeId }: { nodeId: string }) => Promise<void>;
  clickPane: () => Promise<void>;
  pressEsc: () => Promise<void>;
  getDetailPanelHeading: () => HTMLElement | null;
  getObservableNodes: () => HTMLElement[];
  getObservableTypeTags: () => HTMLElement[];
  getObservableDescriptions: () => HTMLElement[];
  hasDiagram: () => boolean;
  hasCanvas: () => boolean;
  hasError: () => boolean;
  countLayoutErrorLogs: () => HTMLElement['childElementCount'];
  hasDetailPanel: () => boolean;
  getControlTestIds: () => HTMLElement['textContent'][];
  setupEmptyQueue: () => void;
  countCommentButtons: () => HTMLElement['childElementCount'];
  countCommentButtonsOn: (params: { testId: string }) => HTMLElement['childElementCount'];
  countCardsOn: (params: { testId: string }) => HTMLElement['childElementCount'];
  clickObservableNode: (params: { nodeId: string; observableId: string }) => Promise<void>;
  getCommentBadgeTextsOn: (params: { testId: string }) => HTMLElement['textContent'][];
  getCommentBadgeTextsOnObservable: (params: {
    nodeId: string;
    observableId: string;
  }) => HTMLElement['textContent'][];
  hasCommentsSection: () => boolean;
  getPanelCommentTexts: () => HTMLElement['textContent'][];
  getInitialBoxes: () => HTMLElement['textContent'][][];
}

export const ReactFlowDiagramWidgetProxy = (): ReactFlowDiagramWidgetProxyResult => {
  const elkProxy = elkLayoutAdapterProxy();
  xyflowReactFlowAdapterProxy();
  xyflowEdgeAdapterProxy();
  // The canvas controls are IconButtonWidgets. Its proxy mocks nothing, so this constructs it for
  // the child-proxy rule only — the controls are addressed here by their own testids.
  IconButtonWidgetProxy();
  const nodeCardProxy = FlowNodeCardLayerWidgetProxy();
  FlowNodeDetailPanelLayerWidgetProxy();
  FlowObservableNodeLayerWidgetProxy();
  FlowPortalNodeLayerWidgetProxy();
  const user = userEvent.setup();
  // The widget logs a rejected ELK layout directly from its catch (no thrown error surfaces to
  // React), so any test that triggers that path would otherwise throw here. passthrough: true —
  // console.error is a shared sink; React's own internal warnings (e.g. act() warnings) also flow
  // through it and must keep printing normally, not throw for being unstaged.
  const consoleErrorHandle = registerSpyOn({
    object: globalThis.console,
    method: 'error',
    passthrough: true,
  });
  consoleErrorHandle.calledWith(['[react-flow-diagram]']).returns(undefined);

  return {
    setupEmptyQueue: (): void => {
      nodeCardProxy.setupEmptyQueue();
    },
    countCommentButtons: (): HTMLElement['childElementCount'] =>
      screen.queryAllByTestId('COMMENT_BUTTON').length,
    // Scoped by card type: the portal stand-in must never carry a comment button, and asserting
    // that from the whole-canvas count alone would pass even if the portal grew one.
    countCommentButtonsOn: ({ testId }: { testId: string }): HTMLElement['childElementCount'] =>
      screen
        .queryAllByTestId(testId)
        .reduce(
          (total, card) => total + card.querySelectorAll('[data-testid="COMMENT_BUTTON"]').length,
          0,
        ),
    // How many cards of a given type the canvas painted. A comment-button count only means
    // "one per box" when the box count it is compared against was read off the same render.
    countCardsOn: ({ testId }: { testId: string }): HTMLElement['childElementCount'] =>
      screen.queryAllByTestId(testId).length,
    setupPositions: (args: ReturnsPositionsArgs): void => {
      elkProxy.returnsPositions(args);
    },
    setupLayoutError: ({ error }: { error: Error }): void => {
      elkProxy.throws({ error });
    },
    clickNode: async ({ nodeId }: { nodeId: string }): Promise<void> => {
      const wrapper = screen
        .getByTestId('REACT_FLOW_PANE')
        .querySelector(`[data-node-id="${nodeId}"]`);
      if (!wrapper) throw new Error(`Node wrapper not found for id: ${nodeId}`);
      await user.click(wrapper as HTMLElement);
    },
    // An assertion card's React Flow id is the composite the diagram widget mints for it, so the
    // test names the box the way a reader does — its node and its assertion — not by that string.
    clickObservableNode: async ({
      nodeId,
      observableId,
    }: {
      nodeId: string;
      observableId: string;
    }): Promise<void> => {
      const wrapper = screen
        .getByTestId('REACT_FLOW_PANE')
        .querySelector(`[data-node-id="obs:${nodeId}:${observableId}"]`);
      if (!wrapper) throw new Error(`Observable wrapper not found: ${nodeId}/${observableId}`);
      await user.click(wrapper as HTMLElement);
    },
    // Scoped by card type so a node badge can never stand in for an assertion badge.
    getCommentBadgeTextsOn: ({ testId }: { testId: string }): HTMLElement['textContent'][] =>
      screen
        .queryAllByTestId(testId)
        .flatMap((card) =>
          Array.from(card.querySelectorAll('[data-testid="COMMENT_COUNT_BADGE"]')).map(
            (badge) => badge.textContent,
          ),
        ),
    // The badges on ONE named assertion card. getCommentBadgeTextsOn collapses every assertion card
    // into one list, and a card with no badge contributes nothing to it — so ['1'] there cannot say
    // WHICH card carried the badge. Naming the card is what makes a count painted on the wrong
    // assertion of the same node a failure.
    getCommentBadgeTextsOnObservable: ({
      nodeId,
      observableId,
    }: {
      nodeId: string;
      observableId: string;
    }): HTMLElement['textContent'][] => {
      const wrapper = screen
        .getByTestId('REACT_FLOW_PANE')
        .querySelector(`[data-node-id="obs:${nodeId}:${observableId}"]`);
      if (!wrapper) throw new Error(`Observable wrapper not found: ${nodeId}/${observableId}`);
      return Array.from(wrapper.querySelectorAll('[data-testid="COMMENT_COUNT_BADGE"]')).map(
        (badge) => badge.textContent,
      );
    },
    // The [id, initialWidth, initialHeight] triple React Flow received for every card on the canvas.
    // React Flow paints a card `visibility: hidden` until its own measurement lands, so a card that
    // arrives with no box is one lost measurement away from an invisible diagram.
    getInitialBoxes: (): HTMLElement['textContent'][][] =>
      Array.from(screen.getByTestId('REACT_FLOW_PANE').querySelectorAll('[data-node-id]')).map(
        (element) => [
          element.getAttribute('data-node-id'),
          element.getAttribute('data-initial-width'),
          element.getAttribute('data-initial-height'),
        ],
      ),
    hasCommentsSection: (): boolean => screen.queryByTestId('FLOW_DETAIL_PANEL_COMMENTS') !== null,
    getPanelCommentTexts: (): HTMLElement['textContent'][] =>
      screen
        .queryAllByTestId('FLOW_DETAIL_PANEL_COMMENT_TEXT')
        .map((element) => element.textContent),
    clickPane: async (): Promise<void> => {
      await user.click(screen.getByTestId('REACT_FLOW_PANE'));
    },
    pressEsc: async (): Promise<void> => {
      await user.keyboard('{Escape}');
    },
    getDetailPanelHeading: (): HTMLElement | null =>
      screen.queryByTestId('FLOW_DETAIL_PANEL_HEADING'),
    getObservableNodes: (): HTMLElement[] => screen.queryAllByTestId('FLOW_OBSERVABLE_NODE'),
    getObservableTypeTags: (): HTMLElement[] =>
      screen.queryAllByTestId('FLOW_OBSERVABLE_NODE_TYPE'),
    getObservableDescriptions: (): HTMLElement[] =>
      screen.queryAllByTestId('FLOW_OBSERVABLE_NODE_DESC'),
    hasDiagram: (): boolean => screen.queryByTestId('FLOW_DIAGRAM') !== null,
    hasCanvas: (): boolean => screen.queryByTestId('REACT_FLOW_CANVAS') !== null,
    hasError: (): boolean => screen.queryByTestId('FLOW_DIAGRAM_ERROR') !== null,
    // How many layout passes have rejected. A failed re-layout over a graph already on screen paints
    // nothing new — the canvas deliberately keeps the last good graph — so this log is the only
    // signal a test can wait on before asserting what survived.
    countLayoutErrorLogs: (): HTMLElement['childElementCount'] =>
      consoleErrorHandle.callsMatching(['[react-flow-diagram]']).length,
    hasDetailPanel: (): boolean => screen.queryByTestId('FLOW_NODE_DETAIL_PANEL') !== null,
    // Direct children of the floating control cluster, in DOM order. Scoped because the comment
    // bubbles on the cards are buttons on this canvas too; direct children rather than a descendant
    // query because the mocked glyphs carry testids of their own and would each read as a control.
    getControlTestIds: (): HTMLElement['textContent'][] =>
      Array.from(screen.getByTestId('FLOW_DIAGRAM_CONTROLS').children).map((element) =>
        element.getAttribute('data-testid'),
      ),
  };
};
