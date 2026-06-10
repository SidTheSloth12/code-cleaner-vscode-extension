import * as vscode from 'vscode';

export interface CleanOptions {
    profile: 'Format' | 'Minify' | 'Obfuscate';
    aiProvider: 'Gemini' | 'OpenAI';
    apiKey: string;
    removeComments: boolean;
    removeBlankLines: boolean;
    removeSpacesAroundOperators: boolean;
    removeIndentation: boolean;
    cleanOnSave: boolean;
}

export function getConfig(): CleanOptions {
    const config = vscode.workspace.getConfiguration('codeCleaner');
    return {
        profile: config.get<'Format' | 'Minify' | 'Obfuscate'>('profile', 'Minify'),
        aiProvider: config.get<'Gemini' | 'OpenAI'>('aiProvider', 'Gemini'),
        apiKey: config.get<string>('apiKey', ''),
        removeComments: config.get<boolean>('removeComments', true),
        removeBlankLines: config.get<boolean>('removeBlankLines', true),
        removeSpacesAroundOperators: config.get<boolean>('removeSpacesAroundOperators', true),
        removeIndentation: config.get<boolean>('removeIndentation', true),
        cleanOnSave: config.get<boolean>('cleanOnSave', false),
    };
}
