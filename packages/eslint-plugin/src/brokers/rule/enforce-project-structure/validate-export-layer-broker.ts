/**
 * PURPOSE: Validates export count, naming suffix, case, and name match (Level 4b of project structure validation)
 *
 * USAGE:
 * validateExportLayerBroker({node, context, filename, firstFolder, folderConfig, collectedExports});
 * // Reports all export naming violations found; no return value (terminal layer)
 */
import type { CollectedExport } from '../../../contracts/collected-export/collected-export-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import type { Identifier } from '@dungeonmaster/shared/contracts';
import type { folderConfigStatics } from '@dungeonmaster/shared/statics';
import { hasFileSuffixGuard } from '../../../guards/has-file-suffix/has-file-suffix-guard';
import { isCamelCaseGuard } from '../../../guards/is-camel-case/is-camel-case-guard';
import { isPascalCaseGuard } from '../../../guards/is-pascal-case/is-pascal-case-guard';
import { expectedExportNameTransformer } from '../../../transformers/expected-export-name/expected-export-name-transformer';
import { getFileExtensionTransformer } from '../../../transformers/get-file-extension/get-file-extension-transformer';

export const validateExportLayerBroker = ({
  node,
  context,
  filename,
  firstFolder,
  folderConfig,
  collectedExports,
}: {
  node: Tsestree;
  context: EslintContext;
  filename: string;
  firstFolder: Identifier;
  folderConfig: (typeof folderConfigStatics)[keyof typeof folderConfigStatics];
  collectedExports: CollectedExport[];
}): void => {
  const isProxy = hasFileSuffixGuard({ filename, suffix: 'proxy' });
  const fileExtension = getFileExtensionTransformer({ filename, includesDot: true });
  const proxySuffix = fileExtension === '.tsx' ? '.proxy.tsx' : '.proxy.ts';
  const fileSuffix = isProxy ? proxySuffix : folderConfig.fileSuffix;
  const exportSuffix = isProxy ? 'Proxy' : folderConfig.exportSuffix;
  const { exportCase } = folderConfig;

  const expectedExportName = expectedExportNameTransformer({
    filename,
    fileSuffix,
    exportSuffix,
    exportCase: exportCase === '' ? 'PascalCase' : exportCase,
  });

  const valueExports = collectedExports.filter((e) => !e.isTypeOnly);
  const isStartup = exportSuffix === '';

  if (valueExports.length === 0) {
    if (!isStartup) {
      context.report({
        node,
        messageId: 'missingExpectedExport',
        data: { expectedName: expectedExportName, actualCount: '0' },
      });
    }
    return;
  }

  if (valueExports.length > 1) {
    const exportNames = valueExports.map((e) => e.name).join(', ');
    context.report({
      node,
      messageId: 'multipleValueExports',
      data: {
        expectedName: expectedExportName,
        actualCount: String(valueExports.length),
        exportNames,
      },
    });
    return;
  }

  const [singleExport] = valueExports;
  if (!singleExport) return;
  const exportName = singleExport.name ?? '';

  const hasSuffixError = exportSuffix !== '' && !exportName.endsWith(exportSuffix);

  const isCorrectCase =
    exportCase === 'PascalCase'
      ? isPascalCaseGuard({ str: exportName })
      : isCamelCaseGuard({ str: exportName });
  const hasCaseError = !isCorrectCase;

  const hasNameMismatch = exportName !== expectedExportName;

  if (hasSuffixError) {
    context.report({
      node,
      messageId: 'invalidExportSuffix',
      data: { expected: exportSuffix, folderType: firstFolder },
    });
  }

  if (hasCaseError) {
    context.report({
      node,
      messageId: 'invalidExportCase',
      data: { expected: exportCase, folderType: firstFolder },
    });
  }

  if (hasNameMismatch) {
    context.report({
      node,
      messageId: 'filenameMismatch',
      data: { exportName, expectedName: expectedExportName },
    });
  }
};
