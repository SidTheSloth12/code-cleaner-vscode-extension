// src/extension.ts

import * as vscode from 'vscode';
import { LEVELS, mapVsCodeLang, getWarning, cleanCode } from './cleaner';

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('code-cleaner.run', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showInformationMessage('Open a file first to clean it!');
            return;
        }

        const document = editor.document;
        const originalText = document.getText();
        const mappedLang = mapVsCodeLang(document.languageId);

        // 1. Show the user a quick pick dropdown list matching your original configurations
        const items = LEVELS.map(level => ({
            label: level.name.toUpperCase(),
            description: level.desc,
            level: level
        }));

        const selection = await vscode.window.showQuickPick(items, {
            placeHolder: `Select cleaning depth for this ${document.languageId} file:`
        });

        if (!selection) { return; } // User cancelled the selection menu
        
        const chosenLevel = selection.level;

        // 2. Perform Syntax Safety Check 
        const warning = getWarning(mappedLang, chosenLevel);
        if (warning) {
            const proceed = await vscode.window.showWarningMessage(warning, { modal: true }, 'Clean Anyway');
            if (proceed !== 'Clean Anyway') { return; } // Cancelled execution due to hazard
        }

        // 3. Process Code Optimization
        const cleanedText = cleanCode(originalText, chosenLevel, mappedLang);

        // 4. Update the Active Editor Workspace Window
        await editor.edit(editBuilder => {
            const firstLine = document.lineAt(0);
            const lastLine = document.lineAt(document.lineCount - 1);
            const fullRange = new vscode.Range(firstLine.range.start, lastLine.range.end);
            editBuilder.replace(fullRange, cleanedText);
        });

        // 5. Compute Reduction Metrics
        const originalChars = originalText.length;
        const cleanedChars = cleanedText.length;
        const savedPct = originalChars > 0 ? Math.round((1 - cleanedChars / originalChars) * 100) : 0;

        vscode.window.showInformationMessage(`✨ Cleaned using ${selection.label}! File size is now ↓ ${savedPct}% smaller.`);
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}