
import { promptTemplateAssembleTransformer } from './prompt-template-assemble-transformer';

describe('promptTemplateAssembleTransformer', () => {
  describe('placeholder replacement', () => {
    it('VALID: {template: "Hello {{name}}", placeholder: "{{name}}", value: "World"} => returns "Hello World"', () => {
      const template = 'Hello {{name}}';
      const placeholder = '{{name}}';
      const value = 'World';

      const result = promptTemplateAssembleTransformer({ template, placeholder, value });

      expect(result).toBe('Hello World');
    });
  });

  describe('surrounding text preserved', () => {
    it('VALID: {template with text before and after placeholder} => preserves surrounding text', () => {
      const template = 'Before {{slot}} After';
      const placeholder = '{{slot}}';
      const value = 'MIDDLE';

      const result = promptTemplateAssembleTransformer({ template, placeholder, value });

      expect(result).toBe('Before MIDDLE After');
    });
  });

  describe('special characters in value', () => {
    it('VALID: {value with special chars} => preserves special characters', () => {
      const template = 'Result: {{output}}';
      const placeholder = '{{output}}';
      const value = 'price=$100 & tax=10%';

      const result = promptTemplateAssembleTransformer({ template, placeholder, value });

      expect(result).toBe('Result: price=$100 & tax=10%');
    });
  });
});
