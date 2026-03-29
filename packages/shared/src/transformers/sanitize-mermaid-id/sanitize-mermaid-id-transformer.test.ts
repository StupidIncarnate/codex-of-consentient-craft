import { ContentTextStub } from '../../contracts/content-text/content-text.stub';

import { sanitizeMermaidIdTransformer } from './sanitize-mermaid-id-transformer';

describe('sanitizeMermaidIdTransformer', () => {
  describe('reserved keywords', () => {
    it('EDGE: {id: "end-node"} => returns "_end-node"', () => {
      const id = ContentTextStub({ value: 'end-node' });

      const result = sanitizeMermaidIdTransformer({ id });

      expect(result).toBe('_end-node');
    });

    it('EDGE: {id: "end"} => returns "_end"', () => {
      const id = ContentTextStub({ value: 'end' });

      const result = sanitizeMermaidIdTransformer({ id });

      expect(result).toBe('_end');
    });

    it('EDGE: {id: "subgraph-container"} => returns "_subgraph-container"', () => {
      const id = ContentTextStub({ value: 'subgraph-container' });

      const result = sanitizeMermaidIdTransformer({ id });

      expect(result).toBe('_subgraph-container');
    });

    it('EDGE: {id: "style-check"} => returns "_style-check"', () => {
      const id = ContentTextStub({ value: 'style-check' });

      const result = sanitizeMermaidIdTransformer({ id });

      expect(result).toBe('_style-check');
    });

    it('EDGE: {id: "click-handler"} => returns "_click-handler"', () => {
      const id = ContentTextStub({ value: 'click-handler' });

      const result = sanitizeMermaidIdTransformer({ id });

      expect(result).toBe('_click-handler');
    });

    it('EDGE: {id: "default-state"} => returns "_default-state"', () => {
      const id = ContentTextStub({ value: 'default-state' });

      const result = sanitizeMermaidIdTransformer({ id });

      expect(result).toBe('_default-state');
    });

    it('EDGE: {id: "class-check"} => returns "_class-check"', () => {
      const id = ContentTextStub({ value: 'class-check' });

      const result = sanitizeMermaidIdTransformer({ id });

      expect(result).toBe('_class-check');
    });

    it('EDGE: {id: "direction-toggle"} => returns "_direction-toggle"', () => {
      const id = ContentTextStub({ value: 'direction-toggle' });

      const result = sanitizeMermaidIdTransformer({ id });

      expect(result).toBe('_direction-toggle');
    });
  });

  describe('safe identifiers', () => {
    it('VALID: {id: "start-node"} => returns "start-node" unchanged', () => {
      const id = ContentTextStub({ value: 'start-node' });

      const result = sanitizeMermaidIdTransformer({ id });

      expect(result).toBe('start-node');
    });

    it('VALID: {id: "login-page"} => returns "login-page" unchanged', () => {
      const id = ContentTextStub({ value: 'login-page' });

      const result = sanitizeMermaidIdTransformer({ id });

      expect(result).toBe('login-page');
    });

    it('VALID: {id: "render-endpoint"} => returns "render-endpoint" unchanged', () => {
      const id = ContentTextStub({ value: 'render-endpoint' });

      const result = sanitizeMermaidIdTransformer({ id });

      expect(result).toBe('render-endpoint');
    });

    it('VALID: {id: "send-message"} => returns "send-message" unchanged', () => {
      const id = ContentTextStub({ value: 'send-message' });

      const result = sanitizeMermaidIdTransformer({ id });

      expect(result).toBe('send-message');
    });

    it('VALID: {id: "endpoint"} => returns "endpoint" unchanged', () => {
      const id = ContentTextStub({ value: 'endpoint' });

      const result = sanitizeMermaidIdTransformer({ id });

      expect(result).toBe('endpoint');
    });
  });
});
