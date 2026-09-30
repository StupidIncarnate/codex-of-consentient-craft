// What a standalone brand's check is made of, and how it moves into an owning contract's field (F125, bug 3).
//
// A standalone brand `xContract = z.string().min(1).refine((p) => PATTERN.test(p)).brand<'X'>()` is deleted by W1 and W5 once
// every field naming it carries the same schema inline. The check survives only if the inline copy can be written: every name
// the schema reads must be something the owning contract file can also read. `analyze` resolves each free name to an import
// (re-imported in the owner), or to a top-level declaration of the standalone file (copied into the owner, with what that
// declaration reads in turn). A name it cannot place makes the schema not inlineable, and the caller keeps the brand.
//
// `rich` separates a bare shape (`z.string()`, `.min(n)`, `.max(n)`, `.int()`) from a real check (`.regex`, `.refine`,
// `.uuid`, a transform, a named constant). A `C.parse(x)` site outside a field has no owner to hand a rich check to, so the
// caller refuses a rich brand that still has one.
const { ts } = require('./repo.cjs');

const GLOBALS = new Set(['undefined', 'NaN', 'Infinity', 'Number', 'String', 'Boolean', 'Array', 'Object', 'RegExp', 'Date', 'Math', 'JSON', 'Set', 'Map', 'Symbol', 'BigInt', 'Error', 'parseInt', 'parseFloat', 'isNaN', 'isFinite', 'encodeURIComponent', 'decodeURIComponent', 'process', 'globalThis', 'z']);
const SIMPLE_CHAIN = /\.(?:min|max|gte|lte|gt|lt)\(\s*-?\d+(?:\.\d+)?\s*\)|\.(?:int|positive|negative|nonnegative|nonpositive|finite|safe)\(\s*\)|^z\.(?:string|number)\(\s*\)/gu;

const isRichText = (baseSchema) => baseSchema.replace(/\s+/gu, '').replace(SIMPLE_CHAIN, '').length > 0;

// Names an expression or statement reads that it does not declare itself (parameters, bindings, inner declarations).
const freeNames = (root, sf) => {
  const declared = new Set();
  const declare = (name) => {
    if (ts.isIdentifier(name)) declared.add(name.text);
    else if (ts.isObjectBindingPattern(name) || ts.isArrayBindingPattern(name)) for (const e of name.elements) if (!ts.isOmittedExpression(e)) declare(e.name);
  };
  const collect = (n) => {
    if (ts.isParameter(n) || ts.isVariableDeclaration(n) || ts.isBindingElement(n)) declare(n.name);
    if ((ts.isFunctionDeclaration(n) || ts.isFunctionExpression(n) || ts.isClassDeclaration(n)) && n.name) declared.add(n.name.text);
    ts.forEachChild(n, collect);
  };
  collect(root);
  const out = new Set();
  const visit = (n) => {
    if (ts.isTypeNode(n)) return;
    if (ts.isIdentifier(n)) {
      const p = n.parent;
      const isMember = p && ((ts.isPropertyAccessExpression(p) && p.name === n) || (ts.isPropertyAssignment(p) && p.name === n) || (ts.isMethodDeclaration(p) && p.name === n) || (ts.isPropertyDeclaration(p) && p.name === n) || (ts.isBindingElement(p) && p.propertyName === n) || (ts.isParameter(p) && p.name === n) || (ts.isVariableDeclaration(p) && p.name === n) || (ts.isBindingElement(p) && p.name === n));
      if (!isMember && !declared.has(n.text) && !GLOBALS.has(n.text)) out.add(n.text);
      return;
    }
    ts.forEachChild(n, visit);
  };
  visit(root);
  return out;
};

const boundNames = (st) => {
  const out = [];
  const take = (name) => {
    if (ts.isIdentifier(name)) out.push(name.text);
    else if (ts.isObjectBindingPattern(name) || ts.isArrayBindingPattern(name)) for (const e of name.elements) if (!ts.isOmittedExpression(e)) take(e.name);
  };
  if (ts.isVariableStatement(st)) for (const d of st.declarationList.declarations) take(d.name);
  else if ((ts.isFunctionDeclaration(st) || ts.isClassDeclaration(st)) && st.name) out.push(st.name.text);
  return out;
};

