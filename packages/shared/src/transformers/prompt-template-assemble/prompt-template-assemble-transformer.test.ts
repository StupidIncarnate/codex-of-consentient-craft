import { ContentTextStub } from '../../contracts/content-text/content-text.stub';

import { promptTemplateAssembleTransformer } from './prompt-template-assemble-transformer';

describe('promptTemplateAssembleTransformer', () => {
  describe('placeholder replacement', () => {
    it('VALID: {template: "Hello {{name}}", placeholder: "{{name}}", value: "World"} => returns "Hello World"', () => {
      const template = ContentTextStub({ value: 'Hello {{name}}' });
      const placeholder = ContentTextStub({ value: '{{name}}' });
      const value = ContentTextStub({ value: 'World' });

      const result = promptTemplateAssembleTransformer({ template, placeholder, value });

      expect(result).toBe('Hello World');
    });
  });

  describe('surrounding text preserved', () => {
    it('VALID: {template with text before and after placeholder} => preserves surrounding text', () => {
      const template = ContentTextStub({ value: 'Before {{slot}} After' });
      const placeholder = ContentTextStub({ value: '{{slot}}' });
      const value = ContentTextStub({ value: 'MIDDLE' });

      const result = promptTemplateAssembleTransformer({ template, placeholder, value });

      expect(result).toBe('Before MIDDLE After');
    });
  });

  describe('special characters in value', () => {
    it('VALID: {value with special chars} => preserves special characters', () => {
      const template = ContentTextStub({ value: 'Result: {{output}}' });
      const placeholder = ContentTextStub({ value: '{{output}}' });
      const value = ContentTextStub({ value: 'price=$100 & tax=10%' });

      const result = promptTemplateAssembleTransformer({ template, placeholder, value });

      expect(result).toBe('Result: price=$100 & tax=10%');
    });
  });
});
