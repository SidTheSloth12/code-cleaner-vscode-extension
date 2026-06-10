import * as vscode from 'vscode';
import { getConfig } from './config';
import { processCode } from './core/cleaner';
import { aiCleanCode } from './ai/ai-cleaner';

export function registerCommands(context: vscode.ExtensionContext) {
    let cleanDisposable = vscode.commands.registerCommand('code-cleaner.cleanCode', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found.');
            return;
        }

        const document = editor.document;
        const languageId = document.languageId;
        const selection = editor.selection;

        let rangeToReplace: vscode.Range;
        let textToProcess: string;

        if (!selection.isEmpty) {
            rangeToReplace = new vscode.Range(selection.start, selection.end);
            textToProcess = document.getText(rangeToReplace);
        } else {
            const firstLine = document.lineAt(0);
            const lastLine = document.lineAt(document.lineCount - 1);
            rangeToReplace = new vscode.Range(firstLine.range.start, lastLine.range.end);
            textToProcess = document.getText();
        }

        const options = getConfig();

        try {
            const cleanedText = await processCode(textToProcess, languageId, options);
            await editor.edit(editBuilder => {
                editBuilder.replace(rangeToReplace, cleanedText);
            });
            vscode.window.showInformationMessage('CodeLean & Clean applied successfully!');
        } catch (err: any) {
            vscode.window.showErrorMessage('Failed to apply code cleaner: ' + err.message);
        }
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

        let textToProcess: string;
        if (!selection.isEmpty) {
            textToProcess = document.getText(new vscode.Range(selection.start, selection.end));
        } else {
            textToProcess = document.getText();
        }

        const options = getConfig();

        try {
            const cleanedText = await processCode(textToProcess, languageId, options);
            await vscode.env.clipboard.writeText(cleanedText);
            vscode.window.showInformationMessage('Cleaned code copied to clipboard!');
        } catch (err: any) {
            vscode.window.showErrorMessage('Failed to clean and copy code: ' + err.message);
        }
    });

    let aiCleanDisposable = vscode.commands.registerCommand('code-cleaner.aiCleanCode', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found.');
            return;
        }

        const document = editor.document;
        const languageId = document.languageId;
        const selection = editor.selection;

        let rangeToReplace: vscode.Range;
        let textToProcess: string;

        if (!selection.isEmpty) {
            rangeToReplace = new vscode.Range(selection.start, selection.end);
            textToProcess = document.getText(rangeToReplace);
        } else {
            const firstLine = document.lineAt(0);
            const lastLine = document.lineAt(document.lineCount - 1);
            rangeToReplace = new vscode.Range(firstLine.range.start, lastLine.range.end);
            textToProcess = document.getText();
        }

        const options = getConfig();

        try {
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "CodeCleaner",
                cancellable: false
            }, async (progress) => {
                progress.report({ message: "AI is analyzing and refactoring code..." });
                const cleanedText = await aiCleanCode(textToProcess, languageId, options);
                await editor.edit(editBuilder => {
                    editBuilder.replace(rangeToReplace, cleanedText);
                });
                vscode.window.showInformationMessage('AI Code Refactor applied successfully!');
            });
        } catch (err: any) {
            vscode.window.showErrorMessage('Failed to apply AI code refactor: ' + err.message);
        }
    });

    context.subscriptions.push(cleanDisposable);
    context.subscriptions.push(copyDisposable);
    context.subscriptions.push(aiCleanDisposable);
}
