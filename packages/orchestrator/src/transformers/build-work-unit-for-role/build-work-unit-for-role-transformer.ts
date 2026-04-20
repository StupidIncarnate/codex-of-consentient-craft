/**
 * PURPOSE: Builds a WorkUnit for the given role from role-specific inputs via a discriminated union
 *
 * USAGE:
 * const workUnit = buildWorkUnitForRoleTransformer({ role: 'codeweaver', steps, quest });
 * // Returns CodeweaverWorkUnit with batched steps, folder types, aggregated quest context
 */

import type {
  ContractName,
  DependencyStep,
  DesignDecision,
  DesignDecisionId,
  Flow,
  FlowId,
  FlowObservable,
  FolderType,
  ObservableId,
  Quest,
  QuestContractEntry,
  StepFileReference,
} from '@dungeonmaster/shared/contracts';
import { folderConfigStatics } from '@dungeonmaster/shared/statics';

import type { DevServerUrl } from '../../contracts/dev-server-url/dev-server-url-contract';
import type { WorkUnit } from '../../contracts/work-unit/work-unit-contract';
import { workUnitContract } from '../../contracts/work-unit/work-unit-contract';
import { pathToFolderTypeTransformer } from '../path-to-folder-type/path-to-folder-type-transformer';
import { stepToFilePathsTransformer } from '../step-to-file-paths/step-to-file-paths-transformer';
import { stepToQuestContextTransformer } from '../step-to-quest-context/step-to-quest-context-transformer';

type StepFilePath = StepFileReference['path'];

type BuildWorkUnitForRoleInput =
  | { role: 'codeweaver'; steps: DependencyStep[]; quest: Quest }
  | { role: 'siegemaster'; flow: Flow; quest: Quest; devServerUrl?: DevServerUrl }
  | { role: 'lawbringer'; steps: DependencyStep[] }
  | { role: 'spiritmender'; step: DependencyStep }
  | { role: 'blightwarden'; quest: Quest };

export const buildWorkUnitForRoleTransformer = ({
  ...params
}: BuildWorkUnitForRoleInput): WorkUnit => {
  switch (params.role) {
    case 'codeweaver': {
      const { steps, quest } = params;

      const contractsSeen = new Set<ContractName>();
      const observablesSeen = new Set<ObservableId>();
      const decisionsSeen = new Set<DesignDecisionId>();
      const flowsSeen = new Set<FlowId>();
      const folderTypesSeen = new Set<FolderType>();

      const relatedContracts: QuestContractEntry[] = [];
      const relatedObservables: FlowObservable[] = [];
      const relatedDesignDecisions: DesignDecision[] = [];
      const relatedFlows: Flow[] = [];
      const folderTypes: FolderType[] = [];

      for (const step of steps) {
        const ctx = stepToQuestContextTransformer({ step, quest });
        for (const contract of ctx.relatedContracts) {
          if (!contractsSeen.has(contract.name)) {
            contractsSeen.add(contract.name);
            relatedContracts.push(contract);
          }
        }
        for (const observable of ctx.relatedObservables) {
          if (!observablesSeen.has(observable.id)) {
            observablesSeen.add(observable.id);
            relatedObservables.push(observable);
          }
        }
        for (const decision of ctx.relatedDesignDecisions) {
          if (!decisionsSeen.has(decision.id)) {
            decisionsSeen.add(decision.id);
            relatedDesignDecisions.push(decision);
          }
        }
        for (const flow of ctx.relatedFlows) {
          if (!flowsSeen.has(flow.id)) {
            flowsSeen.add(flow.id);
            relatedFlows.push(flow);
          }
        }
        const filePath = step.focusFile?.path;
        const folderType =
          filePath === undefined
            ? undefined
            : pathToFolderTypeTransformer({ filePath, folderConfigs: folderConfigStatics });
        if (folderType !== undefined && !folderTypesSeen.has(folderType)) {
          folderTypesSeen.add(folderType);
          folderTypes.push(folderType);
        }
      }

      return workUnitContract.parse({
        role: 'codeweaver',
        steps,
        folderTypes,
        questId: quest.id,
        relatedContracts,
        relatedObservables,
        relatedDesignDecisions,
        relatedFlows,
      });
    }

    case 'siegemaster': {
      const { flow, quest, devServerUrl } = params;

      return workUnitContract.parse({
        role: 'siegemaster',
        questId: quest.id,
        flow,
        relatedDesignDecisions: quest.designDecisions,
        ...(devServerUrl === undefined ? {} : { devServerUrl }),
      });
    }

    case 'lawbringer': {
      const { steps } = params;
      const stepBoundaries: {
        stepId: DependencyStep['id'];
        filePaths: StepFilePath[];
      }[] = [];
      const seenFilePaths = new Set<StepFilePath>();
      const aggregateFilePaths: StepFilePath[] = [];
      const folderTypesSeen = new Set<FolderType>();
      const folderTypes: FolderType[] = [];

      for (const step of steps) {
        const filePaths = stepToFilePathsTransformer({ step });
        stepBoundaries.push({ stepId: step.id, filePaths });
        for (const fp of filePaths) {
          if (!seenFilePaths.has(fp)) {
            seenFilePaths.add(fp);
            aggregateFilePaths.push(fp);
          }
        }
        const focusFilePath = step.focusFile?.path;
        const folderType =
          focusFilePath === undefined
            ? undefined
            : pathToFolderTypeTransformer({
                filePath: focusFilePath,
                folderConfigs: folderConfigStatics,
              });
        if (folderType !== undefined && !folderTypesSeen.has(folderType)) {
          folderTypesSeen.add(folderType);
          folderTypes.push(folderType);
        }
      }

      return workUnitContract.parse({
        role: 'lawbringer',
        filePaths: aggregateFilePaths,
        folderTypes,
        stepBoundaries,
      });
    }

    case 'spiritmender': {
      const { step } = params;
      const filePaths = stepToFilePathsTransformer({ step });

      return workUnitContract.parse({
        role: 'spiritmender',
        filePaths,
      });
    }

    case 'blightwarden': {
      throw new Error(
        'Unknown role in input: blightwarden work units are built inline by run-blightwarden-layer-broker, not via buildWorkUnitForRoleTransformer',
      );
    }

    default: {
      const exhaustiveCheck: never = params;
      throw new Error(`Unknown role in input: ${JSON.stringify(exhaustiveCheck)}`);
    }
  }
};
