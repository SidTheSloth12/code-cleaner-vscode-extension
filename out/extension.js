"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCleanOptions = getCleanOptions;
exports.activate = activate;
exports.processCode = processCode;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const Parser = require('web-tree-sitter');
const path = __importStar(require("path"));
function getCleanOptions() {
    const config = vscode.workspace.getConfiguration('codeCleaner');
    return {
        removeComments: config.get('removeComments', true),
        removeBlankLines: config.get('removeBlankLines', true),
        removeSpacesAroundOperators: config.get('removeSpacesAroundOperators', true),
        removeIndentation: config.get('removeIndentation', true),
    };
}
function activate(context) {
    let disposable = vscode.commands.registerCommand('code-cleaner.cleanCode', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found.');
            return;
        }
        const document = editor.document;
        const languageId = document.languageId;
        const selection = editor.selection;
        let rangeToReplace;
        let textToProcess;
        if (!selection.isEmpty) {
            rangeToReplace = new vscode.Range(selection.start, selection.end);
            textToProcess = document.getText(rangeToReplace);
        }
        else {
            const firstLine = document.lineAt(0);
            const lastLine = document.lineAt(document.lineCount - 1);
            rangeToReplace = new vscode.Range(firstLine.range.start, lastLine.range.end);
            textToProcess = document.getText();
        }
        const options = getCleanOptions();
        // Since processCode is now async, we must wrap it in an async IIFE or make the command callback async
        (async () => {
            try {
                const cleanedText = await processCode(textToProcess, languageId, options);
                await editor.edit(editBuilder => {
                    editBuilder.replace(rangeToReplace, cleanedText);
                });
                vscode.window.showInformationMessage('Code Lean & Clean applied successfully!');
            }
            catch (err) {
                vscode.window.showErrorMessage('Failed to apply code cleaner: ' + err.message);
            }
        })();
    });
    let copyDisposable = vscode.commands.registerCommand('code-cleaner.cleanAndCopy', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found.');
            return;
        }
        const document = editor.document;
        const languageId = document.languageId;
        const selection = editor.selection;
        let textToProcess;
        if (!selection.isEmpty) {
            textToProcess = document.getText(new vscode.Range(selection.start, selection.end));
        }
        else {
            textToProcess = document.getText();
        }
        const options = getCleanOptions();
        try {
            const cleanedText = await processCode(textToProcess, languageId, options);
            await vscode.env.clipboard.writeText(cleanedText);
            vscode.window.showInformationMessage('Cleaned code copied to clipboard!');
        }
        catch (err) {
            vscode.window.showErrorMessage('Failed to clean and copy code: ' + err.message);
        }
    });
    context.subscriptions.push(disposable);
    context.subscriptions.push(copyDisposable);
    // Phase 2: Clean on Save functionality
    context.subscriptions.push(vscode.workspace.onWillSaveTextDocument(event => {
        const config = vscode.workspace.getConfiguration('codeCleaner');
        if (config.get('cleanOnSave', false)) {
            const document = event.document;
            const options = getCleanOptions();
            const textToProcess = document.getText();
            const languageId = document.languageId;
            const cleanedTextPromise = processCode(textToProcess, languageId, options);
            event.waitUntil((async () => {
                try {
                    const cleanedText = await cleanedTextPromise;
                    if (cleanedText !== textToProcess) {
                        const fullRange = new vscode.Range(document.lineAt(0).range.start, document.lineAt(document.lineCount - 1).range.end);
                        return [vscode.TextEdit.replace(fullRange, cleanedText)];
                    }
                }
                catch (e) {
                    vscode.window.showErrorMessage('Clean on Save aborted: ' + e.message);
                }
                return [];
            })());
        }
    }));
}
let parser = null;
const languageCache = new Map();
async function getParserForLanguage(languageId) {
    if (!parser) {
        await Parser.init();
        parser = new Parser();
    }
    const langMap = {
        'javascript': 'javascript', 'javascriptreact': 'tsx', 'typescript': 'typescript', 'typescriptreact': 'tsx',
        'python': 'python', 'java': 'java', 'c': 'c', 'cpp': 'cpp', 'csharp': 'c_sharp', 'go': 'go',
        'rust': 'rust', 'php': 'php', 'ruby': 'ruby', 'swift': 'swift', 'kotlin': 'kotlin', 'dart': 'dart',
        'scala': 'scala', 'lua': 'lua', 'yaml': 'yaml', 'html': 'html', 'css': 'css', 'json': 'json',
        'jsonc': 'json', 'shellscript': 'bash', 'bash': 'bash'
    };
    const wasmName = langMap[languageId];
    if (!wasmName)
        return null;
    if (!languageCache.has(wasmName)) {
        try {
            const wasmPath = path.join(__dirname, '..', 'node_modules', 'tree-sitter-wasms', 'out', `tree-sitter-${wasmName}.wasm`);
            const lang = await Parser.Language.load(wasmPath);
            languageCache.set(wasmName, lang);
        }
        catch (e) {
            console.error('Failed to load WASM for', wasmName, e);
            return null;
        }
    }
    parser.setLanguage(languageCache.get(wasmName));
    return parser;
}
function countErrors(node) {
    let errors = 0;
    function walk(n) {
        if (n.type === 'ERROR' || n.isMissing)
            errors++;
        for (let i = 0; i < n.childCount; i++)
            walk(n.child(i));
    }
    walk(node);
    return errors;
}
function getProtectedRanges(node) {
    let ranges = [];
    function traverse(n) {
        if (n.type.includes('comment')) {
            ranges.push({ start: n.startIndex, end: n.endIndex, type: 'comment' });
            return;
        }
        if (n.type.includes('string') || n.type.includes('regex') || n.type.includes('character')) {
            ranges.push({ start: n.startIndex, end: n.endIndex, type: 'protect' });
            return;
        }
        for (let i = 0; i < n.childCount; i++)
            traverse(n.child(i));
    }
    traverse(node);
    return ranges.sort((a, b) => a.start - b.start);
}
function applyWhitespaceCompression(code, isWhitespaceDependent, disableOperatorTightening, options) {
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
async function processCode(text, languageId, options) {
    if (['javascript', 'typescript', 'javascriptreact', 'typescriptreact'].includes(languageId)) {
        if (options.removeBlankLines || options.removeIndentation) {
            text = text.replace(/([a-zA-Z0-9)\]])[ \t]*(\r?\n)[ \t]*([a-zA-Z$_])/g, '$1;$2$3');
        }
    }
    const isWhitespaceDependent = ['python', 'yaml', 'fsharp', 'haskell', 'jade', 'pug', 'slim', 'stylus', 'sass'].includes(languageId);
    const disableOperatorTightening = ['shellscript', 'bash', 'sh', 'yaml', 'powershell', 'makefile'].includes(languageId);
    const p = await getParserForLanguage(languageId);
    if (!p) {
        // Fallback to legacy regex tokenizer logic if WASM is not found for language
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
            if (!options.removeComments)
                result += text.substring(range.start, range.end);
        }
        else if (range.type === 'protect') {
            result += text.substring(range.start, range.end);
        }
        lastIndex = range.end;
    }
    if (lastIndex < text.length) {
        let codePart = text.substring(lastIndex);
        result += applyWhitespaceCompression(codePart, isWhitespaceDependent, disableOperatorTightening, options);
    }
    if (options.removeBlankLines) {
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
function tokenize(code, languageId) {
    const tokens = [];
    let i = 0;
    let currentCode = '';
    let codeSoFar = '';
    // Determine language-specific comment characters
    const hashIsComment = ['python', 'yaml', 'shellscript', 'bash', 'sh', 'ruby', 'perl', 'powershell', 'makefile', 'r', 'dockerfile'].includes(languageId);
    const dashDashIsComment = ['lua', 'sql', 'haskell'].includes(languageId);
    const slashSlashIsComment = ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue', 'svelte', 'c', 'cpp', 'csharp', 'java', 'go', 'rust', 'swift', 'kotlin', 'php', 'dart', 'scala', 'json', 'jsonc', 'fsharp'].includes(languageId);
    const slashStarIsComment = ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue', 'svelte', 'c', 'cpp', 'csharp', 'java', 'go', 'rust', 'swift', 'kotlin', 'php', 'dart', 'scala', 'css', 'less', 'scss', 'sql'].includes(languageId);
    const htmlIsComment = ['html', 'xml', 'markdown', 'vue', 'svelte'].includes(languageId);
    const supportsRegexLiterals = ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'ruby', 'vue', 'svelte'].includes(languageId);
    function pushCode() {
        if (currentCode) {
            tokens.push({ type: 'code', value: currentCode });
            currentCode = '';
        }
    }
    while (i < code.length) {
        const char = code[i];
        const next = code[i + 1] || '';
        // Block comment /* */
        if (slashStarIsComment && char === '/' && next === '*') {
            pushCode();
            let comment = '/*';
            i += 2;
            while (i < code.length) {
                if (code[i] === '*' && code[i + 1] === '/') {
                    comment += '*/';
                    i += 2;
                    break;
                }
                comment += code[i];
                i++;
            }
            tokens.push({ type: 'comment', value: comment });
            continue;
        }
        // Single line comment //
        if (slashSlashIsComment && char === '/' && next === '/') {
            pushCode();
            let comment = '//';
            i += 2;
            while (i < code.length && code[i] !== '\n') {
                comment += code[i];
                i++;
            }
            tokens.push({ type: 'comment', value: comment });
            continue;
        }
        // HTML comment <!-- -->
        if (htmlIsComment && char === '<' && code.substring(i, i + 4) === '<!--') {
            pushCode();
            let comment = '<!--';
            i += 4;
            while (i < code.length) {
                if (code.substring(i, i + 3) === '-->') {
                    comment += '-->';
                    i += 3;
                    break;
                }
                comment += code[i];
                i++;
            }
            tokens.push({ type: 'comment', value: comment });
            continue;
        }
        // Hash comment #
        if (hashIsComment && char === '#') {
            pushCode();
            let comment = '#';
            i++;
            while (i < code.length && code[i] !== '\n') {
                comment += code[i];
                i++;
            }
            tokens.push({ type: 'comment', value: comment });
            continue;
        }
        // Dash Dash comment --
        if (dashDashIsComment && char === '-' && next === '-') {
            pushCode();
            let comment = '--';
            i += 2;
            while (i < code.length && code[i] !== '\n') {
                comment += code[i];
                i++;
            }
            tokens.push({ type: 'comment', value: comment });
            continue;
        }
        // Strings (" ' `)
        if (char === '"' || char === "'" || char === '`') {
            pushCode();
            const quote = char;
            const isMulti = (quote === '"' || quote === "'") && code.substring(i, i + 3) === quote + quote + quote;
            let str = isMulti ? quote + quote + quote : quote;
            i += isMulti ? 3 : 1;
            while (i < code.length) {
                if (code[i] === '\\') {
                    str += code[i];
                    i++;
                    if (i < code.length) {
                        str += code[i];
                        i++;
                    }
                    continue;
                }
                if (isMulti) {
                    if (code.substring(i, i + 3) === quote + quote + quote) {
                        str += quote + quote + quote;
                        i += 3;
                        break;
                    }
                }
                else {
                    if (code[i] === quote) {
                        str += quote;
                        i++;
                        break;
                    }
                }
                str += code[i];
                i++;
            }
            tokens.push({ type: 'string', value: str });
            codeSoFar += 'R'; // Placeholder indicating an expression
            continue;
        }
        // Regex Literal Heuristic (applicable mostly to JS/TS)
        if (supportsRegexLiterals && char === '/') {
            const trimmed = codeSoFar.trim();
            const lastChar = trimmed.slice(-1);
            const matchWord = trimmed.match(/[a-zA-Z_$][a-zA-Z0-9_$]*$/);
            const lastWord = matchWord ? matchWord[0] : '';
            const couldBeRegex = !lastChar ||
                /[-+*=[({!:,;<>|&?]/.test(lastChar) ||
                ['return', 'typeof', 'yield', 'await', 'throw', 'case', 'do', 'else', 'in', 'of'].includes(lastWord);
            if (couldBeRegex) {
                let isRegex = false;
                let j = i + 1;
                let regexContent = '/';
                while (j < code.length) {
                    if (code[j] === '\n') {
                        break;
                    } // Regex cannot contain unescaped newlines
                    if (code[j] === '\\') {
                        regexContent += code[j];
                        j++;
                        if (j < code.length) {
                            regexContent += code[j];
                            j++;
                        }
                        continue;
                    }
                    if (code[j] === '/') {
                        regexContent += '/';
                        j++;
                        // Flags
                        while (j < code.length && /[gimyusd]/i.test(code[j])) {
                            regexContent += code[j];
                            j++;
                        }
                        isRegex = true;
                        break;
                    }
                    regexContent += code[j];
                    j++;
                }
                if (isRegex) {
                    pushCode();
                    tokens.push({ type: 'regex', value: regexContent });
                    i = j;
                    codeSoFar += 'R';
                    continue;
                }
            }
        }
        currentCode += char;
        codeSoFar += char;
        i++;
    }
    pushCode();
    return tokens;
}
function processCodeLegacy(text, languageId, options) {
    const isWhitespaceDependent = ['python', 'yaml', 'fsharp', 'haskell', 'jade', 'pug', 'slim', 'stylus', 'sass'].includes(languageId);
    const disableOperatorTightening = ['shellscript', 'bash', 'sh', 'yaml', 'powershell', 'makefile'].includes(languageId);
    const tokens = tokenize(text, languageId);
    let result = '';
    const protectedTokens = [];
    for (const token of tokens) {
        if (token.type === 'comment') {
            if (options.removeComments) {
                // 1. Remove Comments
                continue;
            }
            else {
                // Protect comments
                const placeholder = `__PROTECTED_TOKEN_${protectedTokens.length}__`;
                protectedTokens.push(token.value);
                result += placeholder;
                continue;
            }
        }
        if (token.type === 'string' || token.type === 'regex') {
            // Protect strings and regex literals from global replace
            const placeholder = `__PROTECTED_TOKEN_${protectedTokens.length}__`;
            protectedTokens.push(token.value);
            result += placeholder;
            continue;
        }
        if (token.type === 'code') {
            let code = token.value;
            if (!isWhitespaceDependent && options.removeIndentation) {
                // 5. Conditional Indentation Removal (Flatten if not whitespace dependent)
                code = code.replace(/^[ \t]+/gm, '');
            }
            // 3. Trim Whitespace (Trailing)
            code = code.replace(/[ \t]+$/gm, '');
            // 3. Trim Whitespace (Multiple consecutive spaces inside line)
            // Using (?<=\S) avoids matching leading indentation
            code = code.replace(/(?<=\S)[ \t]{2,}/g, ' ');
            if (!disableOperatorTightening && options.removeSpacesAroundOperators) {
                // 4. Tighten Operators
                // Avoid modifying start/end of lines to prevent breaking syntax like YAML lists
                const operators = [
                    '\\+=', '-=', '\\*=', '/=', '===', '!==', '==', '!=', '<=', '>=', '&&', '\\|\\|', '\\+', '-', '\\*', '/', '=', '<', '>'
                ];
                const opsPattern = operators.join('|');
                const opRegex = new RegExp(`(?<=\\S)[ \\t]*(${opsPattern})[ \\t]*(?=\\S)`, 'g');
                code = code.replace(opRegex, '$1');
            }
            result += code;
        }
    }
    // 2. Remove Blank Lines
    // Remove lines that only contain whitespace characters
    if (options.removeBlankLines) {
        result = result.replace(/^[ \t]*(\r?\n)/gm, '');
    }
    // Restore protected tokens efficiently O(N) instead of O(N*M)
    result = result.replace(/__PROTECTED_TOKEN_(\d+)__/g, (match, index) => {
        return protectedTokens[parseInt(index, 10)];
    });
    return result;
}
function deactivate() { }
//# sourceMappingURL=extension.js.map