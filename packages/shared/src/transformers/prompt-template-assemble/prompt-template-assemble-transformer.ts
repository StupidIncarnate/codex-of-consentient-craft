/**
 * PURPOSE: Replaces a placeholder in a prompt template with a given value
 *
 * USAGE:
 * promptTemplateAssembleTransformer({ template: ContentTextStub({ value: 'Hello {{name}}' }), placeholder: ContentTextStub({ value: '{{name}}' }), value: ContentTextStub({ value: 'World' }) });
 * // Returns: ContentText('Hello World')
 */

export const promptTemplateAssembleTransformer = ({
  template,
  placeholder,
  value,
}: {
  template: string;
  placeholder: string;
  value: string;
}): string => template.replace(placeholder, value);
