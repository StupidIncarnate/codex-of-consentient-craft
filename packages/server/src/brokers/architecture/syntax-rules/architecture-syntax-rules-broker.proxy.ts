/**
 * PURPOSE: Proxy for architecture-syntax-rules-broker - no mocking needed for static data formatting
 *
 * USAGE:
 * const proxy = architectureSyntaxRulesBrokerProxy();
 * // Returns empty object - broker uses only static data
 */
import { formatCliOutputSectionLayerBrokerProxy } from './format-cli-output-section-layer-broker.proxy';
import { formatErrorHandlingSectionLayerBrokerProxy } from './format-error-handling-section-layer-broker.proxy';
import { formatFileMetadataSectionLayerBrokerProxy } from './format-file-metadata-section-layer-broker.proxy';
import { formatFileNamingSectionLayerBrokerProxy } from './format-file-naming-section-layer-broker.proxy';
import { formatFunctionExportsSectionLayerBrokerProxy } from './format-function-exports-section-layer-broker.proxy';
import { formatFunctionParametersSectionLayerBrokerProxy } from './format-function-parameters-section-layer-broker.proxy';
import { formatImportRulesSectionLayerBrokerProxy } from './format-import-rules-section-layer-broker.proxy';
import { formatLoopControlSectionLayerBrokerProxy } from './format-loop-control-section-layer-broker.proxy';
import { formatNamedExportsSectionLayerBrokerProxy } from './format-named-exports-section-layer-broker.proxy';
import { formatPerformanceSectionLayerBrokerProxy } from './format-performance-section-layer-broker.proxy';
import { formatPromiseHandlingSectionLayerBrokerProxy } from './format-promise-handling-section-layer-broker.proxy';
import { formatSingleResponsibilitySectionLayerBrokerProxy } from './format-single-responsibility-section-layer-broker.proxy';
import { formatSummaryChecklistSectionLayerBrokerProxy } from './format-summary-checklist-section-layer-broker.proxy';
import { formatTestingAntiPatternsSectionLayerBrokerProxy } from './format-testing-anti-patterns-section-layer-broker.proxy';
import { formatTypeExportsSectionLayerBrokerProxy } from './format-type-exports-section-layer-broker.proxy';
import { formatTypeSafetySectionLayerBrokerProxy } from './format-type-safety-section-layer-broker.proxy';

export const architectureSyntaxRulesBrokerProxy = (): Record<PropertyKey, never> => {
  formatCliOutputSectionLayerBrokerProxy();
  formatErrorHandlingSectionLayerBrokerProxy();
  formatFileMetadataSectionLayerBrokerProxy();
  formatFileNamingSectionLayerBrokerProxy();
  formatFunctionExportsSectionLayerBrokerProxy();
  formatFunctionParametersSectionLayerBrokerProxy();
  formatImportRulesSectionLayerBrokerProxy();
  formatLoopControlSectionLayerBrokerProxy();
  formatNamedExportsSectionLayerBrokerProxy();
  formatPerformanceSectionLayerBrokerProxy();
  formatPromiseHandlingSectionLayerBrokerProxy();
  formatSingleResponsibilitySectionLayerBrokerProxy();
  formatSummaryChecklistSectionLayerBrokerProxy();
  formatTestingAntiPatternsSectionLayerBrokerProxy();
  formatTypeExportsSectionLayerBrokerProxy();
  formatTypeSafetySectionLayerBrokerProxy();

  return {};
};
