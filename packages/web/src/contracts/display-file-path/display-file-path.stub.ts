import { displayFilePathContract } from './display-file-path-contract';
import type { DisplayFilePath } from './display-file-path-contract';

export const DisplayFilePathStub = ({ value }: { value?: string } = {}): DisplayFilePath =>
  displayFilePathContract.parse(value ?? 'src/auth.ts');
