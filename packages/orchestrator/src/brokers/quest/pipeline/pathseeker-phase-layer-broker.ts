/**
 * PURPOSE: Runs the pathseeker phase — spawns PathSeeker agent, monitors stdout, and waits for completion
 *
 * USAGE:
 * await pathseekerPhaseLayerBroker({processId, questId, onPhaseChange});
 * // Spawns PathSeeker agent to create step plan, streams output, waits for process exit
 */

import type { FilePath, ProcessId, QuestId } from '@dungeonmaster/shared/contracts';

import { childProcessSpawnStreamJsonAdapter } from '../../../adapters/child-process/spawn-stream-json/child-process-spawn-stream-json-adapter';
import { readlineCreateInterfaceAdapter } from '../../../adapters/readline/create-interface/readline-create-interface-adapter';
import type { OrchestrationPhase } from '../../../contracts/orchestration-phase/orchestration-phase-contract';
import { promptTextContract } from '../../../contracts/prompt-text/prompt-text-contract';
import type { SlotIndex } from '../../../contracts/slot-index/slot-index-contract';
import { pathseekerPromptStatics } from '../../../statics/pathseeker-prompt/pathseeker-prompt-statics';

export const pathseekerPhaseLayerBroker = async ({
  processId: _processId,
  questId,
  startPath,
  onPhaseChange,
  onAgentLine,
}: {
  processId: ProcessId;
  questId: QuestId;
  startPath: FilePath;
  onPhaseChange: (params: { phase: OrchestrationPhase }) => void;
  onAgentLine?: (params: { slotIndex: SlotIndex; line: string }) => void;
}): Promise<void> => {
  onPhaseChange({ phase: 'pathseeker' });

  const promptText = pathseekerPromptStatics.prompt.template.replace(
    pathseekerPromptStatics.prompt.placeholders.arguments,
    `Quest ID: ${questId}`,
  );

  const prompt = promptTextContract.parse(promptText);
  const { process: childProcess, stdout } = childProcessSpawnStreamJsonAdapter({
    prompt,
    cwd: startPath,
  });

  const slotIndex = 0 as SlotIndex;
  const rl = readlineCreateInterfaceAdapter({ input: stdout });

  rl.onLine(({ line }) => {
    onAgentLine?.({ slotIndex, line });
  });

  await new Promise<void>((resolve, reject) => {
    childProcess.on('exit', () => {
      rl.close();
      resolve();
    });
    childProcess.on('error', (error: Error) => {
      rl.close();
      reject(error);
    });
  });
};
