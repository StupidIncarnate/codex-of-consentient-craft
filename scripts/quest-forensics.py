#!/usr/bin/env python3
"""Compact digests of Claude Code session transcripts, for post-mortem analysis of a quest run.

Every Dungeonmaster work item that dispatches an agent records a `sessionId`. Claude Code writes that
session's full transcript to `~/.claude/projects/<encoded-cwd>/<sessionId>.jsonl`, its sub-agents to
`<sessionId>/subagents/agent-<id>.jsonl`, and any oversized tool result to `<sessionId>/tool-results/`.
Those files are the only durable record of how a quest actually ran. They are also far too large to
read directly — a single quest routinely exceeds 200 MB across a dozen sessions and 300 sub-agents.

This script turns them into digests an analyst (human or agent) can work from.

  python3 scripts/quest-forensics.py quest     <questId>
  python3 scripts/quest-forensics.py summary   <sessionId|agentId>
  python3 scripts/quest-forensics.py timeline  <sessionId|agentId> [--max N] [--max-chars N]
  python3 scripts/quest-forensics.py buckets   <sessionId|agentId> [--minutes N]
  python3 scripts/quest-forensics.py subagents <sessionId>
  python3 scripts/quest-forensics.py text      <sessionId|agentId> [--max-chars N]
  python3 scripts/quest-forensics.py prompts   <sessionId|agentId> [--max-chars N]
  python3 scripts/quest-forensics.py errors    <sessionId|agentId> [--max-chars N]
  python3 scripts/quest-forensics.py result    <sessionId|agentId> <toolNameRegex> [--max-chars N]
  python3 scripts/quest-forensics.py grep      <sessionId|agentId> <regex> [--ctx N]
  python3 scripts/quest-forensics.py gaps      <sessionId> [--floor-seconds N]

Targets resolve by search, so a bare id is enough — no project directory needed. A session id
matches `<id>.jsonl` in any project dir; an `agent-<id>` matches under any `subagents/` dir. Pass an
absolute path to a .jsonl to bypass resolution entirely.

`quest <questId>` prints the work-item index — role, status, session id, window, operation text —
plus ward results and the original user request. Start there; it tells you which sessions exist.
"""
import argparse
import glob
import json
import os
import re
import sys
from collections import Counter, defaultdict
from datetime import datetime, timedelta

PROJECTS_ROOT = os.path.expanduser("~/.claude/projects")


# ---------------------------------------------------------------- quest lookup


def quest_search_roots():
    """Directories that may hold a `guilds/<id>/quests/<id>/quest.json` tree.

    Repo-local homes come first: a dogfood run writes there, and a stale copy under the user-global
    home would otherwise win.
    """
    return [
        os.path.join(os.getcwd(), ".dungeonmaster"),
        os.path.join(os.getcwd(), ".dungeonmaster-dev"),
        os.environ.get("DUNGEONMASTER_HOME") or "",
        os.path.expanduser("~/.dungeonmaster"),
    ]


def find_quest(quest_id):
    for root in quest_search_roots():
        if not root:
            continue
        hits = glob.glob(os.path.join(root, "guilds", "*", "quests", quest_id, "quest.json"))
        if hits:
            return hits[0]
    return None


def encode_cwd(path):
    """Claude Code's project-dir encoding: every non-alphanumeric character becomes a dash."""
    return re.sub(r"[^A-Za-z0-9]", "-", path)


# ------------------------------------------------------------ transcript loading


def resolve(target, parent=None):
    if target.endswith(".jsonl") and os.path.isabs(target):
        return target
    if parent:
        p = os.path.join(PROJECTS_ROOT, "*", parent, "subagents", target + ".jsonl")
        hits = glob.glob(p)
        if hits:
            return hits[0]
    hits = glob.glob(os.path.join(PROJECTS_ROOT, "*", target + ".jsonl"))
    if hits:
        return sorted(hits, key=os.path.getsize)[-1]
    hits = glob.glob(os.path.join(PROJECTS_ROOT, "*", "*", "subagents", target + ".jsonl"))
    if hits:
        return sorted(hits, key=os.path.getsize)[-1]
    sys.exit(f"cannot resolve transcript for: {target}")


