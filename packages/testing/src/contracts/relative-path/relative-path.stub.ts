import { relativePathContract } from './relative-path-contract';
import type { RelativePath } from './relative-path-contract';

export const RelativePathStub = ({ value }: { value: string }): RelativePath =>
  relativePathContract.parse(value);
