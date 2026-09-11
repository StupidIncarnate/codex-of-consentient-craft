"""
Runs ward over every file in the repo in batches, and writes what each batch found to disk THE
MOMENT it finds it.

WHY BATCHES AND NOT ONE FULL RUN. A file-scoped ward run takes jest's IN-BAND branch, which carries
`--detectOpenHandles` — so it sees sockets, child processes and file watchers, not only the timers a
worker run can catch. A full run cannot have that: `shouldRunInBand` in @jest/core reads
`if (runInBand || detectOpenHandles) return true`, so asking for it single-threads the whole repo.
Batching is what makes that detection affordable.

WHAT THIS SWEEP DOES NOT SEE, AND WHY A FULL RUN IS STILL OWED. The two detectors are not one
strictly stronger than the other, and running only this one hides a whole class. Jest's own
collector waits about 30ms plus a garbage-collection cycle before it looks, so a fast-firing
`setImmediate` settles on its own and is never reported. `@dungeonmaster/testing`'s timer watcher —
the WORKER-branch detector, which this sweep never reaches — checks at each test file's own
teardown with no grace period, and catches exactly those. Measured: the mock child process in
`child-process-spawn-stream-json-adapter.proxy.ts` armed 18 un-cleared immediates that every batch
here reported clean and that one `--only unit` run over the package reported in full. So triage the
sweep AND a whole-check run of each type; neither alone is the answer.

WHY EVERY RECORD CARRIES THE WHOLE COMMAND. A finding is only worth anything if it can be re-run,
and a batch's identity IS its file list — forty paths that no summary line repeats. Each record
stores the exact argv, so a triage agent re-runs one string and sees the same thing.

WHY IT ALSO RUNS `ward detail`. The run summary truncates a test failure to its FIRST LINE, so a
`toStrictEqual` diff never appears there. `ward detail <runId>` prints the whole thing, plus the
files the run never reached. Every sad job gets one, saved whole next to its log.

WHY THE FINDINGS ARE APPENDED, NOT COLLECTED. The sweep runs for the better part of an hour. A run
killed at minute fifty must not lose the forty-nine minutes of defects it already found, so every
job appends its own result before the next one starts, and `report.md` is written as it goes rather
than from anything held in memory.

WHY E2E BATCHES ARE FIVE. Each e2e batch boots an API server, a Vite server and a browser, so a
batch of forty would hold three servers open for minutes and time out on the slowest spec. Ward
isolates each run's ports and report path, so several may still run at once — its own docs put the
sensible cap at four.

  python3 scrolls/tools/ward-sweep.py <out-dir> [--batch 40] [--e2e-batch 5]
                                      [--jobs 4] [--e2e-jobs 2]
                                      [--packages a,b] [--only-kinds batch,e2e,typecheck]
"""
import argparse, json, os, re, subprocess, sys, threading, time
from concurrent.futures import ThreadPoolExecutor

REPO = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
# What ward's lint check discovers, from checkCommandsStatics.lint.discoverPatterns.
EXTS = ('.ts', '.tsx', '.js', '.jsx')
ROOTS = ('src', 'bin', 'test')
SKIP_DIRS = {'node_modules', 'dist', 'coverage', 'test-results', '.ward'}
E2E_SUFFIX = '.e2e.ts'
# How much of `ward detail` goes inline in report.md. The whole thing is always on disk beside it;
# one truncated jest diff can run to two hundred lines of jest-circus frames.
DETAIL_LINES_INLINE = 120

WRITE_LOCK = threading.Lock()
ANSI = re.compile(r'\x1b\[[0-9;]*[A-Za-z]')
SECTION = re.compile(r'^--- (.+?) ---$')
# Ward prints its run-level verdicts AFTER the last `--- section ---` and with no header of their
# own, so without this they were swallowed into whichever section happened to be open last.
SECTION_END = re.compile(r'^([A-Z][A-Z ]{5,}|Full error details:.*)$')
SUMMARY = re.compile(r'^(lint|typecheck|unit|integration|e2e|run):')
RUN_ID = re.compile(r'^run:\s+(\S+)')
# Ward's own words for a scope it could not honour. Exit code alone misses these: a run that
# processed nothing still exits 0 unless the caller typed the paths.
ALARM_LINES = ('DISCOVERY MISMATCH', 'NO CHECKS RAN', 'NO CHECK PROCESSED')


def packages():
    base = os.path.join(REPO, 'packages')
    return sorted(n for n in os.listdir(base) if os.path.isdir(os.path.join(base, n, 'src')))


def walk_package(pkg):
    for root_name in ROOTS:
        root = os.path.join(REPO, 'packages', pkg, root_name)
        if not os.path.isdir(root):
            continue
        for dirpath, dirnames, filenames in os.walk(root):
            dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
            for name in filenames:
                if name.endswith(EXTS):
                    yield os.path.relpath(os.path.join(dirpath, name), REPO)


