import { AgentOutputPanelWidgetProxy } from '../agent-output-panel/agent-output-panel-widget.proxy';
import { PhaseIndicatorWidgetProxy } from '../phase-indicator/phase-indicator-widget.proxy';
import { SlotGridWidgetProxy } from '../slot-grid/slot-grid-widget.proxy';

export const ExecutionDashboardWidgetProxy = (): Record<PropertyKey, never> => {
  PhaseIndicatorWidgetProxy();
  SlotGridWidgetProxy();
  AgentOutputPanelWidgetProxy();

  return {};
};
