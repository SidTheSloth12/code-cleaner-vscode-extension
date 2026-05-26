// src/cleaner.ts

export interface CleanLevel {
    name: string;
    desc: string;
    removeComments: boolean;
    removeIndent: boolean;
    removeBlankLines: boolean;
    fixOperators: boolean;
    collapseAll: boolean;
}

export const LEVELS: CleanLevel[] = [
    {
        name: "readable",
        desc: "Removes blank lines and normalises operator spacing while keeping comments and indentation intact.",
        removeComments: false, removeIndent: false, removeBlankLines: true, fixOperators: true, collapseAll: false
    },
    {
        name: "compact",
        desc: "Strips comments and blank lines, normalises spacing and preserves indentation.",
        removeComments: true, removeIndent: false, removeBlankLines: true, fixOperators: true, collapseAll: false
    },
    {
        name: "minified",
        desc: "Removes comments, blank lines and indentation entirely while retaining minimal whitespace.",
        removeComments: true, removeIndent: true, removeBlankLines: true, fixOperators: true, collapseAll: false
    },
    {
        name: "nuclear",
        desc: "Smallest possible code, with no comments, blank lines, indentation or unnecessary whitespace.",
        removeComments: true, removeIndent: true, removeBlankLines: true, fixOperators: true, collapseAll: true
    }
];