def files_for(pkg):
    """Everything lint and the jest checks grade. E2e specs are handled separately at their own
    batch size, so they are excluded here rather than counted twice."""
    return sorted(p for p in walk_package(pkg) if not p.endswith(E2E_SUFFIX))


def e2e_files_for(pkg):
    return sorted(p for p in walk_package(pkg) if p.endswith(E2E_SUFFIX))


def chunk(items, size):
    return [items[i:i + size] for i in range(0, len(items), size)]


def build_jobs(args, wanted):
    jobs = []
    if 'typecheck' in args.only_kinds:
        for pkg in wanted:
            jobs.append({'id': f'typecheck-{pkg}', 'package': pkg, 'kind': 'typecheck',
                         'args': ['--only', 'typecheck', '--', f'packages/{pkg}'], 'files': []})
    if 'batch' in args.only_kinds:
        for pkg in wanted:
            for index, files in enumerate(chunk(files_for(pkg), args.batch)):
                jobs.append({'id': f'{pkg}-{index:04d}', 'package': pkg, 'kind': 'batch',
                             'args': ['--only', 'lint,unit,integration', '--'] + files,
                             'files': files})
    if 'e2e' in args.only_kinds:
        for pkg in wanted:
            for index, files in enumerate(chunk(e2e_files_for(pkg), args.e2e_batch)):
                jobs.append({'id': f'{pkg}-e2e-{index:04d}', 'package': pkg, 'kind': 'e2e',
                             'args': ['--only', 'e2e', '--'] + files, 'files': files})
    return jobs


def command_string(ward_args):
    return ' '.join(['npm', 'run', 'ward', '--'] + ward_args)


def run_ward(ward_args, log_path):
    with open(log_path, 'w') as log:
        proc = subprocess.run(['npm', 'run', 'ward', '--'] + ward_args,
                              cwd=REPO, stdout=log, stderr=subprocess.STDOUT)
    return proc.returncode


def clean_lines(path):
    text = open(path, errors='replace').read()
    # Ward redraws progress with \r and ANSI colour; keep only what survived the redraw.
    return ANSI.sub('', text).replace('\r', '\n').split('\n')


def parse_log(path):
    """Splits a ward log into its run id, its summary lines and its `--- <name> ---` sections."""
    lines = clean_lines(path)
    summary = [l.strip() for l in lines if SUMMARY.match(l.strip())]
    run_ids = [m.group(1) for l in lines for m in [RUN_ID.match(l.strip())] if m]
    sections, current = {}, None
    for line in lines:
        hit = SECTION.match(line.strip())
        if hit:
            current = hit.group(1)
            sections.setdefault(current, [])
            continue
        if current is not None and SECTION_END.match(line.strip()):
            current = None
            continue
        if current is not None and line.strip():
            sections[current].append(line.rstrip())
    alarms = sorted({a for a in ALARM_LINES for l in lines if a in l})
    return {'runId': run_ids[0] if run_ids else None, 'summary': summary,
            'sections': sections, 'alarms': alarms}


def verdict(job):
    """What makes a job SAD. Exit code alone is not enough: slow files and open handles are
    reported, never failed, so a run full of both still exits 0."""
    parsed = job['parsed']
    reasons = []
    if job['exitCode'] != 0:
        reasons.append('exit')
    for name in parsed['sections']:
        if name.startswith('open handles'):
            reasons.append('open-handles')
        elif name.startswith('slow files'):
            reasons.append('slow-files')
        else:
            reasons.append(f'errors:{name}')
    if parsed['alarms']:
        reasons.append('alarm')
    return sorted(set(reasons))


def append_text(path, text):
    with WRITE_LOCK:
        with open(path, 'a') as out:
            out.write(text)


