import * as vscode from 'vscode';

export interface CleanOptions {
    profile: 'Format' | 'Clean' | 'Minify' | 'Obfuscate';
    removeComments: boolean;
    removeBlankLines: boolean;
    removeSpacesAroundOperators: boolean;
    removeIndentation: boolean;
    cleanOnSave: boolean;
}

export function getConfig(): CleanOptions {
    const config = vscode.workspace.getConfiguration('codeCleaner');
    return {
        profile: config.get<'Format' | 'Clean' | 'Minify' | 'Obfuscate'>('profile', 'Clean'),
        removeComments: config.get<boolean>('removeComments', true),
        removeBlankLines: config.get<boolean>('removeBlankLines', true),
        removeSpacesAroundOperators: config.get<boolean>('removeSpacesAroundOperators', true),
        removeIndentation: config.get<boolean>('removeIndentation', false),
        cleanOnSave: config.get<boolean>('cleanOnSave', false),
    };
}
