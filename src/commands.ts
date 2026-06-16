import * as vscode from 'vscode';
import { getConfig } from './config';
import { processCode } from './core/cleaner';

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
            const leadingWhitespace = textToProcess.length === 0 ? '' : (textToProcess.match(/^\s*/) || [''])[0];
            const isAllWhitespace = leadingWhitespace.length === textToProcess.length;
            const trailingWhitespace = isAllWhitespace ? '' : (textToProcess.match(/\s*$/) || [''])[0];
            const trimmedText = isAllWhitespace ? '' : textToProcess.substring(leadingWhitespace.length, textToProcess.length - trailingWhitespace.length);

            let finalText = textToProcess;
            if (!isAllWhitespace) {
                const cleanedText = await processCode(trimmedText, languageId, options);
                finalText = leadingWhitespace + cleanedText + trailingWhitespace;
            }

            await editor.edit(editBuilder => {
                editBuilder.replace(rangeToReplace, finalText);
            });
            vscode.window.showInformationMessage('Code cleaned.');
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
            const leadingWhitespace = textToProcess.length === 0 ? '' : (textToProcess.match(/^\s*/) || [''])[0];
            const isAllWhitespace = leadingWhitespace.length === textToProcess.length;
            const trailingWhitespace = isAllWhitespace ? '' : (textToProcess.match(/\s*$/) || [''])[0];
            const trimmedText = isAllWhitespace ? '' : textToProcess.substring(leadingWhitespace.length, textToProcess.length - trailingWhitespace.length);

            let finalText = textToProcess;
            if (!isAllWhitespace) {
                const cleanedText = await processCode(trimmedText, languageId, options);
                finalText = leadingWhitespace + cleanedText + trailingWhitespace;
            }

            await vscode.env.clipboard.writeText(finalText);
            vscode.window.showInformationMessage('Code cleaned and copied.');
        } catch (err: any) {
            vscode.window.showErrorMessage('Failed to clean and copy code: ' + err.message);
        }
    });


    context.subscriptions.push(cleanDisposable);
    context.subscriptions.push(copyDisposable);
}
