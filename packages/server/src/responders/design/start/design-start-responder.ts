/**
 * PURPOSE: Handles design sandbox start requests by scaffolding Vite project and spawning dev server
 *
 * USAGE:
 * const result = await DesignStartResponder({ params: { questId: 'abc' }, body: { guildId: 'xyz' } });
 * // Returns { status: 200, data: { port } } or { status: 400/500, data: { error } }
 */

import {
  absoluteFilePathContract,
  guildIdContract,
  questIdContract,
} from '@dungeonmaster/shared/contracts';

import { orchestratorGetGuildAdapter } from '../../../adapters/orchestrator/get-guild/orchestrator-get-guild-adapter';
import { orchestratorGetQuestAdapter } from '../../../adapters/orchestrator/get-quest/orchestrator-get-quest-adapter';
import { orchestratorModifyQuestAdapter } from '../../../adapters/orchestrator/modify-quest/orchestrator-modify-quest-adapter';
import { designScaffoldBroker } from '../../../brokers/design/scaffold/design-scaffold-broker';
import { designStartBroker } from '../../../brokers/design/start/design-start-broker';
import { responderResultContract } from '../../../contracts/responder-result/responder-result-contract';
import type { ResponderResult } from '../../../contracts/responder-result/responder-result-contract';
import { designProcessState } from '../../../state/design-process/design-process-state';
import { httpStatusStatics } from '../../../statics/http-status/http-status-statics';
import { questFolderToDesignPortTransformer } from '../../../transformers/quest-folder-to-design-port/quest-folder-to-design-port-transformer';

export const DesignStartResponder = async ({
  params,
  body,
}: {
  params: unknown;
  body: unknown;
}): Promise<ResponderResult> => {
  try {
    if (typeof params !== 'object' || params === null) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: { error: 'Invalid params' },
      });
    }

    const questIdRaw: unknown = Reflect.get(params, 'questId');
    if (typeof questIdRaw !== 'string') {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: { error: 'questId is required' },
      });
    }

    if (typeof body !== 'object' || body === null) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: { error: 'Request body must be a JSON object' },
      });
    }

    const rawGuildId: unknown = Reflect.get(body, 'guildId');
    if (typeof rawGuildId !== 'string') {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: { error: 'guildId is required' },
      });
    }

    const questId = questIdContract.parse(questIdRaw);
    const guildId = guildIdContract.parse(rawGuildId);

    const questResult = await orchestratorGetQuestAdapter({ questId: questIdRaw });
    if (!questResult.success || !questResult.quest) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: { error: 'Quest not found' },
      });
    }

    const { quest } = questResult;
    if (quest.status !== 'approved' || !quest.needsDesign) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: { error: 'Quest must be approved with needsDesign=true to start design' },
      });
    }

    const guild = await orchestratorGetGuildAdapter({ guildId });
    const guildPath = absoluteFilePathContract.parse(guild.path);
    const port = questFolderToDesignPortTransformer({ questFolder: quest.folder });

    const { designPath } = await designScaffoldBroker({
      guildPath,
      questFolder: quest.folder,
      port,
    });

    const { kill } = await designStartBroker({ designPath, port });

    designProcessState.register({ questId, port, kill });

    await orchestratorModifyQuestAdapter({
      questId: questIdRaw,
      input: { status: 'explore_design', designPort: port } as never,
    });

    return responderResultContract.parse({
      status: httpStatusStatics.success.ok,
      data: { port },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to start design sandbox';
    return responderResultContract.parse({
      status: httpStatusStatics.serverError.internal,
      data: { error: message },
    });
  }
};
