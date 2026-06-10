import * as vscode from 'vscode';
import { registerCommands } from './commands';
import { getConfig } from './config';
import { processCode } from './core/cleaner';

export function activate(context: vscode.ExtensionContext) {
    // Register all commands
    registerCommands(context);

    // Phase 2: Clean on Save functionality
    context.subscriptions.push(
        vscode.workspace.onWillSaveTextDocument(event => {
            const options = getConfig();
            if (options.cleanOnSave) {
                const document = event.document;
                const textToProcess = document.getText();
                const languageId = document.languageId;
                
                const cleanedTextPromise = processCode(textToProcess, languageId, options);
                
                event.waitUntil((async () => {
                    try {
                        const cleanedText = await cleanedTextPromise;
                        if (cleanedText !== textToProcess) {
                            const fullRange = new vscode.Range(
                                document.lineAt(0).range.start,
                                document.lineAt(document.lineCount - 1).range.end
                            );
                            return [vscode.TextEdit.replace(fullRange, cleanedText)];
                        }
                    } catch (e: any) {
                        vscode.window.showErrorMessage('Clean on Save aborted: ' + e.message);
                    }
                    return [];
                })());
            }
        })
    );
}

export function deactivate() {}
