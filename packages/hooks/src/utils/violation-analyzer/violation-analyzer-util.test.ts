import { ViolationAnalyzerUtil } from './violation-analyzer-util';
import { violationAnalyzerUtilCountViolationsByRule } from './violation-analyzer-util-count-violations-by-rule';
import { violationAnalyzerUtilFindNewViolations } from './violation-analyzer-util-find-new-violations';
import { violationAnalyzerUtilFormatViolationMessage } from './violation-analyzer-util-format-violation-message';
import { violationAnalyzerUtilHasNewViolations } from './violation-analyzer-util-has-new-violations';

describe('ViolationAnalyzerUtil', () => {
  it('exports countViolationsByRule function', () => {
    expect(ViolationAnalyzerUtil.countViolationsByRule).toBe(
      violationAnalyzerUtilCountViolationsByRule,
    );
  });

  it('exports findNewViolations function', () => {
    expect(ViolationAnalyzerUtil.findNewViolations).toBe(violationAnalyzerUtilFindNewViolations);
  });

  it('exports formatViolationMessage function', () => {
    expect(ViolationAnalyzerUtil.formatViolationMessage).toBe(
      violationAnalyzerUtilFormatViolationMessage,
    );
  });

  it('exports hasNewViolations function', () => {
    expect(ViolationAnalyzerUtil.hasNewViolations).toBe(violationAnalyzerUtilHasNewViolations);
  });
});
