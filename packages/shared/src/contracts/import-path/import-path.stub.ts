/**
 * PURPOSE: Stub factory for ImportPath branded string type
 *
 * USAGE:
 * const path = ImportPathStub({ value: 'statics' });
 * // Returns branded ImportPath string
 */
import { importPathContract, type ImportPath } from './import-path-contract';

export const ImportPathStub = ({ value }: { value: string } = { value: 'statics' }): ImportPath =>
  importPathContract.parse(value);
