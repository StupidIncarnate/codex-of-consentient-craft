import { z } from 'zod';
import type { EslintContext } from './eslint-context-contract';

const filenameContract = z.string().brand<'Filename'>();

export const EslintContextStub = (props: Partial<EslintContext> = {}): EslintContext => ({
  report: (): boolean => true,
  getFilename: () => filenameContract.parse('/test/file.ts'),
  getScope: (): unknown => ({}),
  getSourceCode: (): unknown => ({}),
  ...props,
});
