import type { StubArgument } from '../../@types/stub-argument.type';
import { widgetNodeContract, type WidgetNode } from './widget-node-contract';

export const WidgetNodeStub = ({ ...props }: StubArgument<WidgetNode> = {}): WidgetNode =>
  widgetNodeContract.parse({
    widgetName: 'stub-widget',
    filePath: '/stub/src/widgets/stub/stub-widget.tsx',
    bindingsAttached: [],
    children: [],
    ...props,
  });
