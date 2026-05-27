import * as assert from 'assert';
import { cleanCode, LEVELS } from '../cleaner';

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
