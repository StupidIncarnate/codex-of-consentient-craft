/**
 * PURPOSE: Validates that steps creating implementation files also list required companion files (test, proxy, stub)
 *
 * USAGE:
 * questHasFileCompanionsGuard({steps});
 * // Returns true if every implementation file has its companion test/proxy/stub listed, false otherwise
 */
import type { DependencyStepStub } from '@dungeonmaster/shared/contracts';

type DependencyStep = ReturnType<typeof DependencyStepStub>;

const companionRules = [
  { suffix: '-broker.ts', requireProxy: true },
  { suffix: '-adapter.ts', requireProxy: true },
  { suffix: '-guard.ts', requireProxy: false },
  { suffix: '-transformer.ts', requireProxy: false },
  { suffix: '-middleware.ts', requireProxy: true },
  { suffix: '-binding.ts', requireProxy: true },
  { suffix: '-state.ts', requireProxy: true },
  { suffix: '-responder.ts', requireProxy: true },
];

export const questHasFileCompanionsGuard = ({ steps }: { steps?: DependencyStep[] }): boolean => {
  if (!steps) {
    return false;
  }

  const allFileStrings = steps.flatMap((step) => [
    ...step.filesToCreate.map(String),
    ...step.filesToModify.map(String),
  ]);
  const allFiles = new Set(allFileStrings);

  for (const step of steps) {
    for (const filePath of step.filesToCreate) {
      const path = String(filePath);
      for (const rule of companionRules) {
        if (!path.endsWith(rule.suffix)) {
          continue;
        }

        const basePath = path.slice(0, -rule.suffix.length);
        const testFile = `${basePath}${rule.suffix.replace('.ts', '.test.ts')}`;

        if (!allFiles.has(testFile)) {
          return false;
        }

        if (rule.requireProxy) {
          const proxyFile = `${basePath}${rule.suffix.replace('.ts', '.proxy.ts')}`;
          if (!allFiles.has(proxyFile)) {
            return false;
          }
        }
      }

      if (path.endsWith('-contract.ts')) {
        const contractDir = path.slice(0, path.lastIndexOf('/'));
        const contractBase = path.slice(path.lastIndexOf('/') + 1).replace('-contract.ts', '');
        const testFile = `${contractDir}/${contractBase}-contract.test.ts`;
        const stubFile = `${contractDir}/${contractBase}.stub.ts`;

        if (!allFiles.has(testFile)) {
          return false;
        }
        if (!allFiles.has(stubFile)) {
          return false;
        }
      }
    }
  }

  return true;
};
