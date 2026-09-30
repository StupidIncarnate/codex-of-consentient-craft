#!/usr/bin/env node
// Resolves the `git merge --no-commit master` in a merge worktree by script, then re-runs this branch's migration over
// master's side so the pivot's shape (gateways for adapters, brands moved out of standalone contracts) is reproduced
// mechanically instead of by hand.
//
//   node scrolls/brands-gateways-epic/merge-master/resolve.cjs --root=<W> [--apply] [--steps=a,b] [--only=<substring>] [--diag=<json>]
//
// Dry-run by default: steps 1 to 3 run in memory and only `<W>/tmp/merge-master/dry-run/` is written. `--apply` writes
// `packages/` in <W> and never touches the git index (no add, reset, checkout or stash) and never deletes a file.
// Steps (all run by default, `--steps` picks):
//   conflicts  every UU file: a hunk of import lines only is the union of both sides' imports (same module merged, a name
//              the pivot already binds from another module dropped); a hunk of imports and code unions the imports and takes
//              master's code; any other hunk takes master's side. The dropped HEAD text is saved, with its line, to
//              <W>/tmp/merge-master/lost-ours/<path>.md
//   du-ud      DU (master modified, pivot deleted): the file moves to <W>/tmp/deletions/merge-master/<path> (kept deleted)
//              and master's diff goes to <W>/tmp/merge-master/du/<path>.diff. UD (pivot modified, master deleted): kept as is
//   adapters   over every file master's side touched: an import of a deleted adapter becomes its replacement from
//              adapter-map.json, with the call rewritten, when the map gives a mechanical mapping. An adapter whose every
//              use cannot be rewritten keeps its import and is listed in leftovers
//   dangling   diag.cjs over <W>, then fix-dangling.cjs apply for TS2307/2305/2724 in those files
//   brand      brand-fix.config.js --fix (R2 and R7 on contracts, R8 on src), one package per eslint process, 16 GB heap
//   suggest    apply-suggestions.cjs for @typescript-eslint/no-unnecessary-type-conversion, per package
//   leftovers  <W>/tmp/merge-master/leftovers.json; `--diag=<json>` adds TS2307/2305/2724 from a finished diag run
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const argv = process.argv.slice(2);
const opt = (name) => {
  const a = argv.find((x) => x === `--${name}` || x.startsWith(`--${name}=`));
  if (!a) return undefined;
  return a.includes('=') ? a.slice(name.length + 3) : true;
};
const W = opt('root') ? path.resolve(opt('root')) : null;
if (!W || !fs.existsSync(path.join(W, 'packages'))) {
  console.error('usage: resolve.cjs --root=<merge worktree> [--apply] [--steps=conflicts,du-ud,adapters,dangling,brand,suggest,leftovers] [--only=<substring>] [--diag=<json>]');
  process.exit(2);
}
const APPLY = opt('apply') === true;
const GP = path.resolve(__dirname, '..', '..', '..');
const BB = path.join(GP, 'scrolls', 'brands-gateways-epic', 'bigbang');
const ALL_STEPS = ['conflicts', 'du-ud', 'adapters', 'dangling', 'brand', 'suggest', 'leftovers'];
const STEPS = new Set(opt('steps') && opt('steps') !== true ? String(opt('steps')).split(',') : ALL_STEPS);
const ONLY = opt('only') && opt('only') !== true ? String(opt('only')) : null;
const MM = path.join(W, 'tmp', 'merge-master');
const DRY = path.join(MM, 'dry-run');
const ts = require(path.join(W, 'node_modules', 'typescript'));

const git = (args, o = {}) => cp.execFileSync('git', ['-C', W, ...args], { encoding: 'utf8', maxBuffer: 1 << 29, ...o });
const gitBuf = (args) => cp.execFileSync('git', ['-C', W, ...args], { maxBuffer: 1 << 29 });
const log = (...a) => console.log(...a);
const mkdirp = (d) => fs.mkdirSync(d, { recursive: true });
const writeOut = (abs, text) => {
  mkdirp(path.dirname(abs));
  fs.writeFileSync(abs, text);
};
const rel = (abs) => path.relative(W, abs).split(path.sep).join('/');

// ------------------------------------------------------------------------------------------------ git state
const BASE = git(['merge-base', 'HEAD', 'master']).trim();
const statusEntries = git(['status', '--porcelain', '-z'])
  .split('\0')
  .filter((e) => e.length > 3)
  .map((e) => ({ xy: e.slice(0, 2), file: e.slice(3) }))
  .filter((e) => e.file.startsWith('packages/'));
const byXy = (xy) => statusEntries.filter((e) => e.xy === xy).map((e) => e.file);
const masterStatus = new Map(); // path -> M | A | D (merge base to master)
for (const line of git(['diff', '--no-renames', '--name-status', BASE, 'master', '--', 'packages']).split('\n')) {
  if (!line) continue;
  const [s, ...rest] = line.split('\t');
  masterStatus.set(rest.join('\t'), s[0]);
}
const inScope = (f) => (ONLY ? f.includes(ONLY) : true);
const UU = byXy('UU').filter(inScope);
const DU = byXy('DU').filter(inScope);
const UD = byXy('UD').filter(inScope);
const duSet = new Set(byXy('DU'));
const udSet = new Set(byXy('UD'));
// Files master's side touched that still exist in <W> (not DU: moved away; not UD: master deleted it).
const isSource = (f) => /\.(ts|tsx|mts|cts)$/u.test(f) && !f.endsWith('.d.ts');
const touchedAll = [...masterStatus.entries()]
  .filter(([f, s]) => s !== 'D' && !duSet.has(f) && !udSet.has(f) && fs.existsSync(path.join(W, f)) && isSource(f))
  .map(([f]) => f)
  .sort();
const touched = touchedAll.filter(inScope);

// ------------------------------------------------------------------------------------------------ import helpers
const normWs = (s) => s.replace(/\s+/gu, ' ').trim();
const importInfo = (sf, stmt) => {
  const clause = stmt.importClause;
  const info = {
    spec: stmt.moduleSpecifier.text,
    typeOnly: !!clause && clause.isTypeOnly,
    def: clause && clause.name ? clause.name.text : null,
    ns: null,
    named: null,
    sideEffect: !clause,
    start: stmt.getStart(sf),
    fullStart: stmt.getFullStart(),
    end: stmt.end,
    text: sf.text.slice(stmt.getStart(sf), stmt.end),
  };
  if (clause && clause.namedBindings) {
    if (ts.isNamespaceImport(clause.namedBindings)) info.ns = clause.namedBindings.name.text;
    else info.named = clause.namedBindings.elements.map((el) => ({ text: el.getText(sf), local: el.name.text, typeOnly: el.isTypeOnly }));
  }
  return info;
};
const localNames = (i) => [i.def, i.ns, ...(i.named || []).map((n) => n.local)].filter(Boolean);

