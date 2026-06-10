import Parser = require('web-tree-sitter');
import * as path from 'path';

let parser: Parser | null = null;
const languageCache = new Map<string, Parser.Language>();

export async function getParserForLanguage(languageId: string): Promise<Parser | null> {
    if (!parser) {
        await Parser.init();
        parser = new Parser();
    }
    
    const langMap: { [key: string]: string } = {
        'javascript': 'javascript', 'javascriptreact': 'tsx', 'typescript': 'typescript', 'typescriptreact': 'tsx',
        'python': 'python', 'java': 'java', 'c': 'c', 'cpp': 'cpp', 'csharp': 'c_sharp', 'go': 'go',
        'rust': 'rust', 'php': 'php', 'ruby': 'ruby', 'swift': 'swift', 'kotlin': 'kotlin', 'dart': 'dart',
        'scala': 'scala', 'lua': 'lua', 'yaml': 'yaml', 'html': 'html', 'css': 'css', 'json': 'json',
        'jsonc': 'json', 'shellscript': 'bash', 'bash': 'bash'
    };
    
    const wasmName = langMap[languageId];
    if (!wasmName) return null;
    
    if (!languageCache.has(wasmName)) {
        try {
            // In esbuild bundled environment, wasms will be next to the extension script
            let wasmPath = path.join(__dirname, `tree-sitter-${wasmName}.wasm`);
            if (!require('fs').existsSync(wasmPath)) {
                wasmPath = path.join(__dirname, '..', '..', 'node_modules', 'tree-sitter-wasms', 'out', `tree-sitter-${wasmName}.wasm`);
            }
            const lang = await Parser.Language.load(wasmPath);
            languageCache.set(wasmName, lang);
        } catch (e) {
            console.error('Failed to load WASM for', wasmName, e);
            return null;
        }
    }
    
    parser.setLanguage(languageCache.get(wasmName)!);
    return parser;
}

export function countErrors(node: Parser.SyntaxNode): number {
    let errors = 0;
    function walk(n: Parser.SyntaxNode) {
        if (n.type === 'ERROR' || n.isMissing()) errors++;
        for (let i = 0; i < n.childCount; i++) walk(n.child(i)!);
    }
    walk(node);
    return errors;
}
