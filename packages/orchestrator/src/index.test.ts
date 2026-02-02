describe('orchestrator', () => {
  it('exports module', async () => {
    const orchestrator = await import('./index');

    expect(Object.keys(orchestrator).sort()).toStrictEqual([
      'StartOrchestrator',
      'agentRoleContract',
      'agentSlotContract',
      'chaoswhispererPromptStatics',
      'codeweaverPromptStatics',
      'isoTimestampContract',
      'lawbringerPromptStatics',
      'pathseekerPromptStatics',
      'questListBroker',
      'questLoadBroker',
      'questUpdateStepBroker',
      'sessionIdExtractorTransformer',
      'siegemasterPromptStatics',
      'signalFromStreamTransformer',
      'slotCountContract',
      'slotDataContract',
      'slotIndexContract',
      'slotManagerResultContract',
      'slotOperationsContract',
      'spiritmenderPromptStatics',
      'streamJsonLineContract',
      'streamJsonToTextTransformer',
      'streamJsonToToolUseTransformer',
      'streamSignalContract',
      'timeoutMsContract',
      'toolDisplayConfigStatics',
      'toolInputToDisplayTransformer',
    ]);
  });
});