def load(path):
    out = []
    with open(path) as fh:
        for line in fh:
            line = line.strip()
            if not line:
                continue
            try:
                out.append(json.loads(line))
            except json.JSONDecodeError:
                pass
    return out


def ts(rec):
    t = rec.get("timestamp")
    if not t:
        return None
    return datetime.fromisoformat(t.replace("Z", "+00:00"))


def usage_of(rec):
    u = (rec.get("message") or {}).get("usage") or {}
    return (
        u.get("input_tokens", 0),
        u.get("output_tokens", 0),
        u.get("cache_read_input_tokens", 0),
        u.get("cache_creation_input_tokens", 0),
        (u.get("output_tokens_details") or {}).get("thinking_tokens", 0),
    )


def blocks(rec):
    c = (rec.get("message") or {}).get("content")
    if isinstance(c, str):
        return [{"type": "text", "text": c}]
    return c or []


def flat_text(rec):
    parts = []
    for b in blocks(rec):
        if b.get("type") == "text":
            parts.append(b.get("text", ""))
        elif b.get("type") == "thinking":
            parts.append("[thinking] " + (b.get("thinking") or "")[:4000])
    return "\n".join(parts)


def tool_brief(b, limit=160):
    name = b.get("name", "?")
    inp = b.get("input") or {}
    bits = []
    for k in ("file_path", "path", "command", "pattern", "glob", "grep", "url",
              "description", "prompt", "subagent_type", "old_string", "query",
              "agent", "questId", "workItemId", "notes", "packages", "packageName"):
        if k in inp:
            v = inp[k]
            v = json.dumps(v) if not isinstance(v, str) else v
            v = re.sub(r"\s+", " ", v)
            bits.append(f"{k}={v[:limit]}")
    if not bits:
        bits.append(re.sub(r"\s+", " ", json.dumps(inp))[:limit])
    return name, " ".join(bits)


def result_size(rec):
    tr = rec.get("toolUseResult")
    if tr is None:
        return 0
    try:
        return len(json.dumps(tr))
    except (TypeError, ValueError):
        return len(str(tr))


def head(path, recs):
    tstamps = [ts(r) for r in recs if ts(r)]
    start, end = (min(tstamps), max(tstamps)) if tstamps else (None, None)
    print(f"FILE      {path}")
    print(f"LINES     {len(recs)}")
    if start:
        print(f"START     {start.isoformat()}")
        print(f"END       {end.isoformat()}")
        print(f"WALL      {end - start}  ({(end - start).total_seconds() / 60:.1f} min)")
    return start, end


def subagents_dir(path):
    return os.path.join(path[:-6], "subagents")


# -------------------------------------------------------------------- commands


