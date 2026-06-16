import * as vscode from 'vscode';
import { getConfig, CleanOptions } from './config';
import { processCode } from './core/cleaner';

async function processTextPreservingWhitespace(textToProcess: string, languageId: string, options: CleanOptions): Promise<string> {
    const leadingWhitespace = textToProcess.length === 0 ? '' : (textToProcess.match(/^\s*/) || [''])[0];
    const isAllWhitespace = leadingWhitespace.length === textToProcess.length;
    const trailingWhitespace = isAllWhitespace ? '' : (textToProcess.match(/\s*$/) || [''])[0];
    const trimmedText = isAllWhitespace ? '' : textToProcess.substring(leadingWhitespace.length, textToProcess.length - trailingWhitespace.length);

    let finalText = textToProcess;
    if (!isAllWhitespace) {
        const cleanedText = await processCode(trimmedText, languageId, options);
        finalText = leadingWhitespace + cleanedText + trailingWhitespace;
    }
    return finalText;
}

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
            const finalText = await processTextPreservingWhitespace(textToProcess, languageId, options);

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
            const finalText = await processTextPreservingWhitespace(textToProcess, languageId, options);

            await vscode.env.clipboard.writeText(finalText);
            vscode.window.showInformationMessage('Code cleaned and copied.');
        } catch (err: any) {
            vscode.window.showErrorMessage('Failed to clean and copy code: ' + err.message);
        }
    });


    let cleanFolderDisposable = vscode.commands.registerCommand('code-cleaner.cleanFolder', async (folderUri: vscode.Uri) => {
        if (!folderUri) {
            vscode.window.showErrorMessage('No folder selected.');
            return;
        }

        const options = getConfig();

        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "CodeCleaner: Cleaning Folder",
            cancellable: true
        }, async (progress, token) => {
            try {
                const pattern = new vscode.RelativePattern(folderUri, '**/*');
                const excludePattern = new vscode.RelativePattern(folderUri, '**/{node_modules,.git,dist,build,out,.next,.svelte-kit,.nuxt,coverage,.vscode}/**');
                const files = await vscode.workspace.findFiles(pattern, excludePattern);
                
                let processedCount = 0;
                let errorCount = 0;
                let currentIndex = 0;
                const concurrencyLimit = 10;

                const processNext = async (): Promise<void> => {
                    if (token.isCancellationRequested) return;
                    
                    const i = currentIndex++;
                    if (i >= files.length) return;

                    const fileUri = files[i];
                    try {
                        const document = await vscode.workspace.openTextDocument(fileUri);
                        const languageId = document.languageId;
                        const textToProcess = document.getText();

                        const finalText = await processTextPreservingWhitespace(textToProcess, languageId, options);

                        if (finalText !== textToProcess) {
                            const edit = new vscode.WorkspaceEdit();
                            const fullRange = new vscode.Range(
                                document.lineAt(0).range.start,
                                document.lineAt(document.lineCount - 1).range.end
                            );
                            edit.replace(fileUri, fullRange, finalText);
                            const success = await vscode.workspace.applyEdit(edit);
                            if (success) {
                                await document.save();
                            }
                        }
                        processedCount++;
                    } catch (err) {
                        // Suppress errors for individual files to ensure we don't break the process
                        errorCount++;
                        console.warn(`CodeCleaner: Failed to clean ${fileUri.fsPath}`, err);
                    }
                    
                    progress.report({ increment: 100 / files.length, message: `Processed ${processedCount}/${files.length} files` });
                    
                    return processNext();
                };

                const workers = Array.from({ length: Math.min(concurrencyLimit, files.length) }, () => processNext());
                await Promise.all(workers);

                vscode.window.showInformationMessage(`CodeCleaner: Finished cleaning folder. Processed: ${processedCount}, Errors/Skipped: ${errorCount}`);
            } catch (err: any) {
                vscode.window.showErrorMessage('Failed to clean folder: ' + err.message);
            }
        });
    });

    context.subscriptions.push(cleanDisposable);
    context.subscriptions.push(copyDisposable);
    context.subscriptions.push(cleanFolderDisposable);
}
