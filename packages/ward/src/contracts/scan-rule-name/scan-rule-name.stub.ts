import { scanRuleNameContract } from './scan-rule-name-contract';
import type { ScanRuleName } from './scan-rule-name-contract';

export const ScanRuleNameStub = (
  { value }: { value: string } = { value: '@dungeonmaster/ban-workspace-export-mocks' },
): ScanRuleName => scanRuleNameContract.parse(value);
