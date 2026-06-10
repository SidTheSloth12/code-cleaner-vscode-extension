import * as fs from 'fs';
import * as path from 'path';
import { processCode } from './src/core/cleaner';
import { CleanOptions } from './src/config';
import Parser = require('web-tree-sitter');

async function testAll() {
    await Parser.init();
    
    const defaultOptions: CleanOptions = {
        profile: 'Minify',
        aiProvider: 'Gemini',
        apiKey: '',
        removeComments: true,
        removeBlankLines: true,
        removeSpacesAroundOperators: true,
        removeIndentation: true,
        cleanOnSave: false
    };

    const filesToTest = [
        { path: 'package.json', lang: 'json' },
        { path: 'package.json', lang: 'jsonc' },
        { path: 'src/extension.ts', lang: 'typescript' },
        { path: 'src/core/cleaner.ts', lang: 'typescript' },
        { path: '.vscode/tasks.json', lang: 'json' }
    ];

    for (const file of filesToTest) {
        const fullPath = path.resolve(__dirname, file.path);
        if (fs.existsSync(fullPath)) {
            const text = fs.readFileSync(fullPath, 'utf8');
            try {
                const result = await processCode(text, file.lang, defaultOptions);
                console.log(`Success for ${file.path}`);
            } catch (e: any) {
                console.error(`Error for ${file.path}:`, e.message);
            }
        }
    }
}

testAll();
