import { projectMapHeadlineHttpBackendStatics } from './project-map-headline-http-backend-statics';

describe('projectMapHeadlineHttpBackendStatics', () => {
  it('VALID: statics => match expected shape', () => {
    expect(projectMapHeadlineHttpBackendStatics).toStrictEqual({
      methodPadWidth: 6,
      exemplarPostUrl: '/api/quests/:questId/start',
      exemplarMethod: 'POST',
      minUrlSegmentsForNonTrivial: 2,
      boundaryBoxInnerWidth: 56,
      boundaryBoxPad: 2,
      routesSectionHeader: '## Routes — every server endpoint',
      routesSectionDescription:
        'Exhaustive: every HTTP route the server registers is listed below. Each section header names the flow file where the routes are registered via `app.<method>(...)`.',
      routesSectionEmpty: '(no routes found in this package)',
      exemplarSectionPrefix: '## Detailed exemplar — `',
      exemplarSectionSuffix: '`',
      exemplarDescription:
        'The route-table entry above shows the call shape. This section traces the same route end-to-end including caller, wire, response, and BOUNDARY effects.',
      exemplarRequestChainHeader: '### Request chain',
      exemplarResponseLine: '       ◄─── HTTP response  body: {processId} | {error}',
      startQuestBoundaryBox: [
        '      ╔═══════ BOUNDARY → @dungeonmaster/orchestrator ═══════╗',
        '      ║                                                      ║',
        '      ║  StartOrchestrator.getQuest                          ║',
        '      ║    reads (file):    quest.json                       ║',
        '      ║                                                      ║',
        '      ║  StartOrchestrator.startQuest                        ║',
        '      ║    writes (state):  orchestrationProcessesState      ║',
        '      ║                     questExecutionQueueState         ║',
        '      ║    writes (file):   quest.json                       ║',
        '      ║                     event-outbox.jsonl               ║',
        '      ║    spawns:          claude CLI ─┐                    ║',
        '      ║                                  │ stream-json       ║',
        '      ║                                  │ parsed by         ║',
        "      ║                                  │ orchestrator's    ║",
        '      ║                                  │ spawn adapter     ║',
        '      ║                                  ▼                   ║',
        '      ║                          orchestrationEventsState    ║',
        "      ║                          .emit({type: 'chat-output'})║",
        '      ║                                  │                   ║',
        '      ║                                  └─► (Side-channel)  ║',
        '      ║                                                      ║',
        '      ╚══════════════════════════════════════════════════════╝',
      ],
      orchestratorAdapterPathFragment: 'adapters/orchestrator',
      orchestratorPackageName: '@dungeonmaster/orchestrator',
      genericBoundaryBoxLabel: 'BOUNDARY →',
      genericBoundaryBoxNote: '(cross-package adapter call)',
      genericBoundaryBoxFill: '═',
      genericBoundaryBoxCornerTL: '╔',
      genericBoundaryBoxCornerTR: '╗',
      genericBoundaryBoxCornerBL: '╚',
      genericBoundaryBoxCornerBR: '╝',
      genericBoundaryBoxSide: '║',
      genericBoundaryBoxIndent: '      ',
    });
  });
});
