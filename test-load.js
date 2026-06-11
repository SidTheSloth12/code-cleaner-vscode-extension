const Module = require('module');
const originalRequire = Module.prototype.require;
Module.prototype.require = function(request) {
    if (request === 'vscode') {
        return {
            window: { showErrorMessage: () => {} },
            workspace: { onWillSaveTextDocument: () => {} },
            commands: { registerCommand: () => {} },
            Range: class {},
            TextEdit: class {},
        };
    }
    return originalRequire.apply(this, arguments);
};

try {
    require('./out/extension.js');
    console.log('Extension loaded successfully.');
} catch (e) {
    console.error('Failed to load extension:', e);
}
