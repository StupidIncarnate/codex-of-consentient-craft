/**
 * PURPOSE: Replaces a placeholder in a prompt template with a given value
 *
 * USAGE:
 * promptTemplateAssembleTransformer({ template: 'Hello {{name}}', placeholder: '{{name}}', value: 'World' });
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
