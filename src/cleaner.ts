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

function stripComments(code: string, lang: string): string {
    if (lang === 'sh') {
        return code.split('\n').map((l, i) => {
            if (i === 0 && l.startsWith('#!')) { return l; }
            return l.replace(/#[^\n]*/g, '');
        }).join('\n');
    }
    if (['python', 'ruby', 'yaml'].includes(lang)) { return code.replace(/(?<!['"#])#[^\n]*/g, ''); }
    if (lang === 'html') { return code.replace(//g, ''); }
    if (lang === 'css') { return code.replace(/\/\*[\s\S]*?\*\//g, ''); }
    if (lang === 'lua') { return code.replace(/--\[\[[\s\S]*?\]\]/g, '').replace(/--[^\n]*/g, ''); }
    if (lang === 'php') { return code.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/#[^\n]*/g, ''); }
    if (lang === 'sql') { return code.replace(/--[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, ''); }
    if (lang === 'json') { return code; }
    return code.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
}

function fixOps(line: string, lang: string): string {
    if (NO_OP_FIX.has(lang)) { return line; }
    if (['python', 'ruby', 'rust', 'go', 'swift', 'kotlin', 'scala', 'dart', 'c', 'php'].includes(lang)) {
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
        return `${lang.toUpperCase()} uses indentation as syntax — removing it will break your code!`;
    }
    if (NEWLINE_SENSITIVE.has(lang) && level.collapseAll) {
        return `${lang.toUpperCase()} is newline-sensitive — collapsing to one line will break your code!`;
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