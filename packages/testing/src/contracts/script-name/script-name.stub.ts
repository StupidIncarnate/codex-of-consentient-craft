import { scriptNameContract } from './script-name-contract';
import type { ScriptName } from './script-name-contract';

export const ScriptNameStub = ({ value }: { value: string } = { value: 'test' }): ScriptName =>
  scriptNameContract.parse(value);