def cmd_quest(args):
    quest_path = find_quest(args.target)
    if not quest_path:
        sys.exit(f"no quest.json found for {args.target} under {quest_search_roots()}")
    quest = json.load(open(quest_path))
    print(f"QUEST FILE   {quest_path}")
    print(f"TITLE        {quest.get('title')}")
    print(f"STATUS       {quest.get('status')}  (pausedAtStatus={quest.get('pausedAtStatus')})")
    print(f"TYPE         {quest.get('questType')}")
    print(f"CREATED      {quest.get('createdAt')}")
    print(f"UPDATED      {quest.get('updatedAt')}")
    print(f"BASE         {quest.get('baseBranch')} @ {quest.get('baseRef')}")
    print(f"BRANCH       {quest.get('branchName')}")
    worktree = quest.get("worktreePath")
    print(f"WORKTREE     {worktree}")

    if worktree:
        encoded = os.path.join(PROJECTS_ROOT, encode_cwd(worktree))
        print(f"TRANSCRIPTS  {encoded}  {'(exists)' if os.path.isdir(encoded) else '(MISSING)'}")

    print("\nUSER REQUEST")
    for line in (quest.get("userRequest") or "").splitlines():
        print(f"  {line}")

    ops = {o["id"]: o for o in quest.get("operations", [])}
    print("\nWORK ITEMS")
    for i, w in enumerate(quest.get("workItems", [])):
        rel = w.get("relatedDataItems") or []
        op_ids = [r.split("/", 1)[1] for r in rel if r.startswith("operations/")]
        op = ops.get(op_ids[0]) if op_ids else None
        print(f"\n[{i}] {w['role']}  status={w['status']}  spawner={w.get('spawnerType')}")
        print(f"     workItemId  {w['id']}")
        print(f"     sessionId   {w.get('sessionId')}")
        print(f"     window      {w.get('createdAt')} -> {w.get('completedAt')}")
        if w.get("createdAt") and w.get("completedAt"):
            a = datetime.fromisoformat(w["createdAt"].replace("Z", "+00:00"))
            b = datetime.fromisoformat(w["completedAt"].replace("Z", "+00:00"))
            print(f"     wall        {(b - a).total_seconds() / 60:.1f} min")
        print(f"     attempt={w.get('attempt')} retryCount={w.get('retryCount')} "
              f"maxAttempts={w.get('maxAttempts')}")
        if op:
            print(f"     operation   {op.get('text')}")
            print(f"     flowIds={op.get('flowIds')} packageNames={op.get('packageNames')}")
        sid = w.get("sessionId")
        if sid:
            hits = glob.glob(os.path.join(PROJECTS_ROOT, "*", sid + ".jsonl"))
            if hits:
                n = len(glob.glob(os.path.join(subagents_dir(hits[0]), "*.jsonl")))
                print(f"     transcript  {os.path.getsize(hits[0]) / 1024:.0f} KB, "
                      f"{n} sub-agents")
            else:
                print("     transcript  NOT FOUND")

    for key, label in (("wardResults", "WARD RESULTS"),
                       ("riftcarverResults", "RIFTCARVER RESULTS")):
        rows = quest.get(key) or []
        if rows:
            print(f"\n{label}")
            for r in rows:
                print(f"  {json.dumps(r)}")


def cmd_summary(args):
    path = resolve(args.target, args.parent)
    recs = load(path)
    head(path, recs)
    print(f"TYPES     {dict(Counter(r.get('type') for r in recs))}")
    models = Counter((r.get("message") or {}).get("model") for r in recs
                     if r.get("type") == "assistant")
    print(f"MODELS    {dict(models)}")

    tin = tout = tcr = tcc = tth = api = 0
    for r in recs:
        if r.get("type") != "assistant":
            continue
        api += 1
        i, o, cr, cc, th = usage_of(r)
        tin, tout, tcr, tcc, tth = tin + i, tout + o, tcr + cr, tcc + cc, tth + th
    print("\nTOKENS (this transcript only, excludes sub-agents)")
    print(f"  assistant API responses : {api}")
    print(f"  input (uncached)        : {tin:,}")
    print(f"  cache_read              : {tcr:,}")
    print(f"  cache_creation          : {tcc:,}")
    print(f"  output                  : {tout:,}")
    print(f"  of which thinking       : {tth:,}")
    print(f"  TOTAL context-in        : {tin + tcr + tcc:,}")

    tools = Counter()
    for r in recs:
        for b in blocks(r):
            if b.get("type") == "tool_use":
                tools[b.get("name")] += 1
    print(f"\nTOOL CALLS ({sum(tools.values())} total)")
    for name, n in tools.most_common():
        print(f"  {n:5d}  {name}")

    total = sum(result_size(r) for r in recs
                if r.get("type") == "user" and r.get("toolUseResult") is not None)
    print(f"\nTOOL RESULT BYTES fed back: {total:,}")

    sub = subagents_dir(path)
    if os.path.isdir(sub):
        print(f"\nSUBAGENTS {len(glob.glob(os.path.join(sub, '*.jsonl')))}  "
              f"(run the `subagents` subcommand for the roster)")


