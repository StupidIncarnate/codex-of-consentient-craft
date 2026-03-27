/**
 * PURPOSE: Computes specific failure details for quest verification checks, identifying exactly which items failed
 *
 * USAGE:
 * questVerifyFailureDetailsTransformer({quest, checkName: parsedCheckName});
 * // Returns branded CheckDetails string with specific step names, file paths, and IDs that caused the failure
 */
import type { QuestStub, FolderType } from '@dungeonmaster/shared/contracts';
import { folderConfigStatics } from '@dungeonmaster/shared/statics';

import type { VerifyQuestCheck } from '../../contracts/verify-quest-check/verify-quest-check-contract';
import { verifyQuestCheckContract } from '../../contracts/verify-quest-check/verify-quest-check-contract';
import { isEntryFileGuard } from '../../guards/is-entry-file/is-entry-file-guard';

type Quest = ReturnType<typeof QuestStub>;

const checkDetailsSchema = verifyQuestCheckContract.shape.details;

const rawPrimitiveBlocklist = new Set(['string', 'number', 'any', 'object', 'unknown']);

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

export const questVerifyFailureDetailsTransformer = ({
  quest,
  checkName,
}: {
  quest: Quest;
  checkName: VerifyQuestCheck['name'];
}): VerifyQuestCheck['details'] => {
  if (checkName === 'Observable Coverage') {
    const allObservables = quest.flows.flatMap((f) => f.nodes.flatMap((n) => n.observables));
    const coveredIds = new Set(quest.steps.flatMap((s) => s.observablesSatisfied.map(String)));
    const uncovered = allObservables
      .filter((o) => !coveredIds.has(String(o.id)))
      .map((o) => String(o.id));
    return checkDetailsSchema.parse(
      `Uncovered observable IDs (not in any step's observablesSatisfied): ${uncovered.join(', ')}`,
    );
  }

  if (checkName === 'Dependency Integrity') {
    const stepIds = new Set(quest.steps.map((s) => String(s.id)));
    const issues = quest.steps
      .filter((s) => s.dependsOn.some((dep) => !stepIds.has(String(dep))))
      .map((s) => {
        const invalid = s.dependsOn.filter((dep) => !stepIds.has(String(dep)));
        return `step "${String(s.name)}" dependsOn non-existent: [${invalid.map(String).join(', ')}]`;
      });
    return checkDetailsSchema.parse(issues.join('; '));
  }

  if (checkName === 'No Circular Dependencies') {
    return checkDetailsSchema.parse(
      'Circular dependency detected in step dependency graph — run topological sort to identify the cycle',
    );
  }

  if (checkName === 'No Orphan Steps') {
    const orphans = quest.steps
      .filter((s) => s.observablesSatisfied.length === 0)
      .map((s) => `"${String(s.name)}"`);
    return checkDetailsSchema.parse(`Steps with empty observablesSatisfied: ${orphans.join(', ')}`);
  }

  if (checkName === 'File Companion Completeness') {
    const allFileStrings = quest.steps.flatMap((step) => [
      ...step.filesToCreate.map(String),
      ...step.filesToModify.map(String),
    ]);
    const allFiles = new Set(allFileStrings);
    const missing = quest.steps.flatMap((step) =>
      step.filesToCreate.flatMap((filePath) => {
        const path = String(filePath);
        const results: { file: VerifyQuestCheck['details']; needs: VerifyQuestCheck['details'] }[] =
          [];

        for (const rule of companionRules) {
          if (!path.endsWith(rule.suffix)) {
            continue;
          }
          const basePath = path.slice(0, -rule.suffix.length);
          const testFile = `${basePath}${rule.suffix.replace('.ts', '.test.ts')}`;
          if (!allFiles.has(testFile)) {
            results.push({
              file: checkDetailsSchema.parse(path),
              needs: checkDetailsSchema.parse(testFile),
            });
          }
          if (rule.requireProxy) {
            const proxyFile = `${basePath}${rule.suffix.replace('.ts', '.proxy.ts')}`;
            if (!allFiles.has(proxyFile)) {
              results.push({
                file: checkDetailsSchema.parse(path),
                needs: checkDetailsSchema.parse(proxyFile),
              });
            }
          }
        }

        if (path.endsWith('-contract.ts')) {
          const contractDir = path.slice(0, path.lastIndexOf('/'));
          const contractBase = path.slice(path.lastIndexOf('/') + 1).replace('-contract.ts', '');
          const testFile = `${contractDir}/${contractBase}-contract.test.ts`;
          const stubFile = `${contractDir}/${contractBase}.stub.ts`;
          if (!allFiles.has(testFile)) {
            results.push({
              file: checkDetailsSchema.parse(path),
              needs: checkDetailsSchema.parse(testFile),
            });
          }
          if (!allFiles.has(stubFile)) {
            results.push({
              file: checkDetailsSchema.parse(path),
              needs: checkDetailsSchema.parse(stubFile),
            });
          }
        }

        return results;
      }),
    );

    const details = missing.map((m) => `"${String(m.file)}" needs "${String(m.needs)}"`).join('; ');
    return checkDetailsSchema.parse(`Missing companion files: ${details}`);
  }

  if (checkName === 'No Raw Primitives in Contracts') {
    const issues = quest.contracts.flatMap((contract) =>
      contract.properties
        .filter((p) => p.type && rawPrimitiveBlocklist.has(String(p.type).toLowerCase()))
        .map(
          (p) =>
            `contract "${String(contract.name)}" property "${String(p.name)}" uses raw type "${String(p.type)}"`,
        ),
    );
    return checkDetailsSchema.parse(issues.join('; '));
  }

  if (checkName === 'Step Contract Declarations') {
    const issues = quest.steps
      .filter((step) => {
        const allFiles = [...step.filesToCreate.map(String), ...step.filesToModify.map(String)];
        if (allFiles.length === 0) {
          return false;
        }
        const folderTypes = allFiles.reduce<FolderType[]>((acc, fp) => {
          const [, candidate] = /src\/([^/]+)\//u.exec(fp) ?? [];
          if (candidate && candidate in folderConfigStatics) {
            acc.push(candidate as FolderType);
          }
          return acc;
        }, []);
        const needsContracts = folderTypes.some(
          (ft) =>
            folderConfigStatics[ft as keyof typeof folderConfigStatics].requireContractDeclarations,
        );
        return needsContracts && step.outputContracts.length === 0;
      })
      .map((step) => {
        const allFiles = [...step.filesToCreate.map(String), ...step.filesToModify.map(String)];
        const folders = allFiles.reduce<FolderType[]>((acc, fp) => {
          const [, candidate] = /src\/([^/]+)\//u.exec(fp) ?? [];
          if (
            candidate &&
            candidate in folderConfigStatics &&
            folderConfigStatics[candidate as keyof typeof folderConfigStatics]
              .requireContractDeclarations
          ) {
            acc.push(candidate as FolderType);
          }
          return acc;
        }, []);
        const uniqueFolders = [...new Set(folders)];
        return `step "${String(step.name)}" touches folders [${uniqueFolders.join(', ')}] which require contract declarations but has empty outputContracts`;
      });
    return checkDetailsSchema.parse(issues.join('; '));
  }

  if (checkName === 'Valid Contract References') {
    const contractNames = new Set(quest.contracts.map((c) => String(c.name)));
    const issues = quest.steps.flatMap((step) => [
      ...step.inputContracts
        .filter((n) => !contractNames.has(String(n)))
        .map(
          (n) =>
            `step "${String(step.name)}" inputContracts references non-existent: "${String(n)}"`,
        ),
      ...step.outputContracts
        .filter((n) => !contractNames.has(String(n)))
        .map(
          (n) =>
            `step "${String(step.name)}" outputContracts references non-existent: "${String(n)}"`,
        ),
    ]);
    return checkDetailsSchema.parse(issues.join('; '));
  }

  if (checkName === 'Step Export Names') {
    const issues = quest.steps
      .filter((step) => {
        if (step.filesToCreate.length === 0) {
          return false;
        }
        const hasEntryFile = step.filesToCreate.some((fp) =>
          isEntryFileGuard({ filePath: String(fp), folderConfigs: folderConfigStatics }),
        );
        return hasEntryFile && (!step.exportName || String(step.exportName).trim() === '');
      })
      .map((step) => {
        const entryFiles = step.filesToCreate
          .filter((fp) =>
            isEntryFileGuard({ filePath: String(fp), folderConfigs: folderConfigStatics }),
          )
          .map(String);
        return `step "${String(step.name)}" creates entry files [${entryFiles.join(', ')}] but has no exportName`;
      });
    return checkDetailsSchema.parse(issues.join('; '));
  }

  if (checkName === 'Valid Flow References') {
    const issues = quest.flows.flatMap((flow) => {
      const nodeIds = new Set(flow.nodes.map((n) => String(n.id)));
      return flow.edges.flatMap((edge) => {
        const from = String(edge.from);
        const to = String(edge.to);
        const edgeIssues = [];
        if (!from.includes(':') && !nodeIds.has(from)) {
          edgeIssues.push(
            `flow "${String(flow.name)}" edge from "${from}" references non-existent node`,
          );
        }
        if (!to.includes(':') && !nodeIds.has(to)) {
          edgeIssues.push(
            `flow "${String(flow.name)}" edge to "${to}" references non-existent node`,
          );
        }
        return edgeIssues;
      });
    });
    return checkDetailsSchema.parse(issues.join('; '));
  }

  if (checkName === 'No Orphan Flow Nodes') {
    const issues = quest.flows.flatMap((flow) => {
      const connectedIds = new Set(flow.edges.flatMap((e) => [String(e.from), String(e.to)]));
      const orphans = flow.nodes
        .filter((n) => !connectedIds.has(String(n.id)))
        .map((n) => `"${String(n.id)}"`);
      if (orphans.length > 0) {
        return [`flow "${String(flow.name)}" has disconnected nodes: ${orphans.join(', ')}`];
      }
      return [];
    });
    return checkDetailsSchema.parse(issues.join('; '));
  }

  if (checkName === 'Node Observable Coverage') {
    const issues = quest.flows.flatMap((flow) => {
      const uncovered = flow.nodes
        .filter((n) => n.type === 'terminal' && n.observables.length === 0)
        .map((n) => `"${String(n.id)}"`);
      if (uncovered.length > 0) {
        return [
          `flow "${String(flow.name)}" terminal nodes without observables: ${uncovered.join(', ')}`,
        ];
      }
      return [];
    });
    return checkDetailsSchema.parse(issues.join('; '));
  }

  return checkDetailsSchema.parse(`Check "${String(checkName)}" failed`);
};
