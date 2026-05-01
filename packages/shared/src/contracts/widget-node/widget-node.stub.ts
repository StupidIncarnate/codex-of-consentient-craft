import type { StubArgument } from '../../@types/stub-argument.type';
import { widgetNodeContract, type WidgetNode } from './widget-node-contract';
import { ContentTextStub } from '../content-text/content-text.stub';
import { AbsoluteFilePathStub } from '../absolute-file-path/absolute-file-path.stub';

export const WidgetNodeStub = ({ ...props }: StubArgument<WidgetNode> = {}): WidgetNode =>
  widgetNodeContract.parse({
    widgetName: ContentTextStub({ value: 'stub-widget' }),
    filePath: AbsoluteFilePathStub({ value: '/stub/src/widgets/stub/stub-widget.tsx' }),
    bindingsAttached: [],
    children: [],
    ...props,
  });
