/**
 * PURPOSE: Replaces a placeholder in a prompt template with a given value
 *
 * USAGE:
 * promptTemplateAssembleTransformer({ template: ContentTextStub({ value: 'Hello {{name}}' }), placeholder: ContentTextStub({ value: '{{name}}' }), value: ContentTextStub({ value: 'World' }) });
 * // Returns: ContentText('Hello World')
 */

import { contentTextContract } from '../../contracts/content-text/content-text-contract';
import type { ContentText } from '../../contracts/content-text/content-text-contract';

export const promptTemplateAssembleTransformer = ({
  template,
  placeholder,
  value,
}: {
  template: ContentText;
  placeholder: ContentText;
  value: ContentText;
}): ContentText => contentTextContract.parse(template.replace(placeholder, value));
