import * as vscode from 'vscode';
import { LEVELS, mapVsCodeLang, detectLang, getWarning, cleanCode, getLangFromFilename } from './cleaner';
export function activate(context: vscode.ExtensionContext) {
 let disposable = vscode.commands.registerCommand('code-cleaner.run', async () => {
 const editor = vscode.window.activeTextEditor;
 if (!editor) {
 vscode.window.showInformationMessage('Open a file first to clean it!');
 return;
 }
 const config = vscode.workspace.getConfiguration('code-cleaner');
 const removeEmojis = config.get<boolean>('removeEmojis', true);
 const document = editor.document;
 const editorSelection = editor.selection;
 const hasSelection = !editorSelection.isEmpty;
 const originalText = hasSelection ? document.getText(editorSelection) : document.getText();
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
 placeHolder: `Select cleaning depth for this detected ${mappedLang.toUpperCase()} ${hasSelection ? 'selection' : 'file'}:`
 });
 if (!selection) { return; }
 const chosenLevel = selection.level;
 const warning = getWarning(mappedLang, chosenLevel);
 if (warning) {
 const proceed = await vscode.window.showWarningMessage(warning, { modal: true }, 'Clean Anyway');
 if (proceed !== 'Clean Anyway') { return; }
 }
 const cleanedText = cleanCode(originalText, chosenLevel, mappedLang, removeEmojis);
 await editor.edit(editBuilder => {
 if (hasSelection) {
 editBuilder.replace(editorSelection, cleanedText);
 } else {
 const firstLine = document.lineAt(0);
 const lastLine = document.lineAt(document.lineCount - 1);
 const fullRange = new vscode.Range(firstLine.range.start, lastLine.range.end);
 editBuilder.replace(fullRange, cleanedText);
 }
 });
 const originalChars = originalText.length;
 const cleanedChars = cleanedText.length;
 const savedPct = originalChars > 0 ? Math.round((1 - cleanedChars / originalChars) * 100) : 0;
 const scope = hasSelection ? 'Selection' : 'File';
 vscode.window.showInformationMessage(` Cleaned ${hasSelection ? 'selection' : 'file'} using ${selection.label}! ${scope} size is now ↓ ${savedPct}% smaller.`);
 });
 let cleanFolderDisposable = vscode.commands.registerCommand('code-cleaner.cleanFolder', async (folderUri: vscode.Uri) => {
 if (!folderUri) {
 vscode.window.showInformationMessage('Right-click a folder in the Explorer to clean it!');
 return;
 }
 const items = LEVELS.map(level => ({
 label: level.name.toUpperCase(),
 description: level.desc,
 level: level
 }));
 const selection = await vscode.window.showQuickPick(items, {
 placeHolder: `Select cleaning depth for folder "${vscode.workspace.asRelativePath(folderUri)}":`
 });
 if (!selection) { return; }
 const chosenLevel = selection.level;
 const config = vscode.workspace.getConfiguration('code-cleaner');
 const removeEmojis = config.get<boolean>('removeEmojis', true);
 await vscode.window.withProgress({
 location: vscode.ProgressLocation.Notification,
 title: `Cleaning files in ${vscode.workspace.asRelativePath(folderUri)}...`,
 cancellable: true
 }, async (progress, token) => {
 const filesToClean: vscode.Uri[] = [];
 async function scan(dirUri: vscode.Uri) {
 if (token.isCancellationRequested) { return; }
 const children = await vscode.workspace.fs.readDirectory(dirUri);
 for (const [name, type] of children) {
 if (token.isCancellationRequested) { return; }
 const childUri = vscode.Uri.joinPath(dirUri, name);
 if (type === vscode.FileType.Directory) {
 if (['node_modules', '.git', 'out', 'dist', 'build', '.vscode', '.idea'].includes(name.toLowerCase())) {
 continue;
 }
 await scan(childUri);
 } else if (type === vscode.FileType.File) {
 const lang = getLangFromFilename(name);
 if (lang) {
 filesToClean.push(childUri);
 }
 }
 }
 }
 progress.report({ message: 'Scanning directory...' });
 await scan(folderUri);
 if (token.isCancellationRequested) {
 vscode.window.showInformationMessage('Folder cleaning cancelled.');
 return;
 }
 if (filesToClean.length === 0) {
 vscode.window.showInformationMessage('No supported files found to clean in this folder.');
 return;
 }
 let totalOriginalChars = 0;
 let totalCleanedChars = 0;
 let cleanedCount = 0;
 for (let i = 0; i < filesToClean.length; i++) {
 if (token.isCancellationRequested) { break; }
 const fileUri = filesToClean[i];
 const filename = fileUri.path.split('/').pop() || '';
 progress.report({
 message: `Cleaning ${filename} (${i + 1}/${filesToClean.length})`,
 increment: (1 / filesToClean.length) * 100
 });
 try {
 const fileContentBytes = await vscode.workspace.fs.readFile(fileUri);
 const originalText = new TextDecoder('utf-8').decode(fileContentBytes);
 const lang = getLangFromFilename(filename)!;
 const cleanedText = cleanCode(originalText, chosenLevel, lang, removeEmojis);
 if (cleanedText !== originalText) {
 await vscode.workspace.fs.writeFile(fileUri, new TextEncoder().encode(cleanedText));
 }
 totalOriginalChars + = originalText.length;
 totalCleanedChars + = cleanedText.length;
 cleanedCount++;
 } catch (err) {
 console.error(`Failed to clean file ${fileUri.fsPath}:`, err);
 }
 }
 const savedPct = totalOriginalChars > 0 ? Math.round((1 - totalCleanedChars / totalOriginalChars) * 100) : 0;
 vscode.window.showInformationMessage(
 ` Cleaned ${cleanedCount} files using ${selection.label}! Combined size is now ↓ ${savedPct}% smaller.`
 );
 });
 });
 context.subscriptions.push(disposable);
 context.subscriptions.push(cleanFolderDisposable);
}
export function deactivate() {}