def cmd_subagents(args):
    path = resolve(args.target, args.parent)
    subdir = subagents_dir(path)
    if not os.path.isdir(subdir):
        print("no subagents dir")
        return
    rows = []
    grand = defaultdict(int)
    for meta_path in sorted(glob.glob(os.path.join(subdir, "*.meta.json"))):
        aid = os.path.basename(meta_path).replace(".meta.json", "")
        meta = json.load(open(meta_path))
        jl = os.path.join(subdir, aid + ".jsonl")
        recs = load(jl) if os.path.exists(jl) else []
        tstamps = [ts(r) for r in recs if ts(r)]
        tin = tout = tcr = tcc = turns = 0
        for r in recs:
            if r.get("type") == "assistant":
                turns += 1
                i, o, cr, cc, _ = usage_of(r)
                tin, tout, tcr, tcc = tin + i, tout + o, tcr + cr, tcc + cc
        tools = Counter()
        for r in recs:
            for b in blocks(r):
                if b.get("type") == "tool_use":
                    tools[b.get("name")] += 1
        rows.append({
            "id": aid, "type": meta.get("agentType"), "model": meta.get("model"),
            "desc": meta.get("description"), "depth": meta.get("spawnDepth"),
            "start": min(tstamps) if tstamps else None,
            "end": max(tstamps) if tstamps else None,
            "turns": turns, "out": tout, "ctx": tin + tcr + tcc, "tools": tools,
        })
        grand["out"] += tout
        grand["ctx"] += tin + tcr + tcc
        grand["turns"] += turns
    rows.sort(key=lambda r: r["start"] or datetime.max.replace(tzinfo=None))
    for r in rows:
        s = r["start"].strftime("%m-%d %H:%M:%S") if r["start"] else "?"
        dur = (r["end"] - r["start"]).total_seconds() / 60 if r["start"] and r["end"] else 0
        print(f"{s}  +{dur:6.1f}m  {r['id']}  {r['type']}/{r['model']}  depth={r['depth']}  "
              f"turns={r['turns']:3d} out={r['out']:,} ctx-in={r['ctx']:,}")
        print(f"           desc: {r['desc']}")
        print(f"           tools: {dict(r['tools'])}")
    print(f"\nSUBAGENT TOTALS  agents={len(rows)} turns={grand['turns']} "
          f"output={grand['out']:,} context-in={grand['ctx']:,}")


def cmd_timeline(args):
    path = resolve(args.target, args.parent)
    recs = load(path)
    start, _ = head(path, recs)
    print("\nELAPSED  GAP    OUT    CTX-IN     EVENT")
    prev = None
    cum_out = shown = 0
    for r in recs:
        t = ts(r)
        typ = r.get("type")
        if typ == "assistant":
            i, o, cr, cc, _ = usage_of(r)
            cum_out += o
            el = (t - start).total_seconds() / 60 if t and start else 0
            gap = (t - prev).total_seconds() if t and prev else 0
            prev = t
            txt = re.sub(r"\s+", " ", flat_text(r)).strip()
            label = f'say: "{txt[:args.max_chars]}"' if txt else ""
            for b in blocks(r):
                if b.get("type") == "tool_use":
                    name, brief = tool_brief(b)
                    label += ("  " if label else "") + f"CALL {name}({brief})"
            print(f"{el:7.1f}m {gap:5.0f}s {o:6d} {i + cr + cc:9,}  {label or '(empty)'}")
            shown += 1
        elif typ == "user" and r.get("toolUseResult") is not None:
            el = (t - start).total_seconds() / 60 if t and start else 0
            sz = result_size(r)
            if sz > args.result_floor:
                print(f"{el:7.1f}m {'':5} {'':6} {'':9}  <- result {sz:,} bytes")
        elif typ == "user" and r.get("promptSource"):
            el = (t - start).total_seconds() / 60 if t and start else 0
            txt = re.sub(r"\s+", " ", flat_text(r)).strip()
            print(f"{el:7.1f}m {'':5} {'':6} {'':9}  ### INJECTED PROMPT: {txt[:600]}")
        if args.max and shown >= args.max:
            print("... truncated")
            break
    print(f"\ncumulative output tokens: {cum_out:,}")
    print("NOTE: one API response spans several records (text, thinking, each tool_use), and every")
    print("      record repeats that response's usage. Adjacent identical OUT/CTX-IN values are ONE")
    print("      response. `summary` and `buckets` count correctly; quote those as authoritative.")


