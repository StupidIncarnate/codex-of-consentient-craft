/**
 * PURPOSE: Defines the data `architectureBindingFlowTraceBroker` returns
 *
 * USAGE:
 * architectureBindingFlowTraceResultContract.parse(value);
 * // Returns validated ArchitectureBindingFlowTraceResult
 */
import { z } from '#gateway/npm/zod';

export const architectureBindingFlowTraceResultContract = z
  .object({
    httpFlows: z.array(
      z
        .object({
          method: z.string().brand<'ArchitectureBindingFlowTraceResultHttpFlowsMethod'>(),
          urlPattern: z.string().brand<'ArchitectureBindingFlowTraceResultHttpFlowsUrlPattern'>(),
          serverRef: z
            .string()
            .brand<'ArchitectureBindingFlowTraceResultHttpFlowsServerRef'>()
            .nullable(),
          orchestratorMethod: z
            .string()
            .brand<'ArchitectureBindingFlowTraceResultHttpFlowsOrchestratorMethod'>()
            .nullable(),
        })
        .brand<'ArchitectureBindingFlowTraceResultHttpFlows'>(),
    ),
    wsEvents: z.array(
      z
        .object({
          eventType: z.string().brand<'ArchitectureBindingFlowTraceResultWsEventsEventType'>(),
          emitterRef: z
            .string()
            .brand<'ArchitectureBindingFlowTraceResultWsEventsEmitterRef'>()
            .nullable(),
        })
        .brand<'ArchitectureBindingFlowTraceResultWsEvents'>(),
    ),
  })
  .brand<'ArchitectureBindingFlowTraceResult'>();

export type ArchitectureBindingFlowTraceResult = z.infer<
  typeof architectureBindingFlowTraceResultContract
>;
