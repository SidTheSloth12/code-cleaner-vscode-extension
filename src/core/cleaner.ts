import { CleanOptions } from '../config';
import { getParserForLanguage, countErrors } from './parser';
import { processCodeLegacy } from './legacy-cleaner';
import { minify } from 'terser';
import Parser = require('web-tree-sitter');

type RangeInfo = { start: number, end: number, type: 'comment' | 'protect' };

function getProtectedRanges(node: Parser.SyntaxNode): RangeInfo[] {
    let ranges: RangeInfo[] = [];
    function traverse(n: Parser.SyntaxNode) {
        if (n.type.includes('comment')) {
            ranges.push({ start: n.startIndex, end: n.endIndex, type: 'comment' });
            return; 
        }
        if (n.type.includes('string') || n.type.includes('regex') || n.type.includes('character')) {
            ranges.push({ start: n.startIndex, end: n.endIndex, type: 'protect' });
            return; 
        }
        for (let i = 0; i < n.childCount; i++) traverse(n.child(i)!);
    }
    traverse(node);
    return ranges.sort((a, b) => a.start - b.start);
}

function applyWhitespaceCompression(code: string, isWhitespaceDependent: boolean, disableOperatorTightening: boolean, options: CleanOptions): string {
    if (options.profile === 'Format') {
        // Minimal changes for formatting profile
        return code;
    }

    if (!isWhitespaceDependent && options.removeIndentation) {
        code = code.replace(/^[ \t]+/gm, '');
    }
    code = code.replace(/[ \t]+$/gm, '');
    code = code.replace(/(?<=\S)[ \t]{2,}/g, ' ');
    if (!disableOperatorTightening && options.removeSpacesAroundOperators) {
        const operators = ['\\+=', '-=', '\\*=', '/=', '===', '!==', '==', '!=', '<=', '>=', '&&', '\\|\\|', '\\+', '-', '\\*', '/', '=', '<', '>'];
        const opsPattern = operators.join('|');
        const opRegex = new RegExp(`(?<=\\S)[ \\t]*(${opsPattern})[ \\t]*(?=\\S)`, 'g');
        code = code.replace(opRegex, '$1');
    }
    return code;
}

export async function processCode(text: string, languageId: string, options: CleanOptions): Promise<string> {
    const isJsTs = ['javascript', 'typescript', 'javascriptreact', 'typescriptreact'].includes(languageId);

    // Use Terser for robust JS/TS minification/obfuscation
    if (isJsTs && (options.profile === 'Minify' || options.profile === 'Obfuscate')) {
        try {
            const result = await minify(text, {
                mangle: options.profile === 'Obfuscate',
                compress: {
                    defaults: true,
                    drop_console: options.profile === 'Obfuscate',
                },
                format: {
                    comments: !options.removeComments,
                }
            });
            if (result.code) return result.code;
        } catch (e) {
            console.warn('Terser failed, falling back to AST cleaning', e);
        }
    }

    if (isJsTs && options.profile !== 'Format') {
        if (options.removeBlankLines || options.removeIndentation) {
            text = text.replace(/([a-zA-Z0-9)\]])[ \t]*(\r?\n)[ \t]*([a-zA-Z$_])/g, '$1;$2$3');
        }
    }

    const isWhitespaceDependent = ['python', 'yaml', 'fsharp', 'haskell', 'jade', 'pug', 'slim', 'stylus', 'sass'].includes(languageId);
    const disableOperatorTightening = ['shellscript', 'bash', 'sh', 'yaml', 'powershell', 'makefile'].includes(languageId);
    
    const p = await getParserForLanguage(languageId);
    if (!p) {
        return processCodeLegacy(text, languageId, options);
    }

    const tree = p.parse(text);
    const originalErrors = countErrors(tree.rootNode);
    const ranges = getProtectedRanges(tree.rootNode);
    
    let result = '';
    let lastIndex = 0;

    for (const range of ranges) {
        if (range.start > lastIndex) {
            let codePart = text.substring(lastIndex, range.start);
            result += applyWhitespaceCompression(codePart, isWhitespaceDependent, disableOperatorTightening, options);
        }
        
        if (range.type === 'comment') {
            if (!options.removeComments || options.profile === 'Format') result += text.substring(range.start, range.end);
        } else if (range.type === 'protect') {
            result += text.substring(range.start, range.end);
        }
        
        lastIndex = range.end;
    }
    
    if (lastIndex < text.length) {
        let codePart = text.substring(lastIndex);
        result += applyWhitespaceCompression(codePart, isWhitespaceDependent, disableOperatorTightening, options);
    }

    if (options.profile !== 'Format' && options.removeBlankLines) {
        result = result.replace(/^[ \t]*(\r?\n)/gm, '');
    }
    
    // Syntax Validation Dry-Run
    const cleanedTree = p.parse(result);
    const cleanedErrors = countErrors(cleanedTree.rootNode);
    if (cleanedErrors > originalErrors) {
        throw new Error("Syntax error introduced during cleaning. Operation aborted to protect your code.");
    }

    return result;
}
