import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { elkLayoutAdapterProxy } from '../../adapters/elk/layout/elk-layout-adapter.proxy';
import { xyflowEdgeAdapterProxy } from '../../adapters/xyflow/edge/xyflow-edge-adapter.proxy';
import { xyflowReactFlowAdapterProxy } from '../../adapters/xyflow/react-flow/xyflow-react-flow-adapter.proxy';
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
  clickFullscreen: () => Promise<void>;
  getDetailPanelHeading: () => HTMLElement | null;
  getObservableNodes: () => HTMLElement[];
  getObservableTypeTags: () => HTMLElement[];
  getObservableDescriptions: () => HTMLElement[];
  hasDiagram: () => boolean;
  hasCanvas: () => boolean;
  hasError: () => boolean;
  hasDetailPanel: () => boolean;
  isExpanded: () => boolean;
}

export const ReactFlowDiagramWidgetProxy = (): ReactFlowDiagramWidgetProxyResult => {
  const elkProxy = elkLayoutAdapterProxy();
  xyflowReactFlowAdapterProxy();
  xyflowEdgeAdapterProxy();
  FlowNodeCardLayerWidgetProxy();
  FlowNodeDetailPanelLayerWidgetProxy();
  FlowObservableNodeLayerWidgetProxy();
  FlowPortalNodeLayerWidgetProxy();
  const user = userEvent.setup();

  return {
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
    clickPane: async (): Promise<void> => {
      await user.click(screen.getByTestId('REACT_FLOW_PANE'));
    },
    pressEsc: async (): Promise<void> => {
      await user.keyboard('{Escape}');
    },
    clickFullscreen: async (): Promise<void> => {
      await user.click(screen.getByTestId('FULLSCREEN_BUTTON'));
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
    hasDetailPanel: (): boolean => screen.queryByTestId('FLOW_NODE_DETAIL_PANEL') !== null,
    isExpanded: (): boolean =>
      screen.getByTestId('FULLSCREEN_BUTTON').getAttribute('data-expanded') === 'true',
  };
};
