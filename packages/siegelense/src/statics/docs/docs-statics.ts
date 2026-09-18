/**
 * PURPOSE: The prose `dungeonmaster siegelense docs` serves — the `about` preamble every answer
 * carries, and one document per `siegelenseCallStatics.docs.scopes` entry, each written for one
 * tool-using role. Reach for this over `siegelenseHelpStatics` when you want the RULE a role works
 * by; `--help` is the flag reference (flags, refusals, one example) and answers a different
 * question. Two rules bind every line here. A line naming a capability the tool does not have today
 * ends with `markers.notBuilt` and, where one exists, the callable thing that does the same job —
 * so no passage reads as though everything works, and no reader has to infer which half is real.
 * And `scopes.operating` names no step verb at all, built or unbuilt: the operator never submits a
 * batch, so the driving vocabulary is the one thing its own rules forbid it.
 *
 * USAGE:
 * docsStatics.scopes.walking.sections;
 * // Returns the walker's sections, the ladder among them
 *
 * docsStatics.markers.notBuilt;
 * // Returns 'NOT BUILT YET' — the token every unavailable capability's line carries
 */

const NOT_BUILT = 'NOT BUILT YET';

export const docsStatics = {
  markers: {
    notBuilt: NOT_BUILT,
  },
  about: [
    'siegelense stands up one instance of an app, drives it, and hands back READINGS. Every call is: dungeonmaster siegelense <call>. Steps are values inside a run batch, never calls of their own.',
    'A command returns a READING, never a verdict on whether a unit passes. Comparing two measured values is a reading; deciding a unit passed is not.',
    `A line ending ${NOT_BUILT} names a capability this tool's design has and its code does not. Do not call it. Where something callable does the same job today, the line says what it is. A line with no such marker is callable now.`,
    "Use --for to narrow this to one role's page, because the whole surface is not every reader's business. Omit it and you get all seven.",
    'The seven scopes are one per tool-using role. A code-reading role gets no scope, and that absence is deliberate: a session that opens source files and calls nothing here needs no page of these instructions, and handing it one would hand a code reader the vocabulary for driving a browser.',
    'This is served by a call rather than pasted into a prompt for three reasons. Any session can fetch it, so "go drive the app with the siege tool" becomes a usable instruction to a session nobody orchestrated. There is one source to edit rather than one copy per role prompt. And a prompt has a hard ceiling: a served prompt over 50,000 characters is spilled to a file with an error stub handed back, and a full tool manual inside one spends that budget on something a call serves for free.',
    'dungeonmaster siegelense <call> --help is a different document: flags, refusals and one example per call. This is the role-scoped manual. Reach for --help when you need the flag; reach for this when you need the rule.',
  ],
  scopes: {
    operating: {
      audience:
        'the operator — the session that opens and closes a pool of instances and dispatches minions into them.',
      summary:
        'Fleet management, at both ends of a pass. You never drive a page, so this scope carries none of that vocabulary: no batch is yours to submit, and handing you the driving verbs would be handing you the one thing your own rules forbid.',
      sections: [
        {
          heading: 'PRIOR TO OPENING A POOL',
          lines: [
            'dungeonmaster siegelense capacity — what this machine can take right now. Ask prior to opening a pool.',
            'It answers a suggested pool size, a hard ceiling, a why sentence naming every figure it reasoned from, the measurements behind both, and the profile group it divided by.',
            'suggested comes from a MEASURED profile of what one instance of this spec costs, never a number somebody wrote down. With no profile yet it answers 2, and that pair profiles itself.',
            'It counts instances this session did not start. It is advisory, with one hard floor: start refuses outright when the machine plainly cannot hold another.',
            'dungeonmaster siegelense profile --spec <specName> is the measurement capacity reads. Samples are grouped by pool size and never averaged across them — a solo reading and a contended one describe different worlds, so read the group matching the pool you are about to open.',
          ],
        },
        {
          heading: 'CLEANUP, AT BOTH ENDS OF THE PASS',
          lines: [
            'dungeonmaster siegelense cleanup — run it at the START of your pass and again at the END.',
            'It acts on STALENESS only. It never reaps a live instance, so it is safe at any moment, mid-pass included.',
            'It reaps stale instances, releases their ports, releases the registry lock, and ages assets out on their own windows — video first on a shorter one. It refuses exactly what prune refuses, so evidence a VERIFIED prelude or an open quest WALKED note still cites is never taken.',
            'leftAlone is part of the answer: a cleanup reporting only what it removed cannot be told from one that removed the wrong thing.',
            'Add --human for the reading table. The default is one JSON document.',
          ],
        },
        {
          heading: 'PRUNE ACTS ON ASSETS; CLEANUP ACTS ON INSTANCES',
          lines: [
            'dungeonmaster siegelense prune — reclaim asset space deliberately rather than waiting for the age-out window, by --older-than, by --instance or by --kind. It refuses rather than warns, and a refusal names the citing path so you can open it.',
            `One of the three citation kinds, an open issue record, is NOT CHECKED, because nothing in this repo stores an issue record naming an instance or a run. Every answer names it under unresolved, so an empty refused list never reads as "nothing cites any of this". ${NOT_BUILT}.`,
            'It refuses rather than warns. Anything a VERIFIED prelude, an open issue record or an open quest WALKED line still points at stays, and the refusal NAMES THE CITING PATH — a path and a run id is something you can open, where "referenced by a prelude" is only a claim.',
            'A prune that quietly took the evidence a fixer was about to read is the failure the whole retention rule exists to prevent.',
            'An instance started with no quest has nothing citing it and no protection. That is the unowned case working as intended rather than falling through.',
            'Distinct from cleanup, which acts on STALE INSTANCES and ages assets as a side effect. prune acts on ASSETS and touches no instance.',
          ],
        },
        {
          heading: 'STATUS — THE POST-MORTEM',
          lines: [
            'dungeonmaster siegelense status — the machine, every instance alive or dead, and the names of the metrics being monitored, so you do not guess at them.',
            "A bare status never lists an instance's runs and never lists its evidence. Those appear only when you name an id you already hold. That is the no-browsing rule: fleet state is what you need to decide whether to reap or to dispatch, and a list of runs is what a session reads instead of reading its own record.",
            'dungeonmaster siegelense status --instance <id> gives one instance in full: last heartbeat, the last step it ran, its RSS at that moment, its surviving orphan process groups, the paths to what it left behind, and a likelyCause stated as evidence rather than as a verdict.',
            'A reaped entry survives as a TOMBSTONE for as long as its evidence does. Otherwise a cleanup — which any session may run, at any moment — would make a fixer\'s first call answer "unknown instance" for a walk whose captures are sitting on disk.',
            'Add --human for the fleet table.',
          ],
        },
        {
          heading: 'READING WHAT A MINION BRINGS BACK',
          lines: [
            'A dead instance is rework, never wall. wall means the environment blocks every session of every role, and it halts the quest. A tool crash is not that: fewer instances, or a fresh one, very likely succeeds.',
            'A minion reporting a crash hands you the instance id and the status output, and nothing else is its to do. It must not start a replacement, must not reap orphans it found, and must not re-submit the batch.',
            'The return that corrupts the record is a crash written up as a defect in the app. Read for that one specifically.',
            'An instance that died of memory pressure will die again. A minion that quietly replaced its own now has two dead while believing it is progressing.',
            'Only you can see the pool. A minion knows about its own instance; you know three are up, you know what the machine now says, and you are the only session that can decide to drop to two or to stop the phase. A minion healing itself is a session acting on a third of the picture.',
          ],
        },
        {
          heading: 'REAPING RULES',
          lines: [
            'Every instance is three processes, a port pair, two open handles, a throwaway home and a growing pile of state captures. Nothing about a leak is visible to the session that leaked it: the walk completes, the record is written, the return reads clean, and three processes stay up.',
            'The common leak is a minion that never closed its instance — forgotten, or the turn simply ended. The idle timeout is the only backstop, and it is 900 seconds of three live processes.',
            'A session that dies mid-batch leaks the same way: the instance is not its child, so nothing reaps it.',
            'Closing an instance removes the throwaway home and never the evidence directory. Logs, captures and the transcript outlive the instance — they are what a fixer reads tomorrow.',
            "Ports not released prior to the next allocation put two instances on one port, which reads as a walk measuring another walk's state. cleanup releases them; nothing else will.",
          ],
        },
      ],
    },
    planning: {
      audience:
        'the planner — the session that writes the walk and proves the prelude reaching its entry state.',
      summary:
        'Recipes, preludes, profiles and capacity. You start and stop instances to prove preludes, so every failure a walker meets is a failure you meet.',
      sections: [
        {
          heading: 'WHAT A PRELUDE IS, AND WHAT PROVING ONE MEANS',
          lines: [
            "A prelude is the batch of steps that reaches a path's entry state. You prove one by running it against a real instance and watching it land where it claims.",
            'A proven prelude is marked VERIFIED, and that mark is the difference between reproducing a state and re-deriving one. A fixer re-runs a VERIFIED prelude verbatim; it guesses at anything else.',
            'Proving one costs an instance: dungeonmaster siegelense start, then run, then kill. You started it, so you close it.',
            'Because you hold instances, the bubble-up rule binds you exactly as it binds a walker. An instance that dies under you goes back to whoever dispatched you as rework, carrying the instance id and the status output. Do not start a replacement, do not reap orphans you find, do not retry the batch, and never write the crash up as a defect in the app.',
          ],
        },
        {
          heading: 'ASK CAPACITY BEFORE YOU OPEN ANYTHING',
          lines: [
            'dungeonmaster siegelense capacity — what this machine can take right now. Ask it before opening a pool, and pass --pool so it reads the sample group matching the pool you are about to open.',
            'You are not the only session on this machine. capacity counts instances this session did not start, and start refuses outright when the machine plainly cannot hold another.',
          ],
        },
        {
          heading: 'PROFILE — WHAT ONE INSTANCE OF A SPEC COSTS',
          lines: [
            "dungeonmaster siegelense profile --spec <specName> — processes, the spec's content hash, when it was measured, how many runs it was measured from, the boot time, and one sample group per pool size.",
            'It reads what was measured and never measures on demand. A spec nothing has run yet answers samples: [] and bootMs: null rather than booting an instance to find out.',
            'Samples are grouped by POOL SIZE and never averaged across them. A solo reading and a contended one describe different worlds: read the group matching the pool you are about to open.',
            "A profile is keyed by the spec's content hash, so a spec that grows a second server re-measures instead of being quietly wrong. A browserless spec prices itself the same way, and a pool can hold more of them.",
          ],
        },
        {
          heading: 'RECIPES — WHAT STATES CAN BE CREATED',
          lines: [
            'dungeonmaster siegelense recipes — every recipe with its produces: claim, its fidelity, and what it takes and returns. It starts nothing and holds no pool slot.',
            'An EMPTY list is a real answer and means there are no recipes yet. An absent recipes package is a refusal instead, so the two never read alike.',
            "The seed step RUNS one inside a batch and returns the ids it made: { step: 'seed', recipe: '<name>', as: 'g' }, and a later step reads them back as {g.guildSlug}. start --seed <name> does the same at boot and puts the ids on the manifest's seeded.",
            "A recipe takes its dependencies explicitly, as named parameters written on the step itself: { step: 'seed', recipe: 'session-with-nested-subagent', guild: '{g.guildId}', as: 's' }. Recipes compose — one recipe's returned ids are another's parameters.",
            "A recipe touches state, never a screen. A recipe holding a DOM handle is doing a walk's job.",
          ],
        },
        {
          heading: 'NAME WHAT THE PRELUDE CARRIES: TESTIDS, NEVER REFS',
          lines: [
            'A prelude that will be saved, re-run or handed on takes a target testId plus a within scope. A ref is minted by one reading against one page state and resolves only inside the instance that minted it.',
            'Four boundaries a ref cannot cross, and every one of them looks like it should work: a minion handing one to its parent, a parent handing one to a fixer, a walk handing one to its re-walk, and a happy phase handing one to the adversarial phase.',
            'The failure is quiet. A stored batch carrying ref 14 does not throw — ref 14 may legitimately exist and point at something else — so it drives the wrong thing and returns a clean-looking result.',
            'So a promoted baseline carries captures and selectors, never refs. Pixels compare across instances; a testId plus a within scope means the same thing in any of them.',
          ],
        },
        {
          heading: 'WHAT A PLAN CAN PROMISE TODAY',
          lines: [
            `Eighteen step verbs exist: goto, waitFor, click, type, screenshot, eval, look, box, seed, until, dom, key, health, resize, request, before, file and storage. Every other verb in the design is ${NOT_BUILT}.`,
            'look returns the key — every addressable element, its name, its text and a ref for each — so a prelude can discover a testId rather than only address one it was told about.',
            "seed runs a recipe against the instance and returns the ids it made, so a prelude CAN create its own starting state. dungeonmaster siegelense recipes lists every recipe with its produces: claim; name one in a { step: 'seed' } and read its ids back with {binding.field}.",
          ],
        },
      ],
    },
    walking: {
      audience:
        'the walker — the session driving a browser against one instance and recording what it reads.',
      summary:
        'The verbs, the reading rules and the ladder. Read the first section before you plan anything: look is how you discover what is on a screen.',
      sections: [
        {
          heading: 'READ THIS FIRST',
          lines: [
            'look returns the KEY: a tree of every addressable element on the page, one line each, with a ref you can drive. It answers both "what is on this screen" and "how do I address the second of two identical controls". Take one before you plan a click.',
            'Every row carries four columns beyond the ref and the indentation: the element (its testId, its TAG even when a testId exists, its role, a DOM id, and [n/m] where siblings share a name), the text or the input value and placeholder, the attrs it DECLARES, and the flags — the conditions it is in. Most rows carry no attrs and no flags, which is what keeps the key short.',
            'A flag is a finding you did not have to ask for: disabled, aria-disabled, focused, busy, invalid, live, aria-hidden, invisible-opacity-0, offscreen, scrollable, covered, clipped-x, cut-no-ellipsis, low-contrast, collapsed-ancestor, empty, not-tabbable, broken-image. Read them; a control flagged disabled is why your click did nothing.',
            'Under the key, two more lines fire unasked. A duplicate line names a testId appearing under two DIFFERENT parents, which is a real defect nothing warns about. A truncation line names what a scope or a depth limit left out, so the key never quietly stops.',
            'The key reads OWN text nodes, never textContent. A row showing no text means that element paints no words of its own — its children may well paint plenty.',
          ],
        },
        {
          heading: 'THE LADDER',
          lines: [
            'The rule: reach for the key first. dom is the hatch — last, and always with a narrow target.',
            'Rung 1, look — the default. What is here, what is it called, what is wrong with it. About 243 tokens for a whole page. Built.',
            'Rung 2, look { within } — the same reading scoped to one region, when the region is crowded or the page holds a long transcript. Cheaper. Built. `within` takes a bare testId or the full [data-testid="..."] form; both reach the same element.',
            "Rung 3, box { ref } — one element's geometry, exactly. A few lines. Built.",
            'Rung 4, dom { target } — the hatch. A named selector, and a question the key does not carry. Unbounded without care. Built.',
            'Rung 5, eval — a question no step shapes at all. It is a DIFFERENT hatch carrying a different risk: dom is expensive, while eval is cheap and can quietly break the founding rule by computing a verdict inside the page and handing it back as a value.',
          ],
        },
        {
          heading: 'THE HATCH, AND ITS GUARDS',
          lines: [
            'The hatch has to exist, because a shaped reading always leaves something out — an attribute nobody anticipated, a value the key truncated, the exact text a unit quotes word for word.',
            'It also has to be LAST, and that is measured: dom against "body *" returned 58 nodes whose first entry carried an entire stylesheet in its text field. That single reading is why the old verb was called unusable, and why the key reads own text nodes rather than textContent.',
            'When dom is the right call: an attribute the row does not carry, such as maxlength or pattern; the exact text where the key truncated it; a COUNT of matches where the number is the whole answer; or the raw shape of something surprising, when the reading and the picture disagree.',
            'Three guards arrive with it: own text nodes by default, with text: "full" the opt-in for textContent; a fields: projection, the same way a network query projects; and a match cap that SAYS it capped, with the true count beside it — count: 58, showing 10 is an answer, where ten silent rows is a trap.',
            'In eval source use querySelectorAll and count. Never querySelector: singular silently returns match one, and no lint rule can see inside the source string to catch it.',
          ],
        },
        {
          heading: 'THE READING RULES: NOTHING EVER SILENTLY PICKS A MATCH',
          lines: [
            'Every targeting step has exactly three outcomes. One match proceeds. More than one is an ERROR. Zero is an ERROR. Ambiguity is never resolved by taking the first.',
            'AMBIGUOUS carries its own disambiguation: every candidate, with the within scope that would narrow it. Recovery is one step rather than a hunt.',
            'NO MATCH names the near misses — the testIds nearest to what you asked for — because a misremembered testId is the common case.',
            'Two candidates can share a within, and then narrowing cannot separate them. Each candidate carries a ref for exactly that case: re-issue the step as { "step": "click", "ref": N }. The candidates also ride the structured answer, not only the message, so a batch return can be read rather than parsed out of prose.',
          ],
        },
        {
          heading: 'REFS ARE FOR DRIVING, SELECTORS ARE FOR RECORDING',
          lines: [
            'A testId plus a within scope is durable: use it for anything saved, re-run, briefed, or written into a record.',
            'A ref is not durable. It comes from one reading against one page state, on one instance, and it is for driving right now, in this session.',
            'A position or an nth index is neither durable nor sturdy. Last resort, and never saved.',
            "Never put a ref in: a saved batch, a re-walk, a guide, a brief to another session, a round record, a fixer's SYMPTOM block, a sign-off's evidence, a promoted baseline, or a recipe.",
            'A ref binds to an ELEMENT, not to a row number, and navigation, a reset and an instance restart all invalidate every one. A ref used after any of those answers stale — never a different element. A ref that was never minted on this instance answers unknown, which is what a ref carried in from somewhere else looks like.',
            'A click or a type takes exactly one handle: a target, or a ref. Both is refused, and neither is refused, because a step carrying two handles that disagree would make the tool pick — which is the no-pick rule broken one layer down.',
          ],
        },
        {
          heading: 'THE VERBS YOU CAN SUBMIT TODAY',
          lines: [
            'Ten, and every one is a value inside a batch, never a call of its own:',
            `{ step: 'goto', path: '/siege-1/session/sess-nested' }`,
            `{ step: 'look' }  or  { step: 'look', within: 'SUBAGENT_CHAIN' }`,
            `{ step: 'box', ref: 26 }`,
            `{ step: 'dom', target: '[data-testid="subagent-chain-duration"]', fields: ['text', 'rect'] }`,
            `{ step: 'waitFor', target: '[data-testid="SUBAGENT_CHAIN"]', state: 'visible' }`,
            `{ step: 'click', target: '[data-testid="EXECUTION_ROW_0"]' }  or  { step: 'click', ref: 26 }`,
            `{ step: 'type', target: '[data-testid="CHAT_INPUT"]', value: 'guild-alpha' }  or  { step: 'type', ref: 14, value: 'guild-alpha' }`,
            `{ step: 'key', press: 'Enter' }`,
            `{ step: 'screenshot', name: 'after-create.png' }`,
            `{ step: 'eval', source: 'document.querySelectorAll("[data-testid=QUEST_ROW]").length' }`,
            'A screenshot name must carry a file extension. Without one the capture fails on an unsupported mime type, naming neither the step nor the field.',
            'goto, click, type and key are the acting steps, and each captures a shot unasked. look captures too — the key is the text and the shot is the picture, and they answer different questions. Every capture carries a pixel-change figure and a blank verdict.',
            'All ten are browser steps, so all ten error BY NAME against a browserless spec rather than answering an empty reading.',
            `until waits on something OTHER than a locator state, in one of five forms: { step: 'until', visible: '[data-testid="SUBAGENT_CHAIN"]', timeoutMs: 20000 }, { step: 'until', predicate: 'document.querySelectorAll("[data-testid=QUEST_ROW]").length === 3' }, { step: 'until', console: 'hydrated' }, { step: 'until', response: { method: 'POST', path: '/api/quests' } }, or { step: 'until', file: 'guilds/<id>/quests/<id>/quest.json' }.`,
            "Exactly one of those five condition fields, never zero and never two. Four of them read the page or its buffers, so they need a browser like every other browser verb. file reads the lane's own throwaway home instead, so it runs here AND on a lane with no screen — reach for it when the thing you are waiting on is something the app WROTE rather than something it drew.",
            "console and response scan this RUN's own window. A match a step earlier in the same batch produced — a click's own POST — resolves; one from an earlier run does not, and the timeout says so rather than leaving you a bare ceiling.",
          ],
        },
        {
          heading: 'WHAT A BATCH RETURNS, AND WHERE THE PAYLOADS ARE',
          lines: [
            "run returns a STATUS — an index and a shot list — never the steps' own payloads. results returns the payloads. Collapsing the two walks back into the 50,000-character ceiling this whole service exists to route around.",
            "dungeonmaster siegelense results --instance <id> --run <runId> --step <n> with no --kind returns that step's own reading. The key at step 4 is not a file anybody keeps a path to; it is a query, and the run id plus the step number is what it takes.",
            'Six evidence kinds: console, network, ws, server, screenshots and steps. steps is the transcript — every step with its verb, its arguments and its reading, flushed as it ran.',
            'Every console, network, ws and server entry carries the step it fell inside, so "which step was running when the error fired" needs no second query.',
            'A click reporting zero network exchanges is a FINDING, in exactly the way +0 -0 moved 0 is: the control did nothing, measured rather than inferred.',
            'Narrow with --where-path, --where-method, --where-level and --where-steps, and project with --fields. A whole window read back unprojected is the cost the query surface exists to avoid.',
          ],
        },
        {
          heading: 'STOPON AND EXPECT',
          lines: [
            'A batch stops at its first failing step unless you pass --stop-on never.',
            'Under --stop-on never the run keeps going past the first failure, and stoppedAt then names where it WOULD have stopped, not where it did.',
            'A step that is supposed to fail declares expect: error. A step declaring it that SUCCEEDS returns ok: false and stops the batch — the app accepting what it should have refused is the finding.',
          ],
        },
        {
          heading: 'WHEN YOUR INSTANCE DIES UNDER YOU',
          lines: [
            'Report it to whoever dispatched you. Do not fix it.',
            'Do not start a replacement: an instance that died of memory pressure will die again, and now two are dead while you believe you are progressing.',
            'Do not reap orphans you find. You cannot tell whose they are — other walks are running and you can see only your own.',
            'Do not retry the batch. The same batch against the same pressure gets the same death, twice as slowly.',
            'Never report the crash as a defect in the app. That is the one that corrupts the record.',
            'A dead instance is rework, never wall. Hand back the instance id and the status output; only the operator can see the pool, and only the operator can decide what to do about it.',
          ],
        },
      ],
    },
    attacking: {
      audience:
        'the stress tester — the session running attacks against one instance and measuring what breaks.',
      summary:
        'health, the reset levels, expect: error, and baselines. Read the first section: none of the three levers that return an instance to a known starting point exist yet.',
      sections: [
        {
          heading: 'READ THIS FIRST',
          lines: [
            `reset and snapshot are both ${NOT_BUILT}. Nothing returns an instance to a known starting point. health is BUILT.`,
            "So an attack that changes state needs its own instance today: boot it, attack once, read the evidence, close it. A second attack against the same instance measures the first attack's leftovers.",
            'The rules below are still the rules. They describe how state behaves rather than how a step behaves, and they are true whether or not the step that acts on them exists.',
          ],
        },
        {
          heading: 'HEALTH — ONE READING, ONE VERDICT LINE',
          lines: [
            'health takes one reading in a fixed shape so two readings can be held against each other. It is your counterpart to the key.',
            'Its three answers: HEALTHY — root present, not blank, console clean, no 5xx, server log clean. DEGRADED — root present, console: 1 error. DOWN — root absent, page blank, server log: 3 errors since step 4.',
            "Blankness appears in health AND on every capture's blank field, deliberately: this is the asked-for reading, and that one fires unasked.",
            'Take the same reading by hand today, and every part of it is already callable: results --kind console for errors, --kind network for non-2xx, --kind server --where-steps a-b --where-level error for the server log, and the blank field on the capture the acting step already took.',
            'Server logs are the piece nothing else surfaces. console is browser-only, so a 500 caused by a server exception is invisible unless somebody opens a log file nobody mentioned.',
          ],
        },
        {
          heading: 'STATE LIVES IN THREE PLACES AND NO SINGLE ACTION CLEARS ALL THREE',
          lines: [
            "Disk — the instance's throwaway home: guilds, quests, transcripts, logs. Cleared by restoring a snapshot.",
            'Server memory — the API server PROCESS: in-memory buses, caches, watchers, uptime, open handles. Cleared only by a restart.',
            'Browser — localStorage, sessionStorage, IndexedDB, live websockets, the loaded page. Cleared by a fresh context, or by clearing storage and reloading.',
            'The middle row is the one that bites, and this app holds a concrete instance of it: quest mutations go through a file outbox, but transient events live on an in-memory bus with a cache beside it. Restore the disk and both are still carrying whatever your last attack put there.',
            'A session that restores files and believes it is clean is wrong in exactly the way that produces a confident, false result.',
          ],
        },
        {
          heading: 'THE THREE RESET LEVELS',
          lines: [
            `page — clears browser storage and the loaded document. Keeps disk and server memory. About a second. ${NOT_BUILT}.`,
            `state — clears disk, plus everything page clears. KEEPS SERVER MEMORY. About two seconds. ${NOT_BUILT}.`,
            'instance — clears everything: a fresh process, then re-seed. Keeps nothing. About twenty seconds of boot plus the recipe. Reachable today only by closing the instance and booting another.',
            'level: state takes an explicit target snapshot name. With one snapshot the target is obvious and with three it is a guess, and a reset to the wrong point means every measurement after it lands against a state nobody intended.',
            'A snapshot covers the STATE subtree ONLY. Logs, captures and the run transcript sit outside it and survive every reset at every level. Evidence accumulates forward; only state rewinds.',
            'A reset REPORTS the diff it undid. That turns "what does this level not reset" from a guess somebody wrote down into a measurement: anything still present after a restore is, by definition, what that level does not reach. It doubles as the damage check — no orphaned row, no half-written file, no silently consumed message.',
            'Declare the level your attack needs as part of the attack, not as something the next attack discovers. Most want state. An attack that poisons server memory — exhausting a pool, killing a connection, wedging a watcher — needs instance.',
            "Two constraints on instance. It destroys any unit measuring a difference from a value only that process's lifetime provides — an uptime, a monotonic counter, an append-only log — so such a unit must not sit in the same batch. And it only returns to a comparable state if the recipe is deterministic, which is the same determinism the byte-identical captures depend on.",
          ],
        },
        {
          heading: 'EXPECT: ERROR',
          lines: [
            'A step that is supposed to fail declares expect: error. It is a per-step declaration, never a batch-wide loosening: every other step still stops the batch on an unexpected failure.',
            'A step declaring expect: error that SUCCEEDS returns ok: false and stops the batch. The app accepting what it should have refused is the finding.',
            'Omit expect and the step is assumed to succeed, so an unexpected failure is what stops the batch.',
          ],
        },
        {
          heading: 'BASELINES',
          lines: [
            "You do not take baselines. You INHERIT them, and the mechanism is the one every other reader of a finished walk uses: your dispatch carries the happy walk's instance id and run id for the path you are attacking, and you read its captures with results --instance <id> --run <runId> --kind screenshots. That starts nothing and answers for an instance killed hours earlier.",
            'A tainted baseline is worse than none, and the failure INVERTS the check: compare after-my-attack against a before that was already broken, see no difference, and report that it held.',
            'The promotion rule is per-SHOT and mechanical: a shot is promotable only where every unit on that node came back confirmed AND the round recorded no issue at or before that node. The "or before" half is the easy one to drop — once a defect lands the system may be in a bad state, so a later screen that looks right was reached through a fault.',
            `The promotion rule itself is ${NOT_BUILT}: nothing marks a shot promotable, so what you actually inherit is an instance id and a run id, and the judgement above is yours to apply by hand.`,
            'On a SAD path, known good is an error rendered CORRECTLY — usually a toast. The baseline for a failure branch HAS the error message in it. Compare against a happy-screen baseline instead and you report the toast as damage; worse, where the app swallows the error the pixel change reads 0% and "nothing changed" gets written down as it held.',
            'A toast is TRANSIENT, and a baseline of one is a baseline of a moment. Read a transient as a PRESENCE question — was it there, with that text — never as a pixel diff against the frame.',
            'Cross-lane comparison holds, measured: three lanes with three port pairs produced byte-identical captures at 46,786 bytes each. The requirement is a deterministic seed; a seed whose runtime ids paint on screen would break it.',
          ],
        },
        {
          heading: 'SERVER-SIDE FAILURE INJECTION',
          lines: [
            'Much of hostile-input is drivable through the page today: garbage through type, an oversized value, rapid repeated click.',
            `What is NOT drivable is server-side failure — a 500, a hang, a dropped socket — which is what interruption, staleness and configuration mostly need. Server-side failure injection is ${NOT_BUILT}.`,
            'The mechanism exists and stops short: the lane already injects a fake agent CLI and a fake ward binary, and nothing else.',
            `The key columns that serve you rather than a walker — maxlength and pattern in the attributes, the live and alert regions where a refusal lands, and the app's own invalid verdict — all arrive with the reading step, which is ${NOT_BUILT}.`,
          ],
        },
      ],
    },
    fixing: {
      audience:
        'the fixer — the session that arrives after the walk is over and the instance is gone.',
      summary:
        'Reading a finished run without starting anything, re-running a prelude, and closing what you opened. The first four reads below start nothing at all.',
      sections: [
        {
          heading: 'WHAT YOU WERE HANDED, AND WHAT THE FIRST FOUR READS COST',
          lines: [
            'Your record carries an instance id, a run id, a failing step, the prelude and the evidence paths.',
            'Steps 1 to 4 below start NOTHING. They read the asset tree and the registry, cost no boot and no pool slot, and answer exactly as well for an instance killed an hour ago as for one still running. The first thing that needs a live instance is step 5, which is the reproduction.',
            'Every answer carries instanceState: alive, killed, dead, pruned or unknown.',
            'pruned and unknown are REAL ANSWERS, not empty results. A query landing on reclaimed evidence that returned [] would read as "that step produced nothing", which is the one conclusion you must never draw from a missing file — and a mistyped id answering the same way sends you looking at the app instead of at your own record.',
          ],
        },
        {
          heading: 'STEP 1 — WAS THIS A CLEAN END OR A CRASH',
          lines: [
            'dungeonmaster siegelense status --instance <id>',
            'It changes what the evidence is worth. killed cleanly means the evidence is complete. dead — no heartbeat — means the transcript stops where the driver died, so anything after the last flushed step is ABSENT rather than uneventful.',
            'status answers here because a reaped entry becomes a tombstone, not a deletion. An instance whose orphans a cleanup collected still says what it was and how it ended, for as long as its evidence is retained.',
          ],
        },
        {
          heading: 'STEP 2 — WHAT DID THE FAILING STEP ACTUALLY READ',
          lines: [
            'dungeonmaster siegelense results --instance <id> --run <runId> --step <n>',
            "Name the run. It is not defaulted against a finished instance, and for good reason: that instance may hold the prelude's proving run, the walk and a re-walk, and latest would silently read whichever went last.",
            "With no --step and no --kind you get the RUN's stored return — the same index, shot list and stoppedAt the session that submitted it got. You never made that run, so without this your first move is guessing which kinds to query.",
            "The shot path handed back is absolute and inside the repo, so your next move is a plain Read of it. A path under somebody's home directory would hand you a filename you cannot open, which is the same as handing you nothing.",
          ],
        },
        {
          heading: 'STEP 3 — WHAT DID THE SERVER SAY WHILE IT HAPPENED',
          lines: [
            'dungeonmaster siegelense results --instance <id> --run <runId> --kind server --where-steps 6-8 --where-level error',
            'This is the reading nothing else surfaces, and it is often the whole answer. console is browser-only, so a 500 caused by a server exception is invisible unless somebody opens a log file nobody mentioned.',
          ],
        },
        {
          heading: 'STEP 4 — CONFIRM IT ON THE WIRE, SCOPED TO ONE STEP',
          lines: [
            'dungeonmaster siegelense results --instance <id> --run <runId> --step <n> --kind network --fields status,responseBody',
            'Every exchange carries the step it fell inside, so this answers "that control called this endpoint and got this back" rather than "this request happened sometime during the run".',
          ],
        },
        {
          heading: 'STEP 5 — REPRODUCE ON A FRESH INSTANCE',
          lines: [
            'dungeonmaster siegelense start --spec <specName>, then dungeonmaster siegelense run --instance <newId> --steps <the prelude, verbatim>.',
            'Never resurrect the dead instance.',
            'The prelude carries VERIFIED, so it is a batch already proven to land where it claims. That is the difference between reproducing a state and re-deriving one.',
            'A lane reaps itself after 900 seconds with no run received, and reading evidence off disk does not reset that clock. Pass --idle-timeout-ms on start if you will be thinking between runs.',
          ],
        },
        {
          heading: 'STEP 6 — WRITE THE E2E WITH THE SAME RECIPES THE PRELUDE NAMED',
          lines: [
            'Called in-process from the spec, so the regression test and the walk exercise one seeding vocabulary rather than two.',
            'A recipe is a plain broker the spec can call, and the seed step calls the same one, so the state the walk ran against and the state its regression test runs against come from one source.',
          ],
        },
        {
          heading: 'STEP 7 — CLOSE WHAT YOU OPENED',
          lines: [
            'dungeonmaster siegelense kill --instance <newId>. You started it, so you close it.',
            'It stops the processes, releases the ports, removes the throwaway home, and never touches the evidence directory.',
          ],
        },
        {
          heading: 'WHAT A FIXER MUST NOT DO, AND THE MISTAKE IT MAKES IN THE CAUTIOUS DIRECTION',
          lines: [
            'Do not resurrect the dead instance. Do not start one to look around. Do not go looking for the evidence of an instance you were not handed.',
            'Every instance is three processes against a measured pool, and an unaccounted fourth is how a phase runs out of room.',
            "None of that forbids the READING, and this is the one you will get wrong in the cautious direction. Touch no instance you did not start is about PROCESSES. Steps 1 to 4 start none — so believing you must boot something before you may look at your own record's evidence spends a pool slot AND reads a fresh instance's state instead of the one where the defect happened.",
          ],
        },
      ],
    },
    driving: {
      audience:
        'a session nobody orchestrated — no quest dispatched you, and no dispatcher is watching.',
      summary:
        'The same surface as every other scope, addressed to you. Everything a dispatcher would do for a minion is yours to do.',
      sections: [
        {
          heading: 'FIVE THINGS TRUE OF YOU AND OF NO DISPATCHED ROLE',
          lines: [
            'You are sharing this machine. Read capacity before you open anything, and know that start QUEUES rather than refusing — open three instances beside a running pass and that pass measures your pressure as if it were its own.',
            'kill is yours to call and nothing else will. No dispatcher is watching, so your instance leaks until the idle timeout or until somebody else happens to run cleanup.',
            'Your evidence is where start said it was: the manifest carries the instance id and the evidence directory, and you hold both for your whole life. There is no LOOKUP call to recover them later, so anything a person will want tomorrow goes into what you write down, never left in scrollback.',
            'Your instance is filed under unowned — no quest protects it from ageing out. Come back next week for a capture and it was reclaimed on the ordinary window.',
            "cleanup is safe for you to run and will not touch anyone's live work. It acts on staleness only. Run it rather than reaching for something blunter, or orphans accumulate.",
          ],
        },
        {
          heading: 'THE SURFACE, IN THE ORDER YOU WILL WANT IT',
          lines: [
            'dungeonmaster siegelense capacity — what this machine can take right now. You are sharing this machine, so read it before you start anything: it counts instances this session did not start, and start refuses outright when the machine plainly cannot hold another.',
            'dungeonmaster siegelense start --spec dungeonmaster-web — boots one instance and blocks until the driver answers. It hands back the manifest: instance id, base URL, throwaway home, evidence directory, both server log paths, how long you queued and how long the boot took.',
            'dungeonmaster siegelense start --spec dungeonmaster-headless — the same lane without Chromium, for a flow with no screen.',
            "start --idle-timeout-ms <ms> raises this one instance's idle ceiling. A lane reaps itself after 900 seconds with no run received, and reading evidence off disk does not reset that clock — so an instance you are poking at by hand dies under you at 900 seconds unless you raise it. It only ever RAISES the ceiling: that timeout is the only backstop against an abandoned lane holding a port pair and a browser open forever.",
            `dungeonmaster siegelense run --instance <id> --steps '[{"step":"goto","path":"/"}]' — submits one batch and blocks. Returns a STATUS, never the steps' own payloads. --steps-file <path> takes the same array from a file.`,
            'dungeonmaster siegelense results --instance <id> --run <runId> [--step <n>] [--kind <kind>] — reads the payloads off disk. Starts nothing, holds no pool slot, and answers after the instance is gone.',
            'dungeonmaster siegelense status --instance <id> — one instance in full, including a likelyCause when it died.',
            'dungeonmaster siegelense kill --instance <id> — tears it down, releases the ports, removes the throwaway home, and keeps the evidence.',
          ],
        },
        {
          heading: 'THE READING STEPS, AND WHAT YOU CANNOT DO YET',
          lines: [
            "Fifteen step verbs exist: goto, waitFor, click, type, screenshot, eval, look, box, seed, until, dom, key, health, resize and request. They are values inside run's steps array, never commands of their own.",
            'look reads the page and returns the key — every addressable element with a ref per row — so you can ask what is on a screen rather than only address a testId you already knew.',
            "seed puts the app into a state: { step: 'seed', recipe: '<name>', as: 'g' } runs a recipe and returns the ids it made, and a later step reads them back as {g.guildSlug}. dungeonmaster siegelense recipes lists what states exist.",
            'Ambiguity is an ERROR, never a silent pick. Two matches come back as AMBIGUOUS carrying both candidates; narrow with a within scope.',
            "Read what a step did with results. A step's own reading is results --run <runId> --step <n> with no --kind; the six kinds are console, network, ws, server, screenshots and steps.",
          ],
        },
      ],
    },
    operational: {
      audience:
        'a session verifying a flow that has no screen, where siege is the only verification track there is.',
      summary:
        'The browserless lane, the server log window, and the steps a screenless flow needs. Read the last section first if you are about to plan one: every step this scope names is unbuilt.',
      sections: [
        {
          heading: 'WHAT THIS SCOPE IS',
          lines: [
            "An operational flow has no screen to drive, so the browser walker's whole vocabulary is inapplicable. Siege is the only verification track on one.",
            'The off-map attack families are properties of the BUILT SYSTEM rather than of any drawn flow, so hostile-input and perf coverage exists here too — where there is no paste, no key press and no click. Here the attack is request, file and the process itself.',
          ],
        },
        {
          heading: 'THE BROWSERLESS LANE SPEC',
          lines: [
            'dungeonmaster siegelense start --spec dungeonmaster-headless — the servers, and no Chromium. A browserless spec is just another spec.',
            'Because a profile is keyed by the spec\'s content hash, a browserless spec measures its own steady and peak, and capacity allows more of them in a pool. Nothing special is needed for this: it is the "I added a second server" case running in the other direction.',
            'Browser steps go missing LOUDLY. A browser step submitted against a browserless instance is an error naming the spec, never an empty reading — a reading that quietly returns nothing is the count: 0 problem arriving at the one place a walk cannot recover from it. This half is BUILT: every browser verb errors by name here — goto, waitFor, click, type, screenshot, eval, look, box, dom, key, health and resize.',
            'A browserless boot still needs the fake agent CLI, because it still runs the API process that dispatches through the agent and the ward binary.',
            `The shipped specs still name this repo's own server and web packages directly, so a consumer repo gets a tool that cannot boot its own app. ${NOT_BUILT}.`,
          ],
        },
        {
          heading: 'THE STEPS A FLOW WITH NO SCREEN USES',
          lines: [
            `{ step: 'request', method: 'POST', path: '/api/guilds', body: { name: 'x', path: '/tmp/x' } } — the curl surface, inside the evidence trail. ${NOT_BUILT}.`,
            `{ step: 'file', path: 'guilds/<id>/quests/<id>/quest.json' } — read a file the flow wrote. ${NOT_BUILT}.`,
            "{ step: 'until', file: 'guilds/<id>/quests/<id>/quest.json', timeoutMs: 10000 } — wait on a file appearing, rather than on a locator state. BUILT, and the one until form that runs here: an operational flow has no screen and still writes files.",
            "{ step: 'until', response: { method: 'POST', path: '/api/quests' } } needs a browser and refuses here by name — until { file } above is the only until form this scope gets, since there is no page to poll a network buffer against.",
            `{ step: 'storage', prefix: 'dm-' } — browser storage, which a browserless lane does not have. It is named here because the design names it; on a lane with no screen the durable state is read with file. ${NOT_BUILT}.`,
          ],
        },
        {
          heading: 'RESULTS KIND SERVER — THE READING NOTHING ELSE SURFACES',
          lines: [
            'dungeonmaster siegelense results --instance <id> --run <runId> --kind server [--where-level error] [--where-steps 4-9] — the server log window. BUILT.',
            'The lane already opens the api and web server logs in its own directory, and nothing else tells anyone they are there.',
            'console is browser-only, so on a flow with no screen it answers nothing and the server log is the whole reading.',
            'Every server entry carries the step it fell inside, so "what did the server say during steps 4 to 9" is one query.',
            'network is browser-only too, so on a flow with no screen it answers nothing as well — the server log above is the whole reading the wire gives you here.',
          ],
        },
        {
          heading: 'WHAT IS MISSING BEFORE THIS SCOPE IS USABLE',
          lines: [
            `\`request\`, \`file\` and \`storage\` are still ${NOT_BUILT}; \`until { file }\` is BUILT and is the only until form this scope gets — its browser siblings (\`visible\`/\`predicate\`/\`console\`/\`response\`) all refuse here by name. What works today on a browserless lane is: boot it, close it, read its server log off disk, and wait on a file appearing with \`until { file }\`.`,
            'Driving one is not yet possible. If you were sent here to verify an operational flow, say that in your return rather than reaching for a browser lane and driving the UI instead — the screenless flow is the thing under test, and a browser walk is a different test.',
          ],
        },
      ],
    },
  },
} as const;
