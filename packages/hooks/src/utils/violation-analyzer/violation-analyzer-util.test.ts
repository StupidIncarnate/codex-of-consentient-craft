import { ViolationAnalyzerUtil } from './violation-analyzer-util';
import { countViolationsByRule } from './count-violations-by-rule';
import { findNewViolations } from './find-new-violations';
import { formatViolationMessage } from './format-violation-message';
import { hasNewViolations } from './has-new-violations';

describe('ViolationAnalyzerUtil', () => {
  it('exports countViolationsByRule function', () => {
    expect(ViolationAnalyzerUtil.countViolationsByRule).toBe(countViolationsByRule);
  });

  it('exports findNewViolations function', () => {
    expect(ViolationAnalyzerUtil.findNewViolations).toBe(findNewViolations);
  });

  it('exports formatViolationMessage function', () => {
    expect(ViolationAnalyzerUtil.formatViolationMessage).toBe(formatViolationMessage);
  });

  it('exports hasNewViolations function', () => {
    expect(ViolationAnalyzerUtil.hasNewViolations).toBe(hasNewViolations);
  });
});