const INDENT_SENSITIVE  = new Set(['python', 'yaml', 'sh', 'makefile']);
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

    if (/: \s*(string|number|boolean|void|any|never|unknown)\b|interface\s+\w+|type\s+\w+\s*=|as\s+\w+/.test(code)) s.ts += 4;
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

    if (/func\s+\w+.*\{|package\s+main|fmt\.Println|:=\s/.test(code)) s.go += 4;
    if (/goroutine|chan\s+\w+|defer\s+/.test(code)) s.go += 2;

    if (/def\s+\w+|puts\s+|^\s*end\s*$|\.each\s*\{|attr_accessor/m.test(code)) s.ruby += 3;
    if (new RegExp('do\\s*\\|.*\\||require\\s+\'|gem\\s+\'|\\.map\\s*\\{').test(code)) s.ruby += 2;

    if (/<\?php|\$\w+\s*=|echo\s+/.test(code)) s.php += 4;
    if (/->\s*\w+\(|array\s*\(|\$_GET|\$_POST/.test(code)) s.php += 2;

    if (/func\s+\w+.*->|UIViewController|@IBOutlet|@IBAction/.test(code)) s.swift += 4;
    if (/guard\s+let|if\s+let|@State|@Binding/.test(code)) s.swift += 3;

    if (/\$\{?\w+\}?|fi\b|done\b|then\b/.test(code)) s.sh += 3;
    if (/^#!\/bin\/(bash|sh|zsh)/m.test(code)) s.sh += 5;

    if (/SELECT\s+.+FROM|INSERT\s+INTO|CREATE\s+TABLE|DROP\s+TABLE/i.test(code)) s.sql += 5;
    if (/WHERE\s+|GROUP\s+BY|ORDER\s+BY|JOIN\s+/i.test(code)) s.sql += 2;

    if (/^[\w-]+:\s*$/m.test(code) && /^\s+-\s+\w+/m.test(code)) s.yaml += 4;
    if (/^---\s*$/m.test(code) || /^\s{2,}\w+:\s+\S/m.test(code)) s.yaml += 3;

    if (/^\s*[\[{]/.test(code.trim()) && /"\w+":\s*("?[\d\[{]|true|false|null)/.test(code)) s.json += 5;

    if (/function\s+\w+\s*\(|local\s+\w+\s*=|then\b|end\b/.test(code)) s.lua += 3;
    if (/--.*$|ipairs\(|pairs\(|\.\./m.test(code)) s.lua += 2;

    if (new RegExp('void\\s+main\\s*\\(|import\\s+\'package:|Widget\\s+build|StatelessWidget').test(code)) s.dart += 4;
    if (/final\s+\w+|List<|Map<|Future</.test(code) && s.dart > 0) s.dart += 2;

    if (/def\s+\w+.*:\s*\w+\s*=|object\s+\w+\s+extends|case\s+class/.test(code)) s.scala += 4;
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

function stripComments(code: string, lang: string): string {
    // 🧠 Core Engine: Matches strings (Group 1) OR comments. 
    // If it's a string, it skips it. If it's a comment, it removes it.
    const safeReplace = (text: string, commentRegex: string, quotes: string[]) => {
        // Dynamically build syntax-safe string matchers based on the language's quote types
        const stringPatterns = quotes.map(q => `${q}(?:[^${q}\\\\]|\\\\.)*${q}`).join('|');
        const combinedRegex = new RegExp(`(${stringPatterns})|${commentRegex}`, 'g');
        
        return text.replace(combinedRegex, (match, isString) => isString ? match : '');
    };

    if (lang === 'sh') {
        return code.split('\n').map((l, i) => {
            if (i === 0 && l.startsWith('#!')) return l;
            return safeReplace(l, '#[^\\n]*', ['"', "'"]);
        }).join('\n');
    }
    if (['python', 'ruby', 'yaml'].includes(lang)) {
        return safeReplace(code, '#[^\\n]*', ['"', "'"]);
    }
    if (lang === 'html') {
        // HTML comment syntax rarely collides with string contents
        return code.replace(new RegExp('', 'g'), '');
    }
    if (lang === 'css') {
        return safeReplace(code, '\\/\\*[\\s\\S]*?\\*\\/', ['"', "'"]);
    }
    if (lang === 'lua') {
        return safeReplace(code, '--\\[\\[[\\s\\S]*?\\]\\]|--[^\\n]*', ['"', "'"]);
    }
    if (lang === 'php') {
        return safeReplace(code, '\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/|#[^\\n]*', ['"', "'", '`']);
    }
    if (lang === 'sql') {
        return safeReplace(code, '--[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/', ["'"]);
    }
    if (lang === 'json') {
        return code;
    }
    
    // Default: C-style — JS, TS, Java, Kotlin, C, C++, Rust, Go, Swift, Dart, Scala
    // Protects double quotes, single quotes, and backticks (template literals)
    return safeReplace(code, '\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/', ['"', "'", '`']);
}

function fixOps(line: string, lang: string): string {
    if (NO_OP_FIX.has(lang)) return line;
    if (lang === 'python') return line.replace(/,([^\s\n])/g, ', $1').replace(/[ \t]+/g, ' ');
    if (['ruby', 'rust', 'go', 'swift', 'kotlin', 'scala', 'dart', 'c', 'php'].includes(lang)) {
        return line.replace(/,([^\s])/g, ', $1').replace(/[ \t]+/g, ' ');
    }
    if (lang === 'java') {
        return line.replace(/([^=!<>\-])=([^>=])/g, '$1 = $2').replace(/,([^\s])/g, ', $1').replace(/[ \t]+/g, ' ');
    }
    if (lang === 'js' || lang === 'ts') {
        return line.replace(/([^=!<>])=([^>=])/g, '$1 = $2').replace(/,([^\s\n])/g, ', $1').replace(/[ \t]+/g, ' ');
    }
    return line.replace(/,([^\s])/g, ', $1').replace(/[ \t]+/g, ' ');
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

export function cleanCode(code: string, level: CleanLevel, lang: string): string {
    let result = code;
    if (level.removeComments) { result = stripComments(result, lang); }
    
    let lines = result.split('\n');
    lines = lines.map(l => (level.removeIndent ? l.trimStart() : l).trimEnd());
    if (level.removeBlankLines) { lines = lines.filter(l => l.trim() !== ''); }
    if (level.fixOperators) { lines = lines.map(l => fixOps(l, lang)); }
    
    result = lines.join(level.collapseAll ? ' ' : '\n');
    if (level.collapseAll) { result = result.replace(/\s+/g, ' ').trim(); }
    return result;
}