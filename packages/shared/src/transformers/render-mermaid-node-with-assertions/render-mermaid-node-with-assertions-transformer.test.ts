import { ContentTextStub } from '../../contracts/content-text/content-text.stub';
import { FlowNodeStub } from '../../contracts/flow-node/flow-node.stub';

import { renderMermaidNodeWithAssertionsTransformer } from './render-mermaid-node-with-assertions-transformer';

describe('renderMermaidNodeWithAssertionsTransformer', () => {
  describe('state nodes', () => {
    it('VALID: {type: state, 1 assertion} => renders quoted label with brackets', () => {
      const node = FlowNodeStub({ id: 'login-page', label: 'Login Page', type: 'state' });
      const assertions = [ContentTextStub({ value: 'shows login form' })];

      const result = renderMermaidNodeWithAssertionsTransformer({ node, assertions });

      expect(result).toBe('login-page["<b>Login Page</b><br/><small>· shows login form</small>"]');
    });

    it('VALID: {type: state, 2 assertions} => renders both assertions', () => {
      const node = FlowNodeStub({ id: 'login-page', label: 'Login Page', type: 'state' });
      const assertions = [
        ContentTextStub({ value: 'shows login form' }),
        ContentTextStub({ value: 'disables submit button' }),
      ];

      const result = renderMermaidNodeWithAssertionsTransformer({ node, assertions });

      expect(result).toBe(
        'login-page["<b>Login Page</b><br/><small>· shows login form</small><br/><small>· disables submit button</small>"]',
      );
    });
  });

  describe('decision nodes', () => {
    it('VALID: {type: decision, 1 assertion} => renders as rectangle to avoid oversized shapes', () => {
      const node = FlowNodeStub({ id: 'check-auth', label: 'Authenticated?', type: 'decision' });
      const assertions = [ContentTextStub({ value: 'checks session token' })];

      const result = renderMermaidNodeWithAssertionsTransformer({ node, assertions });

      expect(result).toBe(
        'check-auth["<b>Authenticated?</b><br/><small>· checks session token</small>"]',
      );
    });
  });

  describe('action nodes', () => {
    it('VALID: {type: action, 1 assertion} => renders as rectangle to avoid oversized shapes', () => {
      const node = FlowNodeStub({ id: 'submit-form', label: 'Submit Form', type: 'action' });
      const assertions = [ContentTextStub({ value: 'sends POST request' })];

      const result = renderMermaidNodeWithAssertionsTransformer({ node, assertions });

      expect(result).toBe(
        'submit-form["<b>Submit Form</b><br/><small>· sends POST request</small>"]',
      );
    });
  });

  describe('terminal nodes', () => {
    it('VALID: {type: terminal, 1 assertion} => renders as rectangle to avoid oversized shapes', () => {
      const node = FlowNodeStub({ id: 'end', label: 'End', type: 'terminal' });
      const assertions = [ContentTextStub({ value: 'session cleaned up' })];

      const result = renderMermaidNodeWithAssertionsTransformer({ node, assertions });

      expect(result).toBe('end["<b>End</b><br/><small>· session cleaned up</small>"]');
    });
  });

  describe('labels with special characters', () => {
    it('VALID: {label with quotes} => escapes quotes as &quot;', () => {
      const node = FlowNodeStub({ id: 'msg', label: 'Show "error"', type: 'state' });
      const assertions = [ContentTextStub({ value: 'displays message' })];

      const result = renderMermaidNodeWithAssertionsTransformer({ node, assertions });

      expect(result).toBe(
        'msg["<b>Show &quot;error&quot;</b><br/><small>· displays message</small>"]',
      );
    });
  });

  describe('assertions with special characters', () => {
    it('VALID: {assertion with quotes} => escapes quotes in assertion text', () => {
      const node = FlowNodeStub({ id: 'confirm', label: 'Confirmation dialog', type: 'state' });
      const assertions = [ContentTextStub({ value: 'modal has title "Delete Quest"' })];

      const result = renderMermaidNodeWithAssertionsTransformer({ node, assertions });

      expect(result).toBe(
        'confirm["<b>Confirmation dialog</b><br/><small>· modal has title &quot;Delete Quest&quot;</small>"]',
      );
    });

    it('VALID: {assertion with brackets and pipes} => escapes mermaid special chars', () => {
      const node = FlowNodeStub({ id: 'display', label: 'Show output', type: 'state' });
      const assertions = [ContentTextStub({ value: 'shows [error] with {details} | retry' })];

      const result = renderMermaidNodeWithAssertionsTransformer({ node, assertions });

      expect(result).toBe(
        'display["<b>Show output</b><br/><small>· shows #91;error#93; with #123;details#125; #124; retry</small>"]',
      );
    });
  });
});