def cmd_buckets(args):
    path = resolve(args.target, args.parent)
    recs = load(path)
    start, _ = head(path, recs)
    if not start:
        return
    width = timedelta(minutes=args.minutes)
    buckets = defaultdict(lambda: {"out": 0, "ctx": 0, "calls": 0, "api": 0,
                                   "tools": Counter(), "resbytes": 0})
    for r in recs:
        t = ts(r)
        if not t:
            continue
        b = buckets[int((t - start) / width)]
        if r.get("type") == "assistant":
            i, o, cr, cc, _ = usage_of(r)
            b["out"] += o
            b["ctx"] += i + cr + cc
            b["api"] += 1
            for blk in blocks(r):
                if blk.get("type") == "tool_use":
                    b["calls"] += 1
                    b["tools"][blk.get("name")] += 1
        if r.get("type") == "user" and r.get("toolUseResult") is not None:
            b["resbytes"] += result_size(r)
    print(f"\nBUCKETS of {args.minutes} min")
    print("WINDOW              APIs  CALLS   OUT-TOK    CTX-IN-TOK  RESULT-BYTES  TOP TOOLS")
    for idx in sorted(buckets):
        b = buckets[idx]
        t0 = start + idx * width
        top = ", ".join(f"{k}x{v}" for k, v in b["tools"].most_common(4))
        print(f"{t0.strftime('%m-%d %H:%M')}-{(t0 + width).strftime('%H:%M')} "
              f"{b['api']:5d} {b['calls']:6d} {b['out']:9,} {b['ctx']:13,} "
              f"{b['resbytes']:13,}  {top}")


def cmd_gaps(args):
    """Gaps between assistant turns, each labelled with the sub-agents live during it.

    This is what separates a session that is BLOCKED on a helper from one that is idle. Both look
    the same in `timeline`; only this tells you which.
    """
    path = resolve(args.target, args.parent)
    recs = load(path)
    start, end = head(path, recs)
    if not start:
        return
    subs = []
    subdir = subagents_dir(path)
    for meta_path in glob.glob(os.path.join(subdir, "*.meta.json")):
        aid = os.path.basename(meta_path).replace(".meta.json", "")
        meta = json.load(open(meta_path))
        jl = os.path.join(subdir, aid + ".jsonl")
        tstamps = [ts(r) for r in load(jl) if ts(r)] if os.path.exists(jl) else []
        if tstamps:
            subs.append((min(tstamps), max(tstamps), aid, meta.get("description")))

    turns = [ts(r) for r in recs if r.get("type") == "assistant" and ts(r)]
    total_gap = blocked = idle = 0.0
    print(f"\nGAPS >= {args.floor_seconds}s between assistant turns")
    print("AT        GAP      LIVE SUB-AGENTS")
    for a, b in zip(turns, turns[1:]):
        gap = (b - a).total_seconds()
        if gap < args.floor_seconds:
            continue
        live = [(aid, desc) for s, e, aid, desc in subs if s < b and e > a]
        total_gap += gap
        if live:
            blocked += gap
        else:
            idle += gap
        el = (a - start).total_seconds() / 60
        names = "; ".join(f"{aid} ({desc})" for aid, desc in live) or "*** NOTHING RUNNING ***"
        print(f"{el:7.1f}m {gap:7.0f}s  {names}")
    wall = (end - start).total_seconds()
    print(f"\nWALL CLOCK        {wall / 60:8.1f} min")
    print(f"IN GAPS           {total_gap / 60:8.1f} min  ({total_gap / wall * 100:.1f}%)")
    print(f"  blocked on sub  {blocked / 60:8.1f} min  ({blocked / wall * 100:.1f}%)")
    print(f"  TRUE IDLE       {idle / 60:8.1f} min  ({idle / wall * 100:.1f}%)")


def cmd_text(args):
    path = resolve(args.target, args.parent)
    recs = load(path)
    start, _ = head(path, recs)
    print()
    for r in recs:
        if r.get("type") != "assistant":
            continue
        txt = flat_text(r).strip()
        if not txt:
            continue
        t = ts(r)
        print(f"--- {(t - start).total_seconds() / 60 if t and start else 0:.1f}m ---")
        print(txt[:args.max_chars])
        print()


def cmd_prompts(args):
    path = resolve(args.target, args.parent)
    recs = load(path)
    start, _ = head(path, recs)
    print()
    for r in recs:
        if r.get("type") != "user" or r.get("toolUseResult") is not None:
            continue
        txt = flat_text(r).strip()
        if not txt:
            continue
        t = ts(r)
        el = (t - start).total_seconds() / 60 if t and start else 0
        print(f"=== user/injected @ {el:.1f}m (promptSource={r.get('promptSource')}) ===")
        print(txt[:args.max_chars])
        print()


