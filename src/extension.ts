// src/extension.ts

import * as vscode from 'vscode';
import { LEVELS, mapVsCodeLang, detectLang, getWarning, cleanCode } from './cleaner';

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('code-cleaner.run', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showInformationMessage('Open a file first to clean it!');
            return;
        }

        const document = editor.document;
        const originalText = document.getText();
        
        // Map VS Code context, but fallback to your intelligent scoring algorithm if it's plaintext
        let mappedLang = mapVsCodeLang(document.languageId);
        if (mappedLang === 'text') {
            mappedLang = detectLang(originalText);
        }

        const items = LEVELS.map(level => ({
            label: level.name.toUpperCase(),
            description: level.desc,
            level: level
        }));

        const selection = await vscode.window.showQuickPick(items, {
            placeHolder: `Select cleaning depth for this detected ${mappedLang.toUpperCase()} file:`
        });

        if (!selection) { return; }
        const chosenLevel = selection.level;

        const warning = getWarning(mappedLang, chosenLevel);
        if (warning) {
            const proceed = await vscode.window.showWarningMessage(warning, { modal: true }, 'Clean Anyway');
            if (proceed !== 'Clean Anyway') { return; }
        }

        const cleanedText = cleanCode(originalText, chosenLevel, mappedLang);

        await editor.edit(editBuilder => {
            const firstLine = document.lineAt(0);
            const lastLine = document.lineAt(document.lineCount - 1);
            const fullRange = new vscode.Range(firstLine.range.start, lastLine.range.end);
            editBuilder.replace(fullRange, cleanedText);
        });

        const originalChars = originalText.length;
        const cleanedChars = cleanedText.length;
        const savedPct = originalChars > 0 ? Math.round((1 - cleanedChars / originalChars) * 100) : 0;

        vscode.window.showInformationMessage(`✨ Cleaned using ${selection.label}! File size is now ↓ ${savedPct}% smaller.`);
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}