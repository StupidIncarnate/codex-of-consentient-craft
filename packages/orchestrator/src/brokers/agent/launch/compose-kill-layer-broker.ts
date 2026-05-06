/**
 * PURPOSE: Layer of agentLaunchBroker — assembles the universal teardown function the launcher hands to `registerProcess`, the abort-signal listener, and the return value. Stops the spawned CLI process, the chat-line stream handle, and (if started) the post-exit main-session tail in a single call. The tail stop lives in a `Map<'stop', () => void>` so the launcher can populate it lazily after CLI exit; the kill consumes whatever's set when it fires. The `killedStateSet` flips to `'killed'` so a late-arriving tail-startup `.then` callback (triggered AFTER kill but BEFORE tailStopMap was populated) can self-stop instead of leaking. Idempotent — repeated invocations are no-ops because each stop primitive is itself idempotent and the maps empty on first call.
 *
 * USAGE:
 * const tailStopMap = new Map<'stop', () => void>();
 * const killedStateSet = new Set<'killed'>();
 * const kill = composeKillLayerBroker({ spawnKill, handleStop, tailStopMap, killedStateSet });
 * registerProcess({ processId, questId, questWorkItemId, kill });
 */

export const composeKillLayerBroker =
  ({
    spawnKill,
    handleStop,
    tailStopMap,
    killedStateSet,
  }: {
    spawnKill: () => void;
    handleStop: () => void;
    tailStopMap: Map<'stop', () => void>;
    killedStateSet: Set<'killed'>;
  }): (() => void) =>
  (): void => {
    killedStateSet.add('killed');
    spawnKill();
    handleStop();
    const tailStop = tailStopMap.get('stop');
    if (tailStop !== undefined) {
      tailStop();
      tailStopMap.clear();
    }
  };
