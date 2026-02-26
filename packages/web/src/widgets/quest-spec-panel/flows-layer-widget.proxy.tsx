import { FormInputWidgetProxy } from '../form-input/form-input-widget.proxy';
import { MermaidDiagramWidgetProxy } from '../mermaid-diagram/mermaid-diagram-widget.proxy';
import { PlanSectionWidgetProxy } from '../plan-section/plan-section-widget.proxy';

export const FlowsLayerWidgetProxy = (): Record<PropertyKey, never> => {
  PlanSectionWidgetProxy();
  FormInputWidgetProxy();
  MermaidDiagramWidgetProxy();

  return {};
};
