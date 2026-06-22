import React from 'react';

import { Handle, Position } from '@xyflow/react';

import { xyflowNodeHandlesAdapter } from './xyflow-node-handles-adapter';
import { xyflowNodeHandlesAdapterProxy } from './xyflow-node-handles-adapter.proxy';

describe('xyflowNodeHandlesAdapter', () => {
  describe('handle structure', () => {
    it('VALID: {} => returns a target handle on top and a source handle on bottom', () => {
      xyflowNodeHandlesAdapterProxy();

      const element = xyflowNodeHandlesAdapter();
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
        { isHandle: true, handleType: 'target', position: Position.Top },
        { isHandle: true, handleType: 'source', position: Position.Bottom },
      ]);
    });
  });
});
