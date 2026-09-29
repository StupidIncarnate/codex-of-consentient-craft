import React from '#gateway/npm/react';

import { Handle, Position } from '#gateway/npm/xyflow__react';

import { flowHandleStatics } from '../../statics/flow-handle/flow-handle-statics';
import { FlowNodeHandlesWidget } from './flow-node-handles-widget';
import { FlowNodeHandlesWidgetProxy } from './flow-node-handles-widget.proxy';

describe('FlowNodeHandlesWidget', () => {
  describe('flow-node variant', () => {
    it('VALID: {} => top target, bottom source, right observable source, and right loop handles', () => {
      FlowNodeHandlesWidgetProxy();

      const element = FlowNodeHandlesWidget();
      const fragmentProps = element.props as { children: React.ReactNode };
      const children = React.Children.toArray(fragmentProps.children) as React.ReactElement<{
        type: 'source' | 'target';
        position: Position;
        id?: (typeof flowHandleStatics)[keyof typeof flowHandleStatics];
      }>[];

      const handleSummaries = children.map((child) => ({
        isHandle: child.type === Handle,
        handleType: child.props.type,
        position: child.props.position,
        id: child.props.id,
      }));

      expect(handleSummaries).toStrictEqual([
        { isHandle: true, handleType: 'target', position: Position.Top, id: undefined },
        { isHandle: true, handleType: 'source', position: Position.Bottom, id: undefined },
        {
          isHandle: true,
          handleType: 'source',
          position: Position.Right,
          id: flowHandleStatics.observableSourceId,
        },
        {
          isHandle: true,
          handleType: 'source',
          position: Position.Right,
          id: flowHandleStatics.loopSourceId,
        },
        {
          isHandle: true,
          handleType: 'target',
          position: Position.Right,
          id: flowHandleStatics.loopTargetId,
        },
      ]);
    });
  });

  describe('observable variant', () => {
    it('VALID: {variant: observable} => single left target handle', () => {
      FlowNodeHandlesWidgetProxy();

      const element = FlowNodeHandlesWidget({ variant: 'observable' });
      const fragmentProps = element.props as { children: React.ReactNode };
      const children = React.Children.toArray(fragmentProps.children) as React.ReactElement<{
        type: 'source' | 'target';
        position: Position;
      }>[];

      const handleSummaries = children.map((child) => ({
        isHandle: child.type === Handle,
        handleType: child.props.type,
        position: child.props.position,
      }));

      expect(handleSummaries).toStrictEqual([
        { isHandle: true, handleType: 'target', position: Position.Left },
      ]);
    });
  });
});
