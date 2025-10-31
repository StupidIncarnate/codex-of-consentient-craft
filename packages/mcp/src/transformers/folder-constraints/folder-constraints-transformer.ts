/**
 * PURPOSE: Transforms folder type and config into critical constraints markdown section
 *
 * USAGE:
 * const constraints = folderConstraintsTransformer({ folderType: FolderTypeStub({ value: 'brokers' }), config: FolderConfigStub({...}) });
 * // Returns markdown text with MUST/MUST NOT constraints
 */

import type { FolderType, FolderConfig } from '@questmaestro/shared/contracts';
import { contentTextContract } from '../../contracts/content-text/content-text-contract';
import type { ContentText } from '../../contracts/content-text/content-text-contract';

export const folderConstraintsTransformer = ({
  folderType,
  config,
}: {
  folderType: FolderType;
  config: FolderConfig;
}): ContentText => {
  const constraints: ContentText[] = [];

  // Universal constraints
  const universalConstraints = contentTextContract.parse(
    '**MUST:**\n- Use kebab-case filenames\n- Export with `export const` arrow functions\n- Include PURPOSE and USAGE metadata comments\n- Co-locate test files with implementation',
  );
  constraints.push(universalConstraints);

  // Folder-specific constraints
  if (config.requireProxy) {
    const proxyConstraints = contentTextContract.parse(
      '\n**MUST (Testing):**\n- Create `.proxy.ts` file for test setup\n- Mock only I/O boundaries (adapters)\n- All business logic runs real in tests',
    );
    constraints.push(proxyConstraints);
  }

  if (config.disallowAdhocTypes) {
    const typeConstraints = contentTextContract.parse(
      '\n**MUST NOT:**\n- Define inline types or interfaces\n- Use raw primitives (string, number) in signatures\n- All types must come from contracts/',
    );
    constraints.push(typeConstraints);
  }

  if (config.allowedImports.length > 0 && !config.allowedImports.some((imp) => imp === '*')) {
    const importList = config.allowedImports.map((imp) => `\`${imp}\``).join(', ');
    const importConstraints = contentTextContract.parse(
      `\n**IMPORT RESTRICTIONS:**\n- Only import from: ${importList}\n- Importing from other layers violates architecture`,
    );
    constraints.push(importConstraints);
  }

  if (folderType === 'brokers' || folderType === 'widgets') {
    const complexityConstraints = contentTextContract.parse(
      '\n**COMPLEXITY:**\n- Keep files under 300 lines\n- If exceeding, decompose into layer files\n- Each layer file has own proxy and tests',
    );
    constraints.push(complexityConstraints);
  }

  return contentTextContract.parse(constraints.join('\n'));
};