// `init` is the brand declaration's initializer node in `csf`; `resolver` and `lib` resolve an import to the file declaring it.
const analyze = ({ csf, init, contractFile, resolver, lib, baseSchema }) => {
  const importOf = new Map(); // local name -> { spec, name, typeOnly, plain: boolean } for named imports
  const unsupportedImports = new Set();
  for (const st of csf.statements) {
    if (!ts.isImportDeclaration(st) || !st.importClause) continue;
    const ic = st.importClause;
    if (ic.name) unsupportedImports.add(ic.name.text);
    if (ic.namedBindings && ts.isNamespaceImport(ic.namedBindings)) unsupportedImports.add(ic.namedBindings.name.text);
    if (ic.namedBindings && ts.isNamedImports(ic.namedBindings)) for (const e of ic.namedBindings.elements) importOf.set(e.name.text, { spec: st.moduleSpecifier.text, name: (e.propertyName ?? e.name).text });
  }
  const topLevel = new Map(); // bound name -> statement
  for (const st of csf.statements) for (const n of boundNames(st)) topLevel.set(n, st);

  const importFiles = new Map();
  const locals = []; // statements to copy, dependencies first
  const seen = new Set();
  const problems = [];
  const walk = (root, depth) => {
    for (const id of freeNames(root, csf)) {
      if (importOf.has(id)) {
        const i = importOf.get(id);
        const r = resolver(i.spec, contractFile);
        const d = r && lib.findDeclaringFile(r, i.name, resolver);
        if (d) importFiles.set(id, d.file);
        else problems.push(`${id}: import '${i.spec}' does not resolve`);
      } else if (unsupportedImports.has(id)) problems.push(`${id}: default or namespace import`);
      else if (topLevel.has(id)) {
        const st = topLevel.get(id);
        if (seen.has(st)) continue;
        seen.add(st);
        if (depth >= 6) { problems.push(`${id}: declaration chain deeper than 6`); continue; }
        if (!ts.isVariableStatement(st) && !ts.isFunctionDeclaration(st)) { problems.push(`${id}: a ${ts.SyntaxKind[st.kind]} cannot be copied`); continue; }
        walk(st, depth + 1);
        locals.push({ names: boundNames(st), text: st.getText(csf).replace(/^export\s+/u, ''), start: st.getStart(csf) });
      } else problems.push(`${id}: not an import or a top-level declaration of the brand's file`);
    }
  };
  walk(init, 0);
  locals.sort((a, b) => a.start - b.start);
  return { rich: isRichText(baseSchema), importFiles, locals, problems, inlineOk: problems.length === 0, baseIds: [...importFiles.keys()] };
};

// Copies `locals` (from analyze) into `text` after its last import. A name the file already binds is fine when the text is
// the same, and a conflict otherwise: { text, conflicts }.
const addLocals = (text, abs, locals, lib) => {
  const sf = lib.parse(abs, text);
  const have = new Map();
  for (const st of sf.statements) for (const n of boundNames(st)) have.set(n, st.getText(sf).replace(/^export\s+/u, '').replace(/\s+/gu, ' '));
  const conflicts = [];
  const add = [];
  for (const l of locals) {
    const norm = l.text.replace(/\s+/gu, ' ');
    const clash = l.names.filter((n) => have.has(n));
    if (!clash.length) { add.push(l.text); continue; }
    if (clash.every((n) => have.get(n) === norm)) continue;
    conflicts.push(`${l.names.join(', ')}: the file already declares a different ${clash[0]}`);
  }
  if (!add.length || conflicts.length) return { text, conflicts };
  const last = [...sf.statements].filter(ts.isImportDeclaration).pop();
  const at = last ? last.end : 0;
  const block = `${last ? '\n\n' : ''}${add.join('\n')}${last ? '' : '\n\n'}`;
  return { text: text.slice(0, at) + block + text.slice(at), conflicts };
};

module.exports = { analyze, addLocals, isRichText, freeNames };