// The leading run of complete import declarations of a hunk side. `lines` are the side's lines without '\r'.
const leadingImports = (lines) => {
  const text = lines.join('\n');
  const sf = ts.createSourceFile('hunk.ts', text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const firstErr = sf.parseDiagnostics.length ? Math.min(...sf.parseDiagnostics.map((d) => d.start ?? 0)) : Infinity;
  const imports = [];
  let endLine = -1;
  for (const st of sf.statements) {
    if (!ts.isImportDeclaration(st) || st.end > firstErr || !ts.isStringLiteral(st.moduleSpecifier)) break;
    const info = importInfo(sf, st);
    info.fullText = text.slice(st.getFullStart(), st.end).replace(/^\s*\n/u, '');
    imports.push(info);
    endLine = sf.getLineAndCharacterOfPosition(st.end).line;
  }
  return { imports, restLines: lines.slice(endLine + 1) };
};

const fmtImport = (i) => {
  const t = i.typeOnly ? 'import type ' : 'import ';
  const named = i.named && i.named.length ? `{ ${i.named.map((n) => n.text).join(', ')} }` : null;
  const head = [i.def, i.ns ? `* as ${i.ns}` : null, named].filter(Boolean).join(', ');
  const one = `${t}${head} from '${i.spec}';`;
  if (one.length <= 100 || !named || i.def || i.ns) return one;
  return `${t}{\n${i.named.map((n) => `  ${n.text},`).join('\n')}\n} from '${i.spec}';`;
};

// Union of two import lists. `oursBound`: local name -> module for every import of the pivot's own file. A theirs name the
// pivot already binds from ANOTHER module is dropped (the pivot re-pointed it, e.g. `z` from zod to the gateway).
const unionImports = (oursImps, theirsImps, oursBound) => {
  const out = []; // {info, text, modified}
  const keyOf = (i) => `${i.spec}|${i.typeOnly}`;
  const exact = new Set();
  const add = (i, fromTheirs) => {
    let cur = { ...i, named: i.named ? i.named.map((n) => ({ ...n })) : null };
    let modified = false;
    if (fromTheirs) {
      const bad = (name) => oursBound.has(name) && oursBound.get(name) !== i.spec;
      if (cur.def && bad(cur.def)) (cur.def = null), (modified = true);
      if (cur.ns && bad(cur.ns)) (cur.ns = null), (modified = true);
      if (cur.named) {
        const kept = cur.named.filter((n) => !bad(n.local));
        if (kept.length !== cur.named.length) (cur.named = kept), (modified = true);
      }
      if (!i.sideEffect && !cur.def && !cur.ns && !(cur.named && cur.named.length)) return;
    }
    const norm = normWs(modified ? fmtImport(cur) : i.text);
    if (exact.has(norm)) return;
    const same = out.find((o) => keyOf(o.info) === keyOf(cur) && !o.info.def && !o.info.ns && !cur.def && !cur.ns && o.info.named && cur.named);
    if (same) {
      const have = new Set(same.info.named.map((n) => normWs(n.text)));
      const have2 = new Set(same.info.named.map((n) => n.local));
      let grew = false;
      for (const n of cur.named) {
        if (have.has(normWs(n.text)) || have2.has(n.local)) continue;
        same.info.named.push(n);
        grew = true;
      }
      if (grew) same.modified = true;
      exact.add(norm);
      return;
    }
    out.push({ info: cur, modified, original: i.fullText ?? i.text });
    exact.add(norm);
  };
  for (const i of oursImps) add(i, false);
  for (const i of theirsImps) add(i, true);
  return out.flatMap((o) => (o.modified ? fmtImport(o.info) : o.original).split('\n'));
};

const boundNames = (text, fileName) => {
  const sf = ts.createSourceFile(fileName, text, ts.ScriptTarget.Latest, true);
  const m = new Map();
  for (const st of sf.statements) if (ts.isImportDeclaration(st) && ts.isStringLiteral(st.moduleSpecifier)) for (const n of localNames(importInfo(sf, st))) m.set(n, st.moduleSpecifier.text);
  return m;
};

// ------------------------------------------------------------------------------------------------ step: conflicts
const RE_START = /^<{7}(?: .*)?\r?$/u;
const RE_BASE = /^\|{7}(?: .*)?\r?$/u;
const RE_MID = /^={7}\r?$/u;
const RE_END = /^>{7}(?: .*)?\r?$/u;

// Candidate hunks come from the marker lines; a candidate counts as a real conflict only when its own side, with the common
// line on each edge, is one contiguous run in that side's stage file. Marker-like lines inside a string or template literal
// (a fixture for a conflict-marker detector) sit in BOTH stages with their marker lines still in them, so the run does not
// exist there and the lines stay ordinary code.
const hasRun = (stageText, lines) => `\n${stageText}\n`.includes(`\n${lines.join('\n')}\n`);
const parseConflicts = (text, oursStage, theirsStage) => {
  const lines = text.split('\n');
  const cands = []; // {start, end, ours, theirs}  start/end: line indexes of the opening and closing marker
  let i = 0;
  while (i < lines.length) {
    if (!RE_START.test(lines[i])) {
      i++;
      continue;
    }
    const start = i;
    const ours = [];
    const theirs = [];
    let state = 'ours';
    let j = i + 1;
    for (; j < lines.length; j++) {
      const l = lines[j];
      if (RE_START.test(l)) throw new Error(`nested conflict marker at line ${j + 1} (hunk opened at ${start + 1})`);
      if (state === 'ours' && RE_BASE.test(l)) state = 'base';
      else if ((state === 'ours' || state === 'base') && RE_MID.test(l)) state = 'theirs';
      else if (state === 'theirs' && RE_END.test(l)) break;
      else if (state === 'theirs' && RE_MID.test(l)) throw new Error(`second ======= at line ${j + 1} (hunk opened at ${start + 1})`);
      else if (state !== 'theirs' && RE_END.test(l)) throw new Error(`>>>>>>> before ======= at line ${j + 1}`);
      else if (state === 'ours') ours.push(l);
      else if (state === 'theirs') theirs.push(l);
    }
    if (j >= lines.length) throw new Error(`unterminated conflict opened at line ${start + 1}`);
    cands.push({ start, end: j, ours, theirs });
    i = j + 1;
  }
  const ctxLine = (idx, cand, dir) => {
    const k = dir < 0 ? cand.start - 1 : cand.end + 1;
    if (k < 0 || k >= lines.length) return [];
    const other = cands.find((c) => c !== cand && (dir < 0 ? c.end === k : c.start === k));
    return other ? [] : [lines[k]];
  };
  const real = cands.filter((c, idx) => {
    const before = ctxLine(idx, c, -1);
    const after = ctxLine(idx, c, 1);
    return hasRun(oursStage, [...before, ...c.ours, ...after]) && hasRun(theirsStage, [...before, ...c.theirs, ...after]);
  });
  const parts = [];
  let common = [];
  let k = 0;
  for (const c of real) {
    common.push(...lines.slice(k, c.start));
    if (common.length) parts.push({ common });
    common = [];
    parts.push({ ours: c.ours, theirs: c.theirs, startLine: c.start + 1 });
    k = c.end + 1;
  }
  common.push(...lines.slice(k));
  if (common.length) parts.push({ common });
  return { parts, demoted: cands.length - real.length };
};

const resolveFile = (file, text) => {
  const crlf = text.includes('\r\n');
  const eol = (l) => (crlf ? `${l}\r` : l);
  const strip = (ls) => ls.map((l) => l.replace(/\r$/u, ''));
  const oursStage = gitBuf(['show', `:2:${file}`]).toString('utf8');
  const theirsStage = gitBuf(['show', `:3:${file}`]).toString('utf8');
  const { parts, demoted } = parseConflicts(text, oursStage, theirsStage);
  const oursBound = boundNames(oursStage, file);
  const out = [];
  const hunks = [];
  let oursLine = 1;
  let mismatches = 0;
  for (const p of parts) {
    if (p.common) {
      out.push(...p.common);
      oursLine += p.common.length;
      continue;
    }
    const { ours, theirs } = p;
    if (ours.length && !oursStage.includes(ours.join('\n'))) mismatches++;
    if (theirs.length && !theirsStage.includes(theirs.join('\n'))) mismatches++;
    const hunk = { file, oursLine, resultLine: out.length + 1, oursLines: ours.length, theirsLines: theirs.length, kind: null, dropped: null };
    const lo = leadingImports(strip(ours));
    const lt = leadingImports(strip(theirs));
    if (lo.imports.length + lt.imports.length > 0 && isSource(file)) {
      const union = unionImports(lo.imports, lt.imports, oursBound).map(eol);
      const restO = lo.restLines.join('\n').trim() ? lo.restLines : [];
      const restTRaw = lt.restLines;
      const tHasCode = restTRaw.join('\n').trim() !== '';
      const oHasCode = restO.length > 0;
      if (!tHasCode && !oHasCode) {
        hunk.kind = 'import-union';
        out.push(...union);
      } else {
        // imports and code in one hunk: the imports union, the code is master's
        hunk.kind = 'import+theirs';
        const rest = theirs.slice(theirs.length - restTRaw.length);
        out.push(...union, ...rest);
        if (oHasCode) hunk.dropped = ours.slice(ours.length - lo.restLines.length);
      }
    } else {
      hunk.kind = 'theirs';
      out.push(...theirs);
      if (ours.join('\n').trim() !== '') hunk.dropped = ours;
    }
    oursLine += ours.length;
    hunks.push(hunk);
  }
  return { text: out.join('\n'), hunks, mismatches, demoted, parts: parts.filter((p) => !p.common).length };
};

const fence = (t) => {
  let f = '```';
  while (t.includes(f)) f += '`';
  return f;
};
const lostOursMd = (file, hunks) => {
  const lost = hunks.filter((h) => h.dropped && h.dropped.length);
  if (!lost.length) return null;
  const parts = [`# Pivot-side text dropped while resolving \`${file}\`\n`, 'Master\'s side was taken for these hunks. Restore any pivot-only edit below that still belongs.\n'];
  for (const h of lost) {
    const body = h.dropped.join('\n').replace(/\r$/gmu, '');
    const f = fence(body);
    parts.push(`## ${file}:${h.oursLine} (HEAD side, ${h.dropped.length} lines; ${h.kind}; now at merged line ${h.resultLine})\n\n${f}ts\n${body}\n${f}\n`);
  }
  return parts.join('\n');
};

// ------------------------------------------------------------------------------------------------ step: adapters
const MAP = JSON.parse(fs.readFileSync(path.join(__dirname, 'adapter-map.json'), 'utf8'));
const MAP_BY_PATH = new Map(MAP.map((e) => [e.adapterPath, e]));

// Property texts of an object-literal argument, or null when it is not a plain list of named properties.
const objProps = (sf, node) => {
  if (node.arguments.length === 0) return new Map();
  if (node.arguments.length !== 1 || !ts.isObjectLiteralExpression(node.arguments[0])) return null;
  const m = new Map();
  for (const p of node.arguments[0].properties) {
    if (ts.isShorthandPropertyAssignment(p)) m.set(p.name.text, { text: p.name.text, simple: true });
    else if (ts.isPropertyAssignment(p) && (ts.isIdentifier(p.name) || ts.isStringLiteral(p.name))) m.set(p.name.text, { text: p.initializer.getText(sf), simple: ts.isIdentifier(p.initializer) });
    else return null;
  }
  return m;
};
const need = (props, keys) => (props && keys.every((k) => props.has(k)) ? keys.map((k) => props.get(k).text) : null);
const exactKeys = (props, keys) => props && props.size === keys.length && keys.every((k) => props.has(k));

// How each adapter call becomes the replacement's call. `spec` is the new import (a relative broker path is resolved per file).
// Adapters absent here have no mechanical mapping: their imports stay and the file goes to leftovers with the map's own note.
const SIEGE = 'packages/siegelense/src/adapters';
const SRV = 'packages/server/src/adapters';
const ORCH = 'packages/orchestrator/src/adapters';
const HYD = 'packages/hydration-recipes/src/adapters';
const WEB = 'packages/web/src/adapters';
const sameArgs = (name) => (props, raw) => `${name}(${raw})`;
const brokerSwap = (adapterPath, name) => {
  const e = MAP_BY_PATH.get(adapterPath);
  return { importSpec: { relativeTo: e.replacement.import }, name, build: sameArgs(name) };
};
const orchMethod = (method, optional = {}) => ({
  importSpec: { module: '@dungeonmaster/orchestrator' },
  name: 'StartOrchestrator',
  build: (props, raw) => {
    if (!props) return null;
    if (props.size === 0) return `StartOrchestrator.${method}(${raw})`;
    const parts = [];
    for (const [k, v] of props) {
      if (optional[k] && v.simple) parts.push(`...(${k}${optional[k]} && { ${k} })`);
      else parts.push(k === v.text ? k : `${k}: ${v.text}`);
    }
    return `StartOrchestrator.${method}({ ${parts.join(', ')} })`;
  },
});
const orchBare = (name) => ({ importSpec: { module: '@dungeonmaster/orchestrator' }, name, build: (props, raw) => `${name}(${raw})` });
const gw = (module, name, build) => ({ importSpec: { module }, name, build });
const TRANSFORMS = {
  [`${SIEGE}/net/unix-request/net-unix-request-adapter`]: brokerSwap(`${SIEGE}/net/unix-request/net-unix-request-adapter`, 'driverSocketRequestBroker'),
  [`${SIEGE}/playwright/session/playwright-session-adapter`]: brokerSwap(`${SIEGE}/playwright/session/playwright-session-adapter`, 'browserSessionLaunchBroker'),
  [`${SIEGE}/process/is-alive/process-is-alive-adapter`]: brokerSwap(`${SIEGE}/process/is-alive/process-is-alive-adapter`, 'processIsAliveBroker'),
  [`${SIEGE}/process/kill-group/process-kill-group-adapter`]: brokerSwap(`${SIEGE}/process/kill-group/process-kill-group-adapter`, 'processKillGroupBroker'),
  [`${SRV}/process/dev-log/process-dev-log-adapter`]: brokerSwap(`${SRV}/process/dev-log/process-dev-log-adapter`, 'processDevLogBroker'),
  [`${HYD}/dm-http/request/dm-http-request-adapter`]: brokerSwap(`${HYD}/dm-http/request/dm-http-request-adapter`, 'dmHttpRequestBroker'),
  [`${HYD}/dm-http/response-unwrap/dm-http-response-unwrap-adapter`]: brokerSwap(`${HYD}/dm-http/response-unwrap/dm-http-response-unwrap-adapter`, 'dmHttpResponseUnwrapTransformer'),
  [`${SRV}/orchestrator/add-guild/orchestrator-add-guild-adapter`]: orchMethod('addGuild'),
  [`${SRV}/orchestrator/update-guild/orchestrator-update-guild-adapter`]: orchMethod('updateGuild', { name: ' !== undefined', path: ' !== undefined' }),
  [`${SRV}/orchestrator/get-quest/orchestrator-get-quest-adapter`]: orchMethod('getQuest', { stage: '' }),
  [`${SRV}/orchestrator/load-quest/orchestrator-load-quest-adapter`]: orchMethod('loadQuest'),
  [`${SRV}/orchestrator/start-quest/orchestrator-start-quest-adapter`]: orchMethod('startQuest'),
  [`${SRV}/orchestrator/play-dispatch/orchestrator-play-dispatch-adapter`]: orchMethod('playDispatch', { force: ' !== undefined' }),
  [`${SRV}/orchestrator/replay-chat-history/orchestrator-replay-chat-history-adapter`]: orchMethod('replayChatHistory', { agentId: '' }),
  [`${SRV}/orchestrator/stop-all-chats/orchestrator-stop-all-chats-adapter`]: orchMethod('stopAllChats'),
  [`${SRV}/orchestrator/find-quest-by-work-item-id/orchestrator-find-quest-by-work-item-id-adapter`]: orchMethod('findQuestByWorkItemId'),
  [`${SRV}/orchestrator/find-quest-path/orchestrator-find-quest-path-adapter`]: orchBare('questFindQuestPathBroker'),
  [`${SRV}/orchestrator/outbox-watch/orchestrator-outbox-watch-adapter`]: {
    importSpec: { module: '@dungeonmaster/orchestrator' },
    name: 'questOutboxWatchBroker',
    build: (props, raw) => {
      if (!props) return null;
      const parts = [];
      for (const [k, v] of props) {
        if (k === 'resetOnStart' && v.simple) parts.push('...(resetOnStart === undefined ? {} : { resetOnStart })');
        else parts.push(k === v.text ? k : `${k}: ${v.text}`);
      }
      return `questOutboxWatchBroker({ ${parts.join(', ')} })`;
    },
  },
  [`${SRV}/orchestrator/events-on/orchestrator-events-on-adapter`]: { importSpec: { module: '@dungeonmaster/orchestrator' }, name: 'orchestrationEventsState', build: (props, raw) => `orchestrationEventsState.on(${raw})` },
  [`${SRV}/fs/read-file/fs-read-file-adapter`]: gw('#gateway/node/fs__promises', 'readFile', (p) => { const a = exactKeys(p, ['filepath']) && need(p, ['filepath']); return a ? `readFile(${a[0]})` : null; }),
  [`${SRV}/hono/create-node-web-socket/hono-create-node-web-socket-adapter`]: gw('#gateway/npm/hono__node-ws', 'createNodeWebSocket', (p, raw) => `createNodeWebSocket(${raw})`),
  [`${SRV}/hono/serve/hono-serve-adapter`]: gw('#gateway/npm/hono__node-server', 'serve', (p) => { const a = exactKeys(p, ['fetch', 'port', 'hostname', 'onListen']) && need(p, ['fetch', 'port', 'hostname', 'onListen']); return a ? `serve({ fetch: ${a[0]}, port: ${a[1]}, hostname: ${a[2]} }, ${a[3]})` : null; }),
  [`${ORCH}/fs/is-accessible/fs-is-accessible-adapter`]: gw('#gateway/node/fs__promises', 'pathExists', (p) => { const a = exactKeys(p, ['filePath']) && need(p, ['filePath']); return a ? `pathExists(${a[0]})` : null; }),
  [`${WEB}/mantine/notifications-show/mantine-notifications-show-adapter`]: gw('#gateway/npm/mantine__notifications', 'notifications', (p, raw) => `notifications.show(${raw})`),
  [`${WEB}/mantine/render/mantine-render-adapter`]: gw('@dungeonmaster/testing/middleware/mantine-render', 'mantineRenderMiddleware', (p, raw) => `mantineRenderMiddleware(${raw})`),
  [`${SIEGE}/fs/close-fd/fs-close-fd-adapter`]: gw('#gateway/node/fs', 'closeSync', (p) => { const a = exactKeys(p, ['fd']) && need(p, ['fd']); return a ? `closeSync(${a[0]})` : null; }),
  [`${SIEGE}/fs/copy-file/fs-copy-file-adapter`]: gw('#gateway/node/fs__promises', 'copyFile', (p) => { const a = exactKeys(p, ['sourcePath', 'destinationPath']) && need(p, ['sourcePath', 'destinationPath']); return a ? `copyFile(${a[0]}, ${a[1]})` : null; }),
  [`${SIEGE}/fs/open-fd/fs-open-fd-adapter`]: gw('#gateway/node/fs', 'openForAppendSync', (p) => { const a = exactKeys(p, ['filePath']) && need(p, ['filePath']); return a ? `openForAppendSync(${a[0]})` : null; }),
  [`${SIEGE}/fs/rm/fs-rm-adapter`]: gw('#gateway/node/fs__promises', 'rm', (p) => { const a = exactKeys(p, ['dirPath']) && need(p, ['dirPath']); return a ? `rm(${a[0]}, { recursive: true, force: true })` : null; }),
  [`${SIEGE}/fs/write-file/fs-write-file-adapter`]: gw('#gateway/node/fs__promises', 'writeFile', (p) => { const a = exactKeys(p, ['filePath', 'contents']) && need(p, ['filePath', 'contents']); return a ? `writeFile(${a[0]}, ${a[1]})` : null; }),
  [`${SIEGE}/os/tmpdir/os-tmpdir-adapter`]: gw('#gateway/node/os', 'tmpdir', (p, raw) => (raw === '' ? 'tmpdir()' : null)),
  [`${SIEGE}/error/is-native-error/error-is-native-error-adapter`]: gw('#gateway/node/util__types', 'isNativeError', (p) => { const a = exactKeys(p, ['value']) && need(p, ['value']); return a ? `isNativeError(${a[0]})` : null; }),
  [`${SIEGE}/crypto/hash/crypto-hash-adapter`]: gw('#gateway/node/crypto', 'createHash', (p) => { const a = exactKeys(p, ['content']) && need(p, ['content']); return a ? `createHash('sha256').update(${a[0]}).digest('hex')` : null; }),
};
for (const k of Object.keys(TRANSFORMS)) if (!MAP_BY_PATH.has(k)) throw new Error(`transform for an adapter that is not in adapter-map.json: ${k}`);

const relSpec = (fromFile, targetNoExt) => {
  let r = path.relative(path.dirname(path.join(W, fromFile)), path.join(W, targetNoExt)).split(path.sep).join('/');
  if (!r.startsWith('.')) r = `./${r}`;
  return r;
};

const topLevelNames = (sf) => {
  const s = new Set();
  for (const st of sf.statements) {
    if (ts.isImportDeclaration(st) && ts.isStringLiteral(st.moduleSpecifier)) for (const n of localNames(importInfo(sf, st))) s.add(n);
    else if (ts.isVariableStatement(st)) for (const d of st.declarationList.declarations) if (ts.isIdentifier(d.name)) s.add(d.name.text);
    else if ((ts.isFunctionDeclaration(st) || ts.isClassDeclaration(st) || ts.isTypeAliasDeclaration(st) || ts.isInterfaceDeclaration(st) || ts.isEnumDeclaration(st)) && st.name) s.add(st.name.text);
  }
  return s;
};

const applyEdits = (text, edits) => {
  const sorted = [...edits].sort((a, b) => b.start - a.start);
  let out = text;
  let lastStart = Infinity;
  for (const e of sorted) {
    if (e.end > lastStart) continue; // overlaps an edit already applied (an outer one); the next pass takes it
    out = out.slice(0, e.start) + e.text + out.slice(e.end);
    lastStart = e.start;
  }
  return out;
};

// Returns { text, rewritten: [{adapter, calls}], kept: [{adapter, reason, line}] }.
const rewriteAdapters = (file, text) => {
  const res = { text, rewritten: [], kept: [] };
  const dir = path.dirname(path.join(W, file));
  const adapterOf = (spec) => {
    if (!spec.startsWith('.')) return null;
    const abs = rel(path.resolve(dir, spec));
    if (MAP_BY_PATH.has(abs)) return { entry: MAP_BY_PATH.get(abs), proxy: false, path: abs };
    if (abs.endsWith('.proxy') && MAP_BY_PATH.has(abs.slice(0, -6))) return { entry: MAP_BY_PATH.get(abs.slice(0, -6)), proxy: true, path: abs.slice(0, -6) };
    return null;
  };
  const scan = () => {
    const sf = ts.createSourceFile(file, res.text, ts.ScriptTarget.Latest, true);
    const imports = [];
    for (const st of sf.statements) if (ts.isImportDeclaration(st) && ts.isStringLiteral(st.moduleSpecifier)) {
      const a = adapterOf(st.moduleSpecifier.text);
      if (a) imports.push({ st, a, info: importInfo(sf, st) });
    }
    return { sf, imports };
  };
  const { sf, imports } = scan();
  // Adapter and proxy imports / mock specifiers that are not plain imports stay for the porting agent.
  const strRefs = [];
  const walkStr = (n) => {
    if (ts.isStringLiteral(n) && !ts.isImportDeclaration(n.parent)) {
      const a = adapterOf(n.text);
      if (a) strRefs.push({ a, line: sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1 });
    }
    ts.forEachChild(n, walkStr);
  };
  walkStr(sf);
  for (const r of strRefs) res.kept.push({ adapter: r.a.path, reason: r.a.proxy ? 'proxy module specifier in a mock call' : 'adapter module specifier in a mock call', line: r.line });
  for (const imp of imports) {
    const { a, info, st } = imp;
    const line = sf.getLineAndCharacterOfPosition(st.getStart(sf)).line + 1;
    if (a.proxy) {
      res.kept.push({ adapter: a.path, reason: `proxy import; replacement ${a.entry.replacement.proxyImport ?? 'none'} (${a.entry.replacement.proxyExportName ?? 'none'})`, line });
      continue;
    }
    const tr = TRANSFORMS[a.path];
    if (!tr) {
      res.kept.push({ adapter: a.path, reason: `no mechanical mapping (${a.entry.confidence}): ${a.entry.callShape.slice(0, 160)}`, line });
      continue;
    }
    if (info.typeOnly || !info.named || info.named.length !== 1 || info.def || info.ns) {
      res.kept.push({ adapter: a.path, reason: 'import shape is not a single named value import', line });
      continue;
    }
    const local = info.named[0].local;
    // Every use must be a call with an argument shape the transform reads; otherwise nothing of this adapter is rewritten.
    const uses = [];
    let bad = null;
    const walk = (n) => {
      if (ts.isIdentifier(n) && n.text === local && n !== st.importClause.namedBindings.elements[0].name && !(n.parent && ts.isImportSpecifier(n.parent))) {
        const p = n.parent;
        const isProp = (ts.isPropertyAccessExpression(p) && p.name === n) || (ts.isPropertyAssignment(p) && p.name === n);
        if (!isProp) {
          if (ts.isCallExpression(p) && p.expression === n) uses.push(p);
          else bad = `use that is not a call (line ${sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1})`;
        }
      }
      ts.forEachChild(n, walk);
    };
    walk(sf);
    if (bad) {
      res.kept.push({ adapter: a.path, reason: bad, line });
      continue;
    }
    const spec = tr.importSpec.module ?? relSpec(file, tr.importSpec.relativeTo);
    const boundFrom = (tsf, name) => tsf.statements.some((s2) => ts.isImportDeclaration(s2) && ts.isStringLiteral(s2.moduleSpecifier) && importInfo(tsf, s2).spec === spec && importInfo(tsf, s2).named?.some((n) => n.local === name));
    if (topLevelNames(sf).has(tr.name) && !boundFrom(sf, tr.name)) {
      res.kept.push({ adapter: a.path, reason: `replacement name ${tr.name} is already bound in the file from another source`, line });
      continue;
    }
    const edits = [];
    let failed = false;
    for (const call of uses) {
      const props = objProps(sf, call);
      const raw = call.arguments.map((x) => x.getText(sf)).join(', ');
      let t = null;
      try {
        t = tr.build(props, raw);
      } catch {
        t = null;
      }
      if (t === null) {
        failed = true;
        break;
      }
      edits.push({ start: call.getStart(sf), end: call.end, text: t });
    }
    if (failed) {
      res.kept.push({ adapter: a.path, reason: `a call's argument shape is not the map's (${a.entry.callShape.slice(0, 120)})`, line });
      continue;
    }
    // Apply the calls (an outer call first; a nested one on a later pass), then the import line.
    let t2 = applyEdits(res.text, edits);
    const sf2 = ts.createSourceFile(file, t2, ts.ScriptTarget.Latest, true);
    const imp2 = sf2.statements.find((s2) => ts.isImportDeclaration(s2) && s2.moduleSpecifier.text === st.moduleSpecifier.text);
    const e = imp2.end;
    if (boundFrom(sf2, tr.name)) {
      const nlAfter = t2[e] === '\r' && t2[e + 1] === '\n' ? 2 : t2[e] === '\n' ? 1 : 0;
      t2 = t2.slice(0, imp2.getStart(sf2)) + t2.slice(e + nlAfter);
    } else t2 = t2.slice(0, imp2.getStart(sf2)) + `import { ${tr.name} } from '${spec}';` + t2.slice(e);
    res.text = t2;
    res.rewritten.push({ adapter: a.path, calls: uses.length });
    return { ...res, again: true };
  }
  return res;
};
const rewriteAdaptersFixpoint = (file, text) => {
  let cur = { text, rewritten: [], kept: [] };
  for (let pass = 0; pass < 40; pass++) {
    const r = rewriteAdapters(file, cur.text);
    cur = { text: r.text, rewritten: [...cur.rewritten, ...r.rewritten], kept: r.kept };
    if (!r.again) break;
  }
  return cur;
};

// ------------------------------------------------------------------------------------------------ step helpers
const readW = (f) => fs.readFileSync(path.join(W, f), 'utf8');
const summary = { steps: [...STEPS], apply: APPLY, base: BASE, conflicts: {}, duUd: {}, adapters: {}, dangling: {}, brand: {}, suggest: {}, leftovers: {} };
const adapterKept = []; // {file, adapter, reason, line}
const resolvedText = new Map(); // dry-run: file -> resolved text

if (STEPS.has('conflicts')) {
  const kinds = { 'import-union': 0, 'import+theirs': 0, theirs: 0 };
  const failures = [];
  let files = 0;
  let lostFiles = 0;
  let hunkTotal = 0;
  let mismatches = 0;
  let demotedMarkers = 0;
  const perFile = [];
  for (const f of UU) {
    const text = readW(f);
    if (!/^<{7}/mu.test(text)) continue; // already resolved by an earlier run
    let r;
    try {
      r = resolveFile(f, text);
    } catch (e) {
      failures.push({ file: f, error: String(e.message) });
      continue;
    }
    files++;
    hunkTotal += r.hunks.length;
    mismatches += r.mismatches;
    demotedMarkers += r.demoted;
    for (const h of r.hunks) kinds[h.kind]++;
    perFile.push({ file: f, hunks: r.hunks.map((h) => ({ kind: h.kind, oursLine: h.oursLine, resultLine: h.resultLine, dropped: h.dropped ? h.dropped.length : 0 })) });
    const md = lostOursMd(f, r.hunks);
    if (md) lostFiles++;
    resolvedText.set(f, r.text);
    if (APPLY) {
      fs.writeFileSync(path.join(W, f), r.text);
      if (md) writeOut(path.join(MM, 'lost-ours', `${f}.md`), md);
    } else {
      writeOut(path.join(DRY, 'resolved', f), r.text);
      if (md) writeOut(path.join(DRY, 'lost-ours', `${f}.md`), md);
    }
  }
  Object.assign(summary.conflicts, { uuFiles: UU.length, resolvedFiles: files, hunks: hunkTotal, kinds, lostOursFiles: lostFiles, sideNotInStage: mismatches, markerLikeKept: demotedMarkers, failures, perFile });
  log(`conflicts: ${files}/${UU.length} UU files, ${hunkTotal} hunks ${JSON.stringify(kinds)}, lost-ours files ${lostFiles}, side-not-in-stage ${mismatches}, marker-like kept as code ${demotedMarkers}, failures ${failures.length}`);
  for (const f of failures) log(`  FAILED ${f.file}: ${f.error}`);
}

if (STEPS.has('du-ud')) {
  const du = [];
  for (const f of DU) {
    const diff = git(['diff', BASE, 'master', '--', f]);
    const abs = path.join(W, f);
    du.push({ file: f, diffLines: diff.split('\n').length, presentInWorktree: fs.existsSync(abs) });
    if (APPLY) {
      writeOut(path.join(MM, 'du', `${f}.diff`), diff);
      if (fs.existsSync(abs)) {
        const dest = path.join(W, 'tmp', 'deletions', 'merge-master', f);
        mkdirp(path.dirname(dest));
        fs.renameSync(abs, dest);
      }
    } else writeOut(path.join(DRY, 'du', `${f}.diff`), diff);
  }
  Object.assign(summary.duUd, { du, ud: UD });
  log(`du-ud: ${du.length} DU kept deleted (master diff saved; file moved to tmp/deletions/merge-master when present), ${UD.length} UD kept ours`);
}

if (STEPS.has('adapters')) {
  let changed = 0;
  const rewrittenBy = {};
  const keptBy = {};
  const samples = [];
  for (const f of touched) {
    const before = resolvedText.has(f) ? resolvedText.get(f) : readW(f);
    const r = rewriteAdaptersFixpoint(f, before);
    for (const k of r.kept) {
      adapterKept.push({ file: f, ...k });
      keptBy[k.adapter] = (keptBy[k.adapter] ?? 0) + 1;
    }
    for (const w of r.rewritten) rewrittenBy[w.adapter] = (rewrittenBy[w.adapter] ?? 0) + w.calls;
    if (r.text !== before) {
      changed++;
      if (samples.length < 6) samples.push(f);
      resolvedText.set(f, r.text);
      if (APPLY) fs.writeFileSync(path.join(W, f), r.text);
      else writeOut(path.join(DRY, 'resolved', f), r.text);
    }
  }
  Object.assign(summary.adapters, { touchedFiles: touched.length, filesChanged: changed, callsRewrittenByAdapter: rewrittenBy, keptByAdapter: keptBy, keptTotal: adapterKept.length });
  log(`adapters: ${touched.length} master-touched files scanned, ${changed} changed; calls rewritten ${Object.values(rewrittenBy).reduce((a, b) => a + b, 0)} over ${Object.keys(rewrittenBy).length} adapters; left ${adapterKept.length} sites over ${Object.keys(keptBy).length} adapters`);
}
fs.mkdirSync(MM, { recursive: true });
if (STEPS.has('adapters')) writeOut(path.join(MM, APPLY ? 'adapter-kept.json' : 'dry-run/adapter-kept.json'), JSON.stringify(adapterKept, null, 1));

// ------------------------------------------------------------------------------------------------ steps needing the tree on disk
const run = (cmd, args, o = {}) => cp.spawnSync(cmd, args, { cwd: W, encoding: 'utf8', maxBuffer: 1 << 29, ...o });
const pkgOf = (f) => {
  const p = f.split('/');
  return p[1].startsWith('@') ? `${p[0]}/${p[1]}/${p[2]}` : `${p[0]}/${p[1]}`;
};
const touchedByPkg = () => {
  const m = new Map();
  for (const f of touched) {
    if (!fs.existsSync(path.join(W, f))) continue;
    const k = pkgOf(f);
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(f);
  }
  return m;
};

if (STEPS.has('dangling')) {
  if (!APPLY) log('dangling: skipped in a dry run (needs the resolved tree on disk)');
  else {
    const out = path.join(MM, 'diag-pre-dangling.json');
    log('dangling: diag over the tree...');
    const d = run('node', [path.join(BB, 'tools', 'diag.cjs'), `--root=${W}`, '--full', '--jobs=3', `--out=${out}`], { stdio: ['ignore', 'inherit', 'inherit'] });
    if (!fs.existsSync(out)) throw new Error(`diag produced no output (exit ${d.status})`);
    const touchedSet = new Set(touched);
    const all = JSON.parse(fs.readFileSync(out, 'utf8'));
    const pick = all.filter((e) => [2307, 2305, 2724].includes(e.code) && touchedSet.has(e.file));
    const fd = path.join(MM, 'fd');
    mkdirp(path.join(fd, 'bigbang', 'logs'));
    const link = path.join(fd, 'deletions');
    if (!fs.existsSync(link)) fs.symlinkSync(path.join(GP, 'tmp', 'deletions'), link);
    const srcLogs = path.join(GP, 'tmp', 'bigbang', 'logs');
    for (const f of fs.readdirSync(srcLogs)) if (/^W[34]-.*\.log$/u.test(f)) fs.copyFileSync(path.join(srcLogs, f), path.join(fd, 'bigbang', 'logs', f));
    const pickFile = path.join(fd, 'bigbang', 'logs', 'diag-merge.json');
    fs.writeFileSync(pickFile, JSON.stringify(pick));
    log(`dangling: diag ${all.length} errors; ${pick.length} TS2307/2305/2724 in master-touched files`);
    const r = run('node', ['--max-old-space-size=16000', path.join(BB, 'fix-dangling.cjs'), `--root=${W}`, `--out-dir=${fd}`, `--diag=${pickFile}`, 'apply'], { stdio: ['ignore', 'pipe', 'pipe'] });
    log((r.stdout || '').split('\n').slice(-30).join('\n'));
    if (r.status !== 0) log(`fix-dangling exit ${r.status}: ${(r.stderr || '').slice(-1500)}`);
    Object.assign(summary.dangling, { diagErrors: all.length, picked: pick.length, exit: r.status });
  }
}

const eslintBin = path.join(W, 'node_modules', '.bin', 'eslint');
if (STEPS.has('brand')) {
  if (!APPLY) log('brand: skipped in a dry run');
  else {
    const res = {};
    for (const [pkg, files] of touchedByPkg()) {
      const contracts = files.filter((f) => f.includes('/src/contracts/') && !/\.(test|stub|proxy)\.tsx?$/u.test(f));
      const srcFiles = files.filter((f) => f.includes('/src/') && !/\.(test|stub|proxy|harness)\.tsx?$/u.test(f));
      const passes = [
        ['r2', contracts],
        ['r7', contracts],
        ['r8', srcFiles],
      ];
      for (const [rule, list] of passes) {
        if (!list.length) continue;
        for (let i = 0; i < list.length; i += 250) {
          const chunk = list.slice(i, i + 250);
          const r = run(eslintBin, ['-c', path.join(BB, 'brand-fix.config.js'), '--fix', '-f', 'json', '-o', path.join(MM, `brand-${rule}.json`), ...chunk], {
            env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=16000', MIGRATE_ROOT: W, BRAND_FIX_RULES: rule },
          });
          let fixed = 0;
          let crashed = false;
          try {
            const rep = JSON.parse(fs.readFileSync(path.join(MM, `brand-${rule}.json`), 'utf8'));
            fixed = rep.filter((x) => x.output !== undefined).length;
          } catch {
            crashed = true;
          }
          res[`${pkg}:${rule}`] = { files: chunk.length, fixedFiles: fixed, crashed, exit: r.status, stderr: crashed ? (r.stderr || '').slice(-400) : undefined };
        }
      }
    }
    Object.assign(summary.brand, res);
    log(`brand: ${Object.keys(res).length} package/rule runs, files fixed ${Object.values(res).reduce((a, b) => a + b.fixedFiles, 0)}, crashed ${Object.values(res).filter((x) => x.crashed).length}`);
  }
}

if (STEPS.has('suggest')) {
  if (!APPLY) log('suggest: skipped in a dry run');
  else {
    const dirs = [...touchedByPkg().keys()];
    const r = run('node', [path.join(BB, 'apply-suggestions.cjs'), `--root=${W}`, '@typescript-eslint/no-unnecessary-type-conversion', ...dirs], { env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=16000' } });
    const tail = (r.stdout || '').split('\n').slice(-12).join('\n');
    log(`suggest: exit ${r.status}\n${tail}`);
    Object.assign(summary.suggest, { exit: r.status, packages: dirs, tail });
  }
}

// ------------------------------------------------------------------------------------------------ step: leftovers
const RESOLVE_EXT = ['', '.ts', '.tsx', '.d.ts', '/index.ts', '/index.tsx', '.js', '.json'];
const existsSpec = (fromAbs, spec) => {
  const bases = /\.(c|m)?js$/u.test(spec) ? [spec, spec.replace(/\.(c|m)?js$/u, '')] : [spec];
  return bases.some((b) => RESOLVE_EXT.some((e) => {
    const p = path.resolve(path.dirname(fromAbs), b + e);
    return fs.existsSync(p) && fs.statSync(p).isFile();
  }));
};
if (STEPS.has('leftovers')) {
  const items = new Map(); // file -> {file, reasons: [{kind, ...}]}
  const add = (file, r) => {
    if (!items.has(file)) items.set(file, { file, reasons: [] });
    items.get(file).reasons.push(r);
  };
  const listPkgFiles = (dir, acc = []) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (['node_modules', 'dist', '.ward', 'coverage', 'test-results', '.test-tmp', 'playwright-report'].includes(e.name)) continue;
      const p = path.join(dir, e.name);
      if (e.isDirectory()) listPkgFiles(p, acc);
      else if (/\.(ts|tsx|json|md|js|cjs|mjs)$/u.test(e.name)) acc.push(p);
    }
    return acc;
  };
  // conflict markers: any file in packages/
  for (const abs of listPkgFiles(path.join(W, 'packages'))) {
    const t = resolvedText.has(rel(abs)) ? resolvedText.get(rel(abs)) : fs.readFileSync(abs, 'utf8');
    const m = /^(<{7}|>{7})(?: .*)?\r?$/mu.exec(t);
    if (m) add(rel(abs), { kind: 'conflict-marker', line: t.slice(0, m.index).split('\n').length });
  }
  // adapter imports and dangling relative imports: master-touched files
  const scanTouched = new Set(touched);
  for (const f of scanTouched) {
    const abs = path.join(W, f);
    if (!fs.existsSync(abs)) continue;
    const sf = ts.createSourceFile(f, resolvedText.has(f) ? resolvedText.get(f) : fs.readFileSync(abs, 'utf8'), ts.ScriptTarget.Latest, true);
    const visit = (n) => {
      if ((ts.isImportDeclaration(n) || ts.isExportDeclaration(n)) && n.moduleSpecifier && ts.isStringLiteral(n.moduleSpecifier)) {
        const spec = n.moduleSpecifier.text;
        if (spec.startsWith('.')) {
          const line = sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1;
          const target = rel(path.resolve(path.dirname(abs), spec));
          const inAdapters = /(^|\/)adapters\//u.test(target);
          const exists = existsSpec(abs, spec);
          if (inAdapters) add(f, { kind: 'adapter-import', spec, line, targetExists: exists, inMap: MAP_BY_PATH.has(target.replace(/\.proxy$/u, '')), note: MAP_BY_PATH.get(target.replace(/\.proxy$/u, ''))?.replacement });
          else if (!exists) add(f, { kind: 'dangling-import', spec, line });
        }
      }
      ts.forEachChild(n, visit);
    };
    visit(sf);
    if (sf.parseDiagnostics.length) add(f, { kind: 'syntax-error', count: sf.parseDiagnostics.length, first: ts.flattenDiagnosticMessageText(sf.parseDiagnostics[0].messageText, '\n'), line: sf.getLineAndCharacterOfPosition(sf.parseDiagnostics[0].start ?? 0).line + 1 });
  }
  for (const k of adapterKept) if (scanTouched.has(k.file)) add(k.file, { kind: 'adapter-unmapped', adapter: k.adapter, reason: k.reason, line: k.line });
  // master-added files that live in a deleted folder type
  for (const [f, s] of masterStatus) if (s === 'A' && /\/src\/adapters\//u.test(f) && fs.existsSync(path.join(W, f)) && /\.tsx?$/u.test(f)) add(f, { kind: 'new-adapter-file', note: 'master added a file under adapters/, a folder type this branch deleted; it needs a broker' });
  if (opt('diag') && opt('diag') !== true) {
    const diag = JSON.parse(fs.readFileSync(path.resolve(String(opt('diag'))), 'utf8'));
    for (const e of diag) if ([2307, 2305, 2724].includes(e.code) && e.file && scanTouched.has(e.file)) add(e.file, { kind: 'dangling-import', code: e.code, line: e.line, message: e.message.split('\n')[0] });
  }
  const grouped = {};
  const folderOf = (f) => {
    const p = f.split('/');
    const i = p.findIndex((x, ix) => ix >= 2 && (x === 'src' || x === 'test'));
    return i === -1 ? p.slice(2, -1).join('/') || '.' : p.slice(i, i + 2).join('/');
  };
  for (const it of [...items.values()].sort((a, b) => a.file.localeCompare(b.file))) {
    const pkg = pkgOf(it.file).replace(/^packages\//u, '');
    const folder = folderOf(it.file);
    grouped[pkg] ??= {};
    (grouped[pkg][folder] ??= []).push(it);
  }
  const counts = {};
  for (const it of items.values()) for (const r of it.reasons) counts[r.kind] = (counts[r.kind] ?? 0) + 1;
  const doc = {
    generatedAt: new Date().toISOString(),
    root: W,
    note: 'Files still carrying a conflict marker, an adapter import, an unmapped adapter call, a dangling import or a syntax error. Dangling TS2307/2305/2724 entries come from --diag when given.',
    totalFiles: items.size,
    reasonCounts: counts,
    byPackage: grouped,
  };
  const dest = path.join(MM, APPLY ? 'leftovers.json' : 'dry-run/leftovers.json');
  writeOut(dest, JSON.stringify(doc, null, 1));
  Object.assign(summary.leftovers, { totalFiles: items.size, reasonCounts: counts, path: dest });
  log(`leftovers: ${items.size} files ${JSON.stringify(counts)} -> ${dest}`);
}

writeOut(path.join(MM, APPLY ? 'summary.json' : 'dry-run/summary.json'), JSON.stringify(summary, null, 1));
log(`${APPLY ? 'APPLIED' : 'DRY RUN'}; summary at ${path.join(MM, APPLY ? 'summary.json' : 'dry-run/summary.json')}`);
