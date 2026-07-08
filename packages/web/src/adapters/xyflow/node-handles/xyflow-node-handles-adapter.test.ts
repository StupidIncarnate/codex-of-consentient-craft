import React from 'react';

import { Handle, Position } from '@xyflow/react';

import { flowHandleStatics } from '../../../statics/flow-handle/flow-handle-statics';
import { xyflowNodeHandlesAdapter } from './xyflow-node-handles-adapter';
import { xyflowNodeHandlesAdapterProxy } from './xyflow-node-handles-adapter.proxy';

describe('xyflowNodeHandlesAdapter', () => {
  describe('flow-node variant', () => {
    it('VALID: {} => top target, bottom source, right observable source, and right loop handles', () => {
      xyflowNodeHandlesAdapterProxy();

      const element = xyflowNodeHandlesAdapter();
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
      xyflowNodeHandlesAdapterProxy();

      const element = xyflowNodeHandlesAdapter({ variant: 'observable' });
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
