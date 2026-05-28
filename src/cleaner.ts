export interface CleanLevel {
 name: string;
 desc: string;
 removeComments: boolean;
 removeIndent: boolean;
 removeBlankLines: boolean;
 fixOperators: boolean;
 collapseAll: boolean;
 removeEmojis: boolean;
}
export const LEVELS: CleanLevel[] = [
 {
 name: "readable",
 desc: "Removes blank lines and normalises operator spacing while keeping comments and indentation intact.",
 removeComments: false, removeIndent: false, removeBlankLines: true, fixOperators: true, collapseAll: false, removeEmojis: true
 },
 {
 name: "compact",
 desc: "Strips comments and blank lines, normalises spacing and preserves indentation.",
 removeComments: true, removeIndent: false, removeBlankLines: true, fixOperators: true, collapseAll: false, removeEmojis: true
 },
 {
 name: "minified",
 desc: "Removes comments, blank lines and indentation entirely while retaining minimal whitespace.",
 removeComments: true, removeIndent: true, removeBlankLines: true, fixOperators: true, collapseAll: false, removeEmojis: true
 },
 {
 name: "nuclear",
 desc: "Smallest possible code, with no comments, blank lines, indentation or unnecessary whitespace.",
 removeComments: true, removeIndent: true, removeBlankLines: true, fixOperators: true, collapseAll: true, removeEmojis: true
 }
];
const INDENT_SENSITIVE = new Set(['python', 'yaml', 'sh', 'makefile']);
const NEWLINE_SENSITIVE = new Set(['python', 'yaml', 'sh', 'makefile', 'sql']);
const NO_OP_FIX = new Set(['html', 'css', 'yaml', 'json', 'sql', 'sh', 'lua']);
export const LANG_NAMES: { [key: string]: string } = {
 python: 'javascript', js: 'javascript', ts: 'typescript', css: 'css', html: 'html',
 java: 'java', kotlin: 'kotlin', c: 'c/c++', rust: 'rust', go: 'go',
 ruby: 'ruby', php: 'php', swift: 'swift', sh: 'shell/bash',
 sql: 'sql', yaml: 'yaml', json: 'json', lua: 'lua', dart: 'dart', scala: 'scala', text: 'text'
};
export function mapVsCodeLang(vsLangId: string): string {
 const maps: { [key: string]: string } = {
 'javascript': 'js', 'typescript': 'ts', 'javascriptreact': 'js', 'typescriptreact': 'ts',
 'python': 'python', 'css': 'css', 'html': 'html', 'java': 'java', 'kotlin': 'kotlin',
 'c': 'c', 'cpp': 'c', 'rust': 'rust', 'go': 'go', 'ruby': 'ruby', 'php': 'php',
 'swift': 'swift', 'shellscript': 'sh', 'sql': 'sql', 'yaml': 'yaml', 'json': 'json',
 'jsonc': 'json', 'lua': 'lua', 'dart': 'dart', 'scala': 'scala'
 };
 return maps[vsLangId] || 'text';
}
export function detectLang(code: string): string {
 if (!code.trim()) return 'text';
 const s: { [key: string]: number } = {
 python:0, js:0, ts:0, css:0, html:0, java:0, kotlin:0,
 c:0, rust:0, go:0, ruby:0, php:0, swift:0,
 sh:0, sql:0, yaml:0, json:0, lua:0, dart:0, scala:0
 };
 if (/def\s+\w+\s*\(|from\s+\w+\s+import|print\s*\(/.test(code)) s.python += 3;
 if (new RegExp('elif\\s+|lambda\\s+|__name__|\\.format\\(|f[\'"]|^\\s*@\\w+', 'm').test(code)) s.python += 2;
 if (/:\s*$|^\s{4}/m.test(code) && /def |class |if |for |while /.test(code)) s.python += 1;
 if (/: \s*(string|number|boolean|void|any|never|unknown)\b|interface\s+\w+|type\s+\w+\s* = |as\s+\w+/.test(code)) s.ts += 4;
 if (/enum\s+\w+|readonly\s+|implements\s+\w+|declare\s+/.test(code)) s.ts += 3;
 if (/function\s+\w+|const\s+|let\s+|var\s+|=>\s*{|require\(|console\.log/.test(code)) s.js += 3;
 if (/document\.|window\.|async\s+function|\.then\(|Promise\./.test(code)) s.js += 2;
 if (/@media|@keyframes|\.\[\w-\]+\s*\{|#[\w-]+\s*\{/.test(code)) s.css += 4;
 if (new RegExp(':\\s*[\\w#"\'.]+\\s*;').test(code)) s.css += 2;
 if (/<html|<div|<span|<body|<head|<!DOCTYPE/i.test(code)) s.html += 4;
 if (/<\/\w+>/.test(code)) s.html += 2;
 if (/public\s+(static\s+)?(?:void|class|int|String)|System\.out|import\s+java\./.test(code)) s.java += 4;
 if (/@Override|@SuppressWarnings|extends\s+\w+/.test(code)) s.java += 2;
 if (/fun\s+\w+\s*\(|val\s+\w+|println\(|data\s+class|object\s+\w+/.test(code)) s.kotlin += 4;
 if (/companion\s+object|suspend\s+fun|when\s*\(|\.let\s*\{/.test(code)) s.kotlin += 3;
 if (/#include\s+<|printf\s*\(|int\s+main\s*\(/.test(code)) s.c += 4;
 if (/std::|cout\s*<<|cin\s*>>|nullptr/.test(code)) s.c += 2;
 if (/fn\s+\w+|let\s+mut\s|impl\s+\w+|use\s+std::|println!/.test(code)) s.rust += 4;
 if (/match\s+\w+|Some\(|None\b|Result<|unwrap\(\)/.test(code)) s.rust += 3;
 if (/func\s+\w+.*\{|package\s+main|fmt\.Println|: = \s/.test(code)) s.go += 4;
 if (/goroutine|chan\s+\w+|defer\s+/.test(code)) s.go += 2;
 if (/def\s+\w+|puts\s+|^\s*end\s*$|\.each\s*\{|attr_accessor/m.test(code)) s.ruby += 3;
 if (new RegExp('do\\s*\\|.*\\||require\\s+\'|gem\\s+\'|\\.map\\s*\\{').test(code)) s.ruby += 2;
 if (/<\?php|\$\w+\s* = |echo\s+/.test(code)) s.php += 4;
 if (/->\s*\w+\(|array\s*\(|\$_GET|\$_POST/.test(code)) s.php += 2;
 if (/func\s+\w+.*->|UIViewController|@IBOutlet|@IBAction/.test(code)) s.swift += 4;
 if (/guard\s+let|if\s+let|@State|@Binding/.test(code)) s.swift += 3;
 if (/\$\{?\w+\}?|fi\b|done\b|then\b/.test(code)) s.sh += 3;
 if (/^#!\/bin\/(bash|sh|zsh)/m.test(code)) s.sh += 5;
 if (/SELECT\s+.+FROM|INSERT\s+INTO|CREATE\s+TABLE|DROP\s+TABLE/i.test(code)) s.sql += 5;
 if (/WHERE\s+|GROUP\s+BY|ORDER\s+BY|JOIN\s+/i.test(code)) s.sql += 2;
 if (/^[\w-]+:\s*$/m.test(code) && /^\s+-\s+\w+/m.test(code)) s.yaml += 4;
 if (/^---\s*$/m.test(code) || /^\s{2, }\w+:\s+\S/m.test(code)) s.yaml += 3;
 if (/^\s*[\[{]/.test(code.trim()) && /"\w+":\s*("?[\d\[{]|true|false|null)/.test(code)) s.json += 5;
 if (/function\s+\w+\s*\(|local\s+\w+\s* = |then\b|end\b/.test(code)) s.lua += 3;
 if (/--.*$|ipairs\(|pairs\(|\.\./m.test(code)) s.lua += 2;
 if (new RegExp('void\\s+main\\s*\\(|import\\s+\'package:|Widget\\s+build|StatelessWidget').test(code)) s.dart += 4;
 if (/final\s+\w+|List<|Map<|Future</.test(code) && s.dart > 0) s.dart += 2;
 if (/def\s+\w+.*:\s*\w+\s* = |object\s+\w+\s+extends|case\s+class/.test(code)) s.scala += 4;
 if (/println\(|List\(|Some\(|None\b/.test(code) && s.scala > 2) s.scala += 2;
 let best = 'text';
 let top = 0;
 for (const [l, v] of Object.entries(s)) {
 if (v > top) {
 top = v;
 best = l;
 }
 }
 return top > 0 ? best : 'text';
}
interface Segment {
 type: 'code' | 'string' | 'comment';
 value: string;
}

function tokenize(code: string, lang: string): Segment[] {
 let quotes: string[] = ['"', "'"];
 let lineComments: string[] = [];
 let blockComments: [string, string][] = [];

 if (lang === 'python') {
  quotes = ['"""', "'''", '"', "'"];
  lineComments = ['#'];
 } else if (['js', 'ts', 'java', 'kotlin', 'c', 'rust', 'go', 'swift', 'dart', 'scala', 'php', 'json'].includes(lang)) {
  quotes = ['"', "'"];
  if (['js', 'ts'].includes(lang)) {
   quotes = ['"', "'", '`'];
  }
  lineComments = ['//'];
  blockComments = [['/*', '*/']];
  if (lang === 'php') {
   lineComments = ['//', '#'];
  }
 } else if (['sh', 'ruby', 'yaml'].includes(lang)) {
  lineComments = ['#'];
  quotes = ['"', "'"];
 } else if (lang === 'html') {
  blockComments = [['<!--', '-->']];
 } else if (lang === 'css') {
  blockComments = [['/*', '*/']];
 } else if (lang === 'lua') {
  lineComments = ['--'];
  blockComments = [['--[[', ']]']];
  quotes = ['"', "'"];
 } else if (lang === 'sql') {
  lineComments = ['--'];
  blockComments = [['/*', '*/']];
  quotes = ["'"];
 } else {
  quotes = ['"', "'"];
 }

 quotes.sort((a, b) => b.length - a.length);
 lineComments.sort((a, b) => b.length - a.length);
 blockComments.sort((a, b) => b[0].length - a[0].length);

 const segments: Segment[] = [];
 let i = 0;
 let currentCodeStart = 0;

 const flushCode = (endIndex: number) => {
  if (endIndex > currentCodeStart) {
   const value = code.substring(currentCodeStart, endIndex);
   if (value) {
    segments.push({ type: 'code', value });
   }
  }
  currentCodeStart = endIndex;
 };

 const stateStack: any[] = [{ type: 'code' }];

 while (i < code.length) {
  const state = stateStack[stateStack.length - 1];

  if (state.type === 'code' || state.type === 'template_expr') {
   if (state.type === 'template_expr') {
    if (code[i] === '{') {
     state.braceDepth++;
     i++;
     continue;
    }
    if (code[i] === '}') {
     state.braceDepth--;
     if (state.braceDepth === 0) {
      flushCode(i);
      stateStack.pop();
      currentCodeStart = i; // Process '}' in the string state
      continue;
     }
     i++;
     continue;
    }
   }

   // Check block comments
   let matchedBlock: [string, string] | null = null;
   for (const bc of blockComments) {
    if (code.startsWith(bc[0], i)) {
     matchedBlock = bc;
     break;
    }
   }
   if (matchedBlock) {
    flushCode(i);
    if (['swift', 'kotlin', 'rust', 'scala'].includes(lang)) {
     stateStack.push({ type: 'block_comment', opener: matchedBlock[0], closer: matchedBlock[1], depth: 1, start: i });
    } else {
     stateStack.push({ type: 'block_comment', opener: matchedBlock[0], closer: matchedBlock[1], start: i });
    }
    i += matchedBlock[0].length;
    continue;
   }

   // Check line comments
   let matchedLineComment: string | null = null;
   for (const lc of lineComments) {
    if (lang === 'sh' && lc === '#' && i === 0 && code.startsWith('#!')) {
     continue;
    }
    if (code.startsWith(lc, i)) {
     matchedLineComment = lc;
     break;
    }
   }
   if (matchedLineComment) {
    flushCode(i);
    stateStack.push({ type: 'line_comment', opener: matchedLineComment, start: i });
    i += matchedLineComment.length;
    continue;
   }

   // Check JS/TS Regex literal
   if (['js', 'ts'].includes(lang) && code[i] === '/' && code[i+1] !== '/' && code[i+1] !== '*') {
    let k = i - 1;
    while (k >= 0 && /\s/.test(code[k])) {
     k--;
    }
    const isRegex = k < 0 || "=+-%&|^!?:,;<>([]{}=~".includes(code[k]) || (/[a-zA-Z]/.test(code[k]) && (() => {
     let wordStart = k;
     while (wordStart >= 0 && /[a-zA-Z0-9_$]/.test(code[wordStart])) {
      wordStart--;
     }
     const word = code.substring(wordStart + 1, k + 1);
     const regexKeywords = ['return', 'throw', 'yield', 'typeof', 'delete', 'void', 'in', 'instanceof', 'new', 'default', 'case'];
     return regexKeywords.includes(word);
    })());
    if (isRegex) {
     flushCode(i);
     stateStack.push({ type: 'regex', start: i });
     i++;
     continue;
    }
   }

   // Check string delimiter
   let matchedQuote: string | null = null;
   for (const q of quotes) {
    if (lang === 'rust' && q === "'") {
     const sub = code.substring(i);
     const charMatch = sub.match(/^'([^'\\]|\\.)'/);
     const unicodeCharMatch = sub.match(/^'\\u\{[0-9a-fA-F]{1,6}\}'/);
     if (!charMatch && !unicodeCharMatch) {
      continue;
     }
    }
    if (lang === 'c' && q === "'") {
     const prevChar = i > 0 ? code[i - 1] : '';
     const nextChar = i + 1 < code.length ? code[i + 1] : '';
     const isDigit = (c: string) => /[0-9a-fA-F]/.test(c);
     if (isDigit(prevChar) && isDigit(nextChar)) {
      continue;
     }
    }
    if (code.startsWith(q, i)) {
     matchedQuote = q;
     break;
    }
   }
   if (matchedQuote) {
    flushCode(i);
    stateStack.push({ type: 'string', delimiter: matchedQuote, start: i });
    i += matchedQuote.length;
    continue;
   }

   i++;
  } else if (state.type === 'block_comment') {
   if (state.depth !== undefined) {
    if (code.startsWith(state.opener, i)) {
     state.depth++;
     i += state.opener.length;
     continue;
    }
    if (code.startsWith(state.closer, i)) {
     state.depth--;
     i += state.closer.length;
     if (state.depth === 0) {
      segments.push({ type: 'comment', value: code.substring(state.start, i) });
      stateStack.pop();
      currentCodeStart = i;
     }
     continue;
    }
   } else {
    if (code.startsWith(state.closer, i)) {
     i += state.closer.length;
     segments.push({ type: 'comment', value: code.substring(state.start, i) });
     stateStack.pop();
     currentCodeStart = i;
     continue;
    }
   }
   i++;
  } else if (state.type === 'line_comment') {
   if (code[i] === '\n') {
    segments.push({ type: 'comment', value: code.substring(state.start, i) });
    stateStack.pop();
    currentCodeStart = i;
    continue;
   }
   i++;
  } else if (state.type === 'regex') {
   if (code[i] === '\\') {
    i += 2;
    continue;
   }
   if (code[i] === '/') {
    i++;
    while (i < code.length && /[a-z]/i.test(code[i])) {
     i++;
    }
    segments.push({ type: 'string', value: code.substring(state.start, i) });
    stateStack.pop();
    currentCodeStart = i;
    continue;
   }
   i++;
  } else if (state.type === 'string') {
   if (lang === 'sql' && state.delimiter === "'") {
    if (code[i] === "'" && code[i+1] === "'") {
     i += 2;
     continue;
    }
   }
   if (code[i] === '\\') {
    i += 2;
    continue;
   }
   if (code.startsWith(state.delimiter, i)) {
    i += state.delimiter.length;
    segments.push({ type: 'string', value: code.substring(state.start, i) });
    stateStack.pop();
    currentCodeStart = i;
    continue;
   }
   if (['js', 'ts'].includes(lang) && state.delimiter === '`' && code.startsWith('${', i)) {
    segments.push({ type: 'string', value: code.substring(state.start, i + 2) });
    stateStack.push({ type: 'template_expr', braceDepth: 1, start: i + 2 });
    i += 2;
    currentCodeStart = i;
    continue;
   }
   i++;
  }
 }

 if (i > currentCodeStart) {
  const state = stateStack[stateStack.length - 1];
  const type = (state.type === 'block_comment' || state.type === 'line_comment') ? 'comment' :
               (state.type === 'string' || state.type === 'regex') ? 'string' : 'code';
  segments.push({ type, value: code.substring(currentCodeStart, i) });
 }

 return segments;
}

function fixOps(line: string, lang: string): string {
 if (NO_OP_FIX.has(lang)) return line;
 const match = line.match(/^(\s*)(.*)$/);
 if (!match) return line;
 const indent = match[1];
 const content = match[2];
 
 let fixedContent = content;
 if (lang === 'python') {
  fixedContent = fixedContent.replace(/, ([^\s\n])/g, ', $1').replace(/[ \t]+/g, ' ');
 } else if (['ruby', 'rust', 'go', 'swift', 'kotlin', 'scala', 'dart', 'c', 'php', 'js', 'ts', 'java'].includes(lang)) {
  fixedContent = fixedContent.replace(/([^ \t\r\n+\-*/%&|^<>!=?~:]\s*)=\s*([^=>\s])/g, '$1 = $2').replace(/, ([^\s\n])/g, ', $1').replace(/[ \t]+/g, ' ');
 } else {
  fixedContent = fixedContent.replace(/, ([^\s\n])/g, ', $1').replace(/[ \t]+/g, ' ');
 }
 return indent + fixedContent;
}

export function getWarning(lang: string, level: CleanLevel): string | null {
 if (INDENT_SENSITIVE.has(lang) && (level.removeIndent || level.collapseAll)) {
 return `${LANG_NAMES[lang] || lang.toUpperCase()} uses indentation as syntax — removing it will break your code!`;
 }
 if (NEWLINE_SENSITIVE.has(lang) && level.collapseAll) {
 return `${LANG_NAMES[lang] || lang.toUpperCase()} is newline-sensitive — collapsing to one line will break your code!`;
 }
 return null;
}

export function cleanCode(code: string, level: CleanLevel, lang: string, removeEmojisOverride?: boolean): string {
 let result = code;
 const removeEmojis = removeEmojisOverride ?? level.removeEmojis;
 if (removeEmojis) {
  result = result.replace(/(?![©®™])[\p{Extended_Pictographic}\u{1F3FB}-\u{1F3FF}\u{1F1E6}-\u{1F1FF}\u{200d}\u{fe0f}]/gu, '');
 }

 const segments = tokenize(result, lang);
 const stringPlaceholders: string[] = [];
 let cleanWithPlaceholders = '';

 for (const seg of segments) {
  if (seg.type === 'comment') {
   if (!level.removeComments) {
    cleanWithPlaceholders += seg.value;
   } else if (lang === 'sh' && seg.value.startsWith('#!')) {
    cleanWithPlaceholders += seg.value;
   }
  } else if (seg.type === 'string') {
   const placeholder = `___CLEANER_STR_TOKEN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${stringPlaceholders.length}___`;
   stringPlaceholders.push(seg.value);
   cleanWithPlaceholders += placeholder;
  } else {
   cleanWithPlaceholders += seg.value;
  }
 }

 let lines = cleanWithPlaceholders.split('\n');
 const shouldRemoveIndent = level.removeIndent && !INDENT_SENSITIVE.has(lang);
 lines = lines.map(l => (shouldRemoveIndent ? l.trimStart() : l).trimEnd());

 if (level.removeBlankLines) {
  lines = lines.filter(l => l.trim() !== '');
 }

 if (level.fixOperators) {
  lines = lines.map(l => fixOps(l, lang));
 }

 const shouldCollapse = level.collapseAll && !NEWLINE_SENSITIVE.has(lang);
 let cleanedText = lines.join(shouldCollapse ? ' ' : '\n');
 if (shouldCollapse) {
  cleanedText = cleanedText.replace(/\s+/g, ' ').trim();
 }

 for (let i = 0; i < stringPlaceholders.length; i++) {
  const regex = new RegExp(`___CLEANER_STR_TOKEN_[0-9]+_[a-z0-9]+_${i}___`, 'g');
  cleanedText = cleanedText.replace(regex, () => stringPlaceholders[i]);
 }

 return cleanedText;
}
export function getLangFromFilename(filename: string): string | null {
 const ext = filename.split('.').pop()?.toLowerCase();
 if (!ext) return null;
 const extMap: { [key: string]: string } = {
 'js': 'js', 'jsx': 'js', 'mjs': 'js', 'cjs': 'js',
 'ts': 'ts', 'tsx': 'ts', 'mts': 'ts', 'cts': 'ts',
 'py': 'python', 'pyw': 'python',
 'css': 'css',
 'html': 'html', 'htm': 'html',
 'java': 'java',
 'kt': 'kotlin', 'ktm': 'kotlin', 'kts': 'kotlin',
 'c': 'c', 'cpp': 'c', 'cc': 'c', 'cxx': 'c', 'h': 'c', 'hpp': 'c',
 'rs': 'rust',
 'go': 'go',
 'rb': 'ruby',
 'php': 'php',
 'swift': 'swift',
 'sh': 'sh', 'bash': 'sh', 'zsh': 'sh',
 'sql': 'sql',
 'yaml': 'yaml', 'yml': 'yaml',
 'json': 'json', 'jsonc': 'json',
 'lua': 'lua',
 'dart': 'dart',
 'scala': 'scala', 'sc': 'scala'
 };
 return extMap[ext] || null;
}