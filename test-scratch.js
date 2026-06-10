const fs = require('fs');
const path = require('path');
const { processCode } = require('./out/extension.js');

// We can't easily extract processCode from the bundle if it's not exported, but it might not be.
// Let's use the compiled core/cleaner.js? Wait, esbuild bundled everything into extension.js.
// Since extension.js doesn't export processCode, let's write a small script to test it using esbuild.
