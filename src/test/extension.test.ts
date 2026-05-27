import * as assert from 'assert';
import { cleanCode, LEVELS, getLangFromFilename } from '../cleaner';

suite('Code Cleaner Core Test Suite', () => {
    
    test('Emoji removal across languages', () => {
        const jsCode = `const x = "hello 🚀 world"; // some comment 😊`;
        // With emoji removal enabled (default for compact level)
        const compactLevel = LEVELS.find(l => l.name === 'compact')!;
        const cleaned = cleanCode(jsCode, compactLevel, 'js');
        assert.ok(!cleaned.includes('🚀'), 'Should remove emoji 🚀');
        assert.ok(!cleaned.includes('😊'), 'Should remove emoji 😊');
        assert.ok(!cleaned.includes('//'), 'Should strip comment');
        assert.strictEqual(cleaned.trim(), 'const x = "hello world";');
    });

    test('Emoji removal configuration override', () => {
        const jsCode = `const x = "hello 🚀 world";`;
        const compactLevel = LEVELS.find(l => l.name === 'compact')!;
        // Override removeEmojis to false
        const cleaned = cleanCode(jsCode, compactLevel, 'js', false);
        assert.ok(cleaned.includes('🚀'), 'Should preserve emoji 🚀 when override is false');
    });

    test('Python comment stripping and triple quotes', () => {
        const pyCode = `
def hello():
    """This is a docstring with # comments inside it"""
    # This is a real comment
    print("hello") # inline comment
`.trim();
        const compactLevel = LEVELS.find(l => l.name === 'compact')!;
        const cleaned = cleanCode(pyCode, compactLevel, 'python');
        
        assert.ok(cleaned.includes('"""This is a docstring with # comments inside it"""'), 'Should preserve triple-quoted string even with comment symbol');
        assert.ok(!cleaned.includes('# This is a real comment'), 'Should strip real comments');
        assert.ok(!cleaned.includes('# inline comment'), 'Should strip inline comments');
        assert.ok(cleaned.includes('print("hello")'), 'Should preserve code');
    });

    test('HTML comment stripping', () => {
        const htmlCode = `
<!-- This is a comment 🚨 -->
<div class="test">Hello World</div>
`.trim();
        const compactLevel = LEVELS.find(l => l.name === 'compact')!;
        const cleaned = cleanCode(htmlCode, compactLevel, 'html');
        assert.ok(!cleaned.includes('<!--'), 'Should strip HTML comment start');
        assert.ok(!cleaned.includes('-->'), 'Should strip HTML comment end');
        assert.ok(!cleaned.includes('🚨'), 'Should strip emojis');
        assert.strictEqual(cleaned.trim(), '<div class="test">Hello World</div>');
    });

    test('JSON with comments (JSONC) stripping', () => {
        const jsoncCode = `
{
    // compiler configuration
    "compilerOptions": {
        "target": "es2022" /* target js version */
    }
}
`.trim();
        const compactLevel = LEVELS.find(l => l.name === 'compact')!;
        const cleaned = cleanCode(jsoncCode, compactLevel, 'json');
        assert.ok(!cleaned.includes('// compiler configuration'), 'Should strip line comment');
        assert.ok(!cleaned.includes('/* target js version */'), 'Should strip block comment');
        assert.ok(cleaned.includes('"target": "es2022"'), 'Should preserve valid JSON content');
    });
});

suite('getLangFromFilename Test Suite', () => {

    test('Maps common JS/TS extensions', () => {
        assert.strictEqual(getLangFromFilename('app.js'), 'js');
        assert.strictEqual(getLangFromFilename('app.jsx'), 'js');
        assert.strictEqual(getLangFromFilename('app.mjs'), 'js');
        assert.strictEqual(getLangFromFilename('index.ts'), 'ts');
        assert.strictEqual(getLangFromFilename('component.tsx'), 'ts');
    });

    test('Maps Python extensions', () => {
        assert.strictEqual(getLangFromFilename('main.py'), 'python');
        assert.strictEqual(getLangFromFilename('script.pyw'), 'python');
    });

    test('Maps C/C++ extensions', () => {
        assert.strictEqual(getLangFromFilename('main.c'), 'c');
        assert.strictEqual(getLangFromFilename('utils.cpp'), 'c');
        assert.strictEqual(getLangFromFilename('header.h'), 'c');
        assert.strictEqual(getLangFromFilename('header.hpp'), 'c');
    });

    test('Maps web extensions', () => {
        assert.strictEqual(getLangFromFilename('style.css'), 'css');
        assert.strictEqual(getLangFromFilename('index.html'), 'html');
        assert.strictEqual(getLangFromFilename('page.htm'), 'html');
    });

    test('Maps other supported languages', () => {
        assert.strictEqual(getLangFromFilename('Main.java'), 'java');
        assert.strictEqual(getLangFromFilename('main.rs'), 'rust');
        assert.strictEqual(getLangFromFilename('main.go'), 'go');
        assert.strictEqual(getLangFromFilename('app.rb'), 'ruby');
        assert.strictEqual(getLangFromFilename('index.php'), 'php');
        assert.strictEqual(getLangFromFilename('App.swift'), 'swift');
        assert.strictEqual(getLangFromFilename('deploy.sh'), 'sh');
        assert.strictEqual(getLangFromFilename('query.sql'), 'sql');
        assert.strictEqual(getLangFromFilename('config.yaml'), 'yaml');
        assert.strictEqual(getLangFromFilename('config.yml'), 'yaml');
        assert.strictEqual(getLangFromFilename('data.json'), 'json');
        assert.strictEqual(getLangFromFilename('script.lua'), 'lua');
        assert.strictEqual(getLangFromFilename('main.dart'), 'dart');
        assert.strictEqual(getLangFromFilename('Main.scala'), 'scala');
        assert.strictEqual(getLangFromFilename('App.kt'), 'kotlin');
    });

    test('Returns null for unsupported extensions', () => {
        assert.strictEqual(getLangFromFilename('image.png'), null);
        assert.strictEqual(getLangFromFilename('data.csv'), null);
        assert.strictEqual(getLangFromFilename('README.md'), null);
        assert.strictEqual(getLangFromFilename('binary.exe'), null);
        assert.strictEqual(getLangFromFilename('noext'), null);
    });
});