def render(record):
    lines = [
        f"## {record['id']}  ({record['kind']}, {record['package']})",
        '',
        f"**exit {record['exitCode']}** after {record['seconds']}s — {', '.join(record['reasons'])}",
        f"run id: `{record['parsed']['runId']}`   files in batch: {len(record['files'])}",
        '',
        'Command:',
        '',
        '```bash',
        record['command'],
        '```',
        '',
        'Summary and sections:',
        '',
        '```',
    ]
    lines += record['parsed']['summary']
    for name, body in record['parsed']['sections'].items():
        lines += ['', f'--- {name} ---'] + body
    if record['parsed']['alarms']:
        lines += ['', 'alarms: ' + ', '.join(record['parsed']['alarms'])]
    lines += ['```', '']

    detail = record.get('detail') or []
    if detail:
        shown = detail[:DETAIL_LINES_INLINE]
        lines += [f"`ward detail {record['parsed']['runId']}` "
                  f"(full output: `{record['detailLog']}`):", '', '```']
        lines += shown
        if len(detail) > DETAIL_LINES_INLINE:
            lines.append(f'... {len(detail) - DETAIL_LINES_INLINE} more lines in {record["detailLog"]}')
        lines += ['```', '']
    lines.append('---')
    lines.append('')
    return '\n'.join(lines)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('out')
    ap.add_argument('--batch', type=int, default=40)
    ap.add_argument('--e2e-batch', type=int, default=5)
    ap.add_argument('--jobs', type=int, default=4)
    ap.add_argument('--e2e-jobs', type=int, default=2)
    ap.add_argument('--packages', default='')
    ap.add_argument('--only-kinds', default='typecheck,batch,e2e')
    # For proving the sweep itself catches a defect: run the first N jobs only, so ONE e2e batch can
    # be exercised without booting twenty-three servers to find out.
    ap.add_argument('--limit', type=int, default=0)
    args = ap.parse_args()
    args.only_kinds = {k.strip() for k in args.only_kinds.split(',') if k.strip()}

    logs = os.path.join(args.out, 'logs')
    os.makedirs(logs, exist_ok=True)
    findings_path = os.path.join(args.out, 'findings.jsonl')
    progress_path = os.path.join(args.out, 'progress.jsonl')
    report_path = os.path.join(args.out, 'report.md')

    wanted = [p.strip() for p in args.packages.split(',') if p.strip()] or packages()
    jobs = build_jobs(args, wanted)
    if args.limit:
        jobs = jobs[: args.limit]
    fast = [j for j in jobs if j['kind'] != 'e2e']
    slow = [j for j in jobs if j['kind'] == 'e2e']

    append_text(report_path, f'# ward sweep\n\n{len(jobs)} jobs across {len(wanted)} packages, '
                             f'batch {args.batch} / e2e {args.e2e_batch}\n\n')
    print(f'{len(jobs)} jobs ({len(fast)} non-e2e at {args.jobs}, {len(slow)} e2e at '
          f'{args.e2e_jobs}) across {len(wanted)} packages', flush=True)
    done = [0]

    def work(job):
        log_path = os.path.join(logs, f'{job["id"]}.log')
        job['command'] = command_string(job['args'])
        started = time.time()
        job['exitCode'] = run_ward(job['args'], log_path)
        job['seconds'] = round(time.time() - started, 1)
        job['log'] = os.path.relpath(log_path, args.out)
        job['parsed'] = parse_log(log_path)
        job['reasons'] = verdict(job)

        # The summary truncates a test failure to its first line, so the diff that says WHY only
        # exists here. Asked for once per sad job, never for a clean one.
        if job['reasons'] and job['parsed']['runId']:
            detail_path = os.path.join(logs, f'{job["id"]}.detail.log')
            job['detailExitCode'] = run_ward(['detail', job['parsed']['runId']], detail_path)
            job['detailLog'] = os.path.relpath(detail_path, args.out)
            job['detail'] = [l.rstrip() for l in clean_lines(detail_path) if l.strip()]
            job['detailCommand'] = command_string(['detail', job['parsed']['runId']])

        # WRITTEN NOW, before the next job starts. A sweep killed at minute fifty keeps everything
        # the first forty-nine found.
        append_text(progress_path, json.dumps({
            'id': job['id'], 'package': job['package'], 'kind': job['kind'],
            'command': job['command'], 'exitCode': job['exitCode'],
            'seconds': job['seconds'], 'reasons': job['reasons'],
            'runId': job['parsed']['runId'],
        }) + '\n')
        if job['reasons']:
            append_text(findings_path, json.dumps(job) + '\n')
            append_text(report_path, render(job) + '\n')

        done[0] += 1
        mark = ' '.join(job['reasons']) or 'clean'
        print(f'  [{done[0]}/{len(jobs)}] {job["id"]} exit {job["exitCode"]} '
              f'{job["seconds"]}s {mark}', flush=True)
        return job

    results = []
    for group, workers in ((fast, args.jobs), (slow, args.e2e_jobs)):
        if not group:
            continue
        with ThreadPoolExecutor(max_workers=workers) as pool:
            results += list(pool.map(work, group))

    sad = [j for j in results if j['reasons']]
    counts = {}
    for job in sad:
        for reason in job['reasons']:
            counts[reason] = counts.get(reason, 0) + 1
    print(f'\n{len(sad)} of {len(results)} jobs had something to report')
    for reason, count in sorted(counts.items(), key=lambda kv: -kv[1]):
        print(f'  {reason}: {count}')
    print(f'findings: {findings_path}\nreport:   {report_path}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