def cmd_errors(args):
    path = resolve(args.target, args.parent)
    recs = load(path)
    start, _ = head(path, recs)
    pat = re.compile(
        r"(error|failed|failure|exception|denied|refus|timed out|timeout|"
        r"ENOENT|TS\d{4}|FAIL |✗|retry|retrying|blocked)", re.I)
    print()
    for r in recs:
        t = ts(r)
        el = (t - start).total_seconds() / 60 if t and start else 0
        if r.get("type") == "user" and r.get("toolUseResult") is not None:
            s = json.dumps(r["toolUseResult"])
            if pat.search(s[:2000]):
                print(f"--- {el:.1f}m tool-result ---")
                print(s[:args.max_chars].replace("\\n", "\n"))
                print()
        elif r.get("type") == "assistant":
            txt = flat_text(r)
            if pat.search(txt):
                print(f"--- {el:.1f}m assistant ---")
                print(txt[:args.max_chars])
                print()


def cmd_result(args):
    """Dump full tool-result payloads whose originating tool name matches <regex>.

    The usual target is `get-agent-prompt`, which recovers the exact rendered prompt an agent was
    served — the only way to compare what a prompt static SAYS against what a session was HANDED.
    """
    path = resolve(args.target, args.parent)
    recs = load(path)
    start, _ = head(path, recs)
    pat = re.compile(args.regex or ".", re.I)
    names = {}
    for r in recs:
        for b in blocks(r):
            if b.get("type") == "tool_use":
                names[b.get("id")] = b.get("name")
    print()
    for r in recs:
        if r.get("type") != "user" or r.get("toolUseResult") is None:
            continue
        tu_id = None
        for b in blocks(r):
            if b.get("type") == "tool_result":
                tu_id = b.get("tool_use_id")
        name = names.get(tu_id) or r.get("attributionMcpTool") or "?"
        if not pat.search(str(name)):
            continue
        t = ts(r)
        tr = r["toolUseResult"]
        s = tr if isinstance(tr, str) else json.dumps(tr, indent=1)
        el = (t - start).total_seconds() / 60 if t and start else 0
        print(f"===== {el:.1f}m  {name}  ({len(s):,} chars) =====")
        print(s[:args.max_chars])
        print()


def cmd_grep(args):
    path = resolve(args.target, args.parent)
    recs = load(path)
    start, _ = head(path, recs)
    pat = re.compile(args.regex, re.I)
    print()
    for r in recs:
        s = json.dumps(r)
        m = pat.search(s)
        if not m:
            continue
        t = ts(r)
        el = (t - start).total_seconds() / 60 if t and start else 0
        a = max(0, m.start() - args.ctx)
        print(f"--- {el:.1f}m {r.get('type')} ---")
        print(s[a:m.end() + args.ctx].replace("\\n", "\n"))
        print()


def main():
    p = argparse.ArgumentParser(
        description="Digest Claude Code session transcripts for quest post-mortems.")
    p.add_argument("cmd", choices=["quest", "summary", "timeline", "buckets", "subagents",
                                   "text", "prompts", "errors", "result", "grep", "gaps"])
    p.add_argument("target", help="questId, sessionId, agent-<id>, or an absolute .jsonl path")
    p.add_argument("regex", nargs="?", help="for `result` and `grep`")
    p.add_argument("--parent", help="parent sessionId, when an agent id is ambiguous")
    p.add_argument("--minutes", type=int, default=15, help="bucket width")
    p.add_argument("--max", type=int, default=0, help="timeline: stop after N assistant turns")
    p.add_argument("--max-chars", type=int, default=400, dest="max_chars")
    p.add_argument("--result-floor", type=int, default=20000, dest="result_floor",
                   help="timeline: only flag tool results above this many bytes")
    p.add_argument("--ctx", type=int, default=200, help="grep: characters of surrounding context")
    p.add_argument("--floor-seconds", type=int, default=120, dest="floor_seconds",
                   help="gaps: ignore gaps shorter than this")
    args = p.parse_args()
    globals()["cmd_" + args.cmd](args)


if __name__ == "__main__":
    main()
