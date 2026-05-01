import type { StubArgument } from '../../@types/stub-argument.type';
import { widgetEdgesContract, type WidgetEdges } from './widget-edges-contract';

export const WidgetEdgesStub = ({ ...props }: StubArgument<WidgetEdges> = {}): WidgetEdges =>
  widgetEdgesContract.parse({
    childWidgetPaths: [],
    bindingNames: [],
    ...props,
  });
