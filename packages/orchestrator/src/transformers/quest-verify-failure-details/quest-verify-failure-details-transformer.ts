/**
 * PURPOSE: Computes specific failure details for quest verification checks, identifying exactly which items failed
 *
 * USAGE:
 * questVerifyFailureDetailsTransformer({quest, checkName: parsedCheckName});
 * // Returns branded CheckDetails string with specific step names, file paths, and IDs that caused the failure
 */
import type { QuestStub } from '@dungeonmaster/shared/contracts';
import { folderConfigStatics } from '@dungeonmaster/shared/statics';

import type { VerifyQuestCheck } from '../../contracts/verify-quest-check/verify-quest-check-contract';
import { verifyQuestCheckContract } from '../../contracts/verify-quest-check/verify-quest-check-contract';
import { isEntryFileGuard } from '../../guards/is-entry-file/is-entry-file-guard';
import { focusFileToTestPathTransformer } from '../focus-file-to-test-path/focus-file-to-test-path-transformer';
import { pathToFolderTypeTransformer } from '../path-to-folder-type/path-to-folder-type-transformer';

type Quest = ReturnType<typeof QuestStub>;

const checkDetailsSchema = verifyQuestCheckContract.shape.details;

const rawPrimitiveBlocklist = new Set(['string', 'number', 'any', 'object', 'unknown']);

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

  if (checkName === 'File Companion Completeness') {
    const issues: VerifyQuestCheck['details'][] = [];

    for (const step of quest.steps) {
      const focusPath = step.focusFile.path;
      const folderType = pathToFolderTypeTransformer({
        filePath: step.focusFile.path,
        folderConfigs: folderConfigStatics,
      });

      if (!folderType) {
        continue;
      }

      const config = folderConfigStatics[folderType as keyof typeof folderConfigStatics];
      const accompanyingPaths = new Set(step.accompanyingFiles.map((f) => String(f.path)));
      const requiredPaths: typeof accompanyingPaths = new Set();

      const expectedTestPath = focusFileToTestPathTransformer({
        focusPath: step.focusFile.path,
        testType: config.testType,
      });
      if (expectedTestPath) {
        requiredPaths.add(String(expectedTestPath));
        if (!accompanyingPaths.has(String(expectedTestPath))) {
          issues.push(
            checkDetailsSchema.parse(
              `step "${String(step.name)}" focusFile "${focusPath}" needs "${String(expectedTestPath)}"`,
            ),
          );
        }
      }

      if (config.requireProxy) {
        const base = focusPath.replace(/\.tsx?$/u, '');
        const ext = focusPath.endsWith('.tsx') ? '.tsx' : '.ts';
        const proxyFile = `${base}.proxy${ext}`;
        requiredPaths.add(proxyFile);
        if (!accompanyingPaths.has(proxyFile)) {
          issues.push(
            checkDetailsSchema.parse(
              `step "${String(step.name)}" focusFile "${focusPath}" needs "${proxyFile}"`,
            ),
          );
        }
      }

      if (config.requireStub) {
        const dir = focusPath.slice(0, focusPath.lastIndexOf('/'));
        const fileName = focusPath.slice(focusPath.lastIndexOf('/') + 1);
        const contractBase = fileName.replace(/-contract\.ts$/u, '');
        const stubFile = `${dir}/${contractBase}.stub.ts`;
        requiredPaths.add(stubFile);
        if (!accompanyingPaths.has(stubFile)) {
          issues.push(
            checkDetailsSchema.parse(
              `step "${String(step.name)}" focusFile "${focusPath}" needs "${stubFile}"`,
            ),
          );
        }
      }

      for (const accompanying of accompanyingPaths) {
        if (!requiredPaths.has(accompanying)) {
          issues.push(
            checkDetailsSchema.parse(
              `step "${String(step.name)}" focusFile "${focusPath}" has unexpected accompanyingFile "${accompanying}"`,
            ),
          );
        }
      }
    }

    return checkDetailsSchema.parse(
      issues.length > 0
        ? `Companion file issues: ${issues.map(String).join('; ')}`
        : 'Missing companion files',
    );
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
        const folderType = pathToFolderTypeTransformer({
          filePath: step.focusFile.path,
          folderConfigs: folderConfigStatics,
        });
        if (!folderType) {
          return false;
        }
        const needsContracts =
          folderConfigStatics[folderType as keyof typeof folderConfigStatics]
            .requireContractDeclarations;
        const isVoidOnly =
          step.outputContracts.length === 1 && String(step.outputContracts[0]) === 'Void';
        return needsContracts && isVoidOnly;
      })
      .map((step) => {
        const folderType = pathToFolderTypeTransformer({
          filePath: step.focusFile.path,
          folderConfigs: folderConfigStatics,
        });
        return `step "${String(step.name)}" in folder [${String(folderType)}] has outputContracts ["Void"] but folder requires real contract declarations`;
      });
    return checkDetailsSchema.parse(issues.join('; '));
  }

  if (checkName === 'Valid Contract References') {
    const contractNames = new Set(quest.contracts.map((c) => String(c.name)));
    const issues = quest.steps.flatMap((step) => [
      ...step.inputContracts
        .filter((n) => String(n) !== 'Void' && !contractNames.has(String(n)))
        .map(
          (n) =>
            `step "${String(step.name)}" inputContracts references non-existent: "${String(n)}"`,
        ),
      ...step.outputContracts
        .filter((n) => String(n) !== 'Void' && !contractNames.has(String(n)))
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
        const hasEntryFile = isEntryFileGuard({
          filePath: step.focusFile.path,
          folderConfigs: folderConfigStatics,
        });
        return hasEntryFile && (!step.exportName || step.exportName.trim() === '');
      })
      .map(
        (step) =>
          `step "${String(step.name)}" creates entry file "${String(step.focusFile.path)}" but has no exportName`,
      );
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

  if (checkName === 'No Duplicate Focus Files') {
    const pathMap = new Map<VerifyQuestCheck['details'], VerifyQuestCheck['details'][]>();
    for (const step of quest.steps) {
      const path = checkDetailsSchema.parse(String(step.focusFile.path));
      const existing = pathMap.get(path) ?? [];
      existing.push(checkDetailsSchema.parse(String(step.name)));
      pathMap.set(path, existing);
    }
    const issues = [...pathMap.entries()]
      .filter(([, names]) => names.length > 1)
      .map(
        ([path, names]) =>
          `steps ${names.map((n) => `"${String(n)}"`).join(' and ')} share focusFile "${String(path)}"`,
      );
    return checkDetailsSchema.parse(issues.join('; '));
  }

  if (checkName === 'Valid Focus Files') {
    const issues: VerifyQuestCheck['details'][] = [];
    for (const step of quest.steps) {
      const folderType = pathToFolderTypeTransformer({
        filePath: step.focusFile.path,
        folderConfigs: folderConfigStatics,
      });
      if (!folderType) {
        issues.push(
          checkDetailsSchema.parse(
            `step "${String(step.name)}" focusFile "${String(step.focusFile.path)}" does not match any known folder type`,
          ),
        );
      }
    }
    return checkDetailsSchema.parse(issues.map(String).join('; '));
  }

  return checkDetailsSchema.parse(`Check "${String(checkName)}" failed`);
};
