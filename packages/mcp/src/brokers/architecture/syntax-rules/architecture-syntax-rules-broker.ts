/**
 * PURPOSE: Generates markdown documentation for all universal syntax rules from the eslint-plugin statics
 *
 * USAGE:
 * const markdown = architectureSyntaxRulesBroker();
 * // Returns formatted markdown with all universal syntax rules organized by category
 *
 * WHEN-TO-USE: When generating documentation for universal code standards
 */
import type { ContentText } from '../../../contracts/content-text/content-text-contract';
import { contentTextContract } from '../../../contracts/content-text/content-text-contract';
import { formatCliOutputSectionLayerBroker } from './format-cli-output-section-layer-broker';
import { formatErrorHandlingSectionLayerBroker } from './format-error-handling-section-layer-broker';
import { formatFileMetadataSectionLayerBroker } from './format-file-metadata-section-layer-broker';
import { formatFileNamingSectionLayerBroker } from './format-file-naming-section-layer-broker';
import { formatFunctionExportsSectionLayerBroker } from './format-function-exports-section-layer-broker';
import { formatFunctionParametersSectionLayerBroker } from './format-function-parameters-section-layer-broker';
import { formatImportRulesSectionLayerBroker } from './format-import-rules-section-layer-broker';
import { formatLoopControlSectionLayerBroker } from './format-loop-control-section-layer-broker';
import { formatNamedExportsSectionLayerBroker } from './format-named-exports-section-layer-broker';
import { formatPerformanceSectionLayerBroker } from './format-performance-section-layer-broker';
import { formatPromiseHandlingSectionLayerBroker } from './format-promise-handling-section-layer-broker';
import { formatSingleResponsibilitySectionLayerBroker } from './format-single-responsibility-section-layer-broker';
import { formatSummaryChecklistSectionLayerBroker } from './format-summary-checklist-section-layer-broker';
import { formatTestingAntiPatternsSectionLayerBroker } from './format-testing-anti-patterns-section-layer-broker';
import { formatTypeExportsSectionLayerBroker } from './format-type-exports-section-layer-broker';
import { formatTypeSafetySectionLayerBroker } from './format-type-safety-section-layer-broker';

export const architectureSyntaxRulesBroker = (): ContentText => {
  const sections = [
    '# Universal Syntax Rules',
    '',
    'These rules apply to **all code** regardless of folder type. All rules are enforced by ESLint.',
    '',
    ...formatFileNamingSectionLayerBroker(),
    ...formatFunctionExportsSectionLayerBroker(),
    ...formatNamedExportsSectionLayerBroker(),
    ...formatSingleResponsibilitySectionLayerBroker(),
    ...formatFileMetadataSectionLayerBroker(),
    ...formatFunctionParametersSectionLayerBroker(),
    ...formatImportRulesSectionLayerBroker(),
    ...formatTypeExportsSectionLayerBroker(),
    ...formatTypeSafetySectionLayerBroker(),
    ...formatPromiseHandlingSectionLayerBroker(),
    ...formatLoopControlSectionLayerBroker(),
    ...formatErrorHandlingSectionLayerBroker(),
    ...formatPerformanceSectionLayerBroker(),
    ...formatCliOutputSectionLayerBroker(),
    ...formatTestingAntiPatternsSectionLayerBroker(),
    ...formatSummaryChecklistSectionLayerBroker(),
  ];

  return contentTextContract.parse(sections.join('\n'));
};
