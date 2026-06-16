# CodeCleaner

**CodeCleaner** is a fast, efficient, and lightweight Visual Studio Code extension that formats, minifies, and cleans up code directly within the editor or across your entire workspace.

Powered by **Web Tree-Sitter** and **Terser**, it intelligently trims trailing whitespaces, removes consecutive spaces, removes blank lines, and tightens operators to make your code as compact and clean as possible, all while preserving the logic and syntax of your language.

## Features

- **Multiple Cleaning Profiles**: Choose how aggressively you want to clean your code via settings (`codeCleaner.profile`):
  - `Format`: Safely standardizes spacing without aggressive minification.
  - `Clean` (Default): Trims whitespaces, removes comments, and tightens operators.
  - `Minify`: Aggressively strips all unnecessary whitespace and newlines for maximum compactness.
  - `Obfuscate`: Mangles variable names and drops console logs (JavaScript/TypeScript only).
- **Clean Entire Folders**: Right-click any folder in the Explorer sidebar and select **CodeCleaner: Clean folder** to recursively format all files inside. Smartly skips `.git`, `node_modules`, `dist`, and other heavy build directories for lightning-fast performance.
- **Clean on Save**: Enable `codeCleaner.cleanOnSave` to automatically tidy your files every time you hit save.
- **Safe JSON Handling**: Configuration files like `.json` and `.jsonc` automatically bypass aggressive minification, keeping them readable and structurally valid.
- **Language Aware**: 
  - Uses robust AST (Abstract Syntax Tree) parsing to safely handle your code.
  - Smart string and regex literal detection ensures your multi-line strings or regexes are not unintentionally corrupted.
  - Dynamically disables operator tightening for languages like Bash/Shell where spaces are syntactically required.

## Usage

### Commands & Shortcuts
1. Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`).
2. Type **CodeCleaner: Clean** and hit enter to clean the current file.
3. Type **CodeCleaner: Clean & Copy** to clean the code and immediately copy it to your clipboard.

### Context Menus
- **Editor:** Select specific lines of code, right-click, and choose **CodeCleaner: Clean** from the context menu to only process the selection.
- **Explorer:** Right-click a folder in the file explorer and select **CodeCleaner: Clean folder** to process all contained files at once.

## Supported Languages
Fully tested and configured for Javascript, Typescript, Python, Ruby, C, C++, C#, Java, Rust, Go, PHP, Kotlin, Swift, HTML, CSS, SCSS, JSON, Bash, Shell, PowerShell, YAML, Lua, SQL, Haskell, and more! JavaScript and TypeScript files benefit from industry-standard Terser integration.

## License
MIT