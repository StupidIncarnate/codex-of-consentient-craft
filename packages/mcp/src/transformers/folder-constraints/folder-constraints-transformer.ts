/**
 * PURPOSE: Transforms folder type and config into critical constraints markdown section
 *
 * USAGE:
 * const constraints = folderConstraintsTransformer({ folderType: FolderTypeStub({ value: 'brokers' }), config: FolderConfigStub({...}) });
 * // Returns markdown text with MUST/MUST NOT constraints
 */

import type { FolderType, FolderConfig } from '@dungeonmaster/shared/contracts';

export const folderConstraintsTransformer = ({
  config,
  supplementalConstraints,
}: {
  folderType: FolderType;
  config: FolderConfig;
  supplementalConstraints?: string;
}): string => {
  const constraints: string[] = [];

  // Universal constraints
  const universalConstraints =
    '**MUST:**\n- Use kebab-case filenames\n- Export with `export const` arrow functions\n- Include PURPOSE and USAGE metadata comments\n- Co-locate test files with implementation';
  constraints.push(universalConstraints);

  // Folder-specific constraints
  if (config.requireProxy) {
    const proxyConstraints =
      '\n**MUST (Testing):**\n- Create `.proxy.ts` file for test setup\n- Mock only I/O boundaries (adapters)\n- All business logic runs real in tests';
    constraints.push(proxyConstraints);
  }

  if (config.disallowAdhocTypes) {
    const typeConstraints =
      '\n**MUST NOT:**\n- Define inline types or interfaces\n- Use raw primitives (string, number) in signatures\n- All types must come from contracts/';
    constraints.push(typeConstraints);
  }

  if (config.allowedImports.length > 0 && !config.allowedImports.some((imp) => imp === '*')) {
    const importList = config.allowedImports.map((imp) => `\`${imp}\``).join(', ');
    const importConstraints = `\n**IMPORT RESTRICTIONS:**\n- Only import from: ${importList}\n- Importing from other layers violates architecture`;
    constraints.push(importConstraints);
  }

  // Folder-specific supplemental constraints (passed from caller)
  if (supplementalConstraints) {
    constraints.push(supplementalConstraints);
  }

  return constraints.join('\n');
};
