# Code Lean & Clean

**CodeCleaner** is a fast, efficient, and lightweight Visual Studio Code extension that minifies and cleans up code directly within the editor. 

It intelligently trims trailing whitespaces, removes consecutive spaces, removes blank lines, and tightens operators to make your code as compact and clean as possible, all while preserving the logic and syntax of your language.

## Features

- **Removes Comments**: Automatically detects and strips comments across 20+ programming languages (`//`, `/* */`, `#`, `<!-- -->`, `--`).
- **Cleans Whitespace**: Trims leading and trailing spaces, and reduces multiple consecutive spaces to a single space.
- **Removes Blank Lines**: Compacts the code by removing empty lines.
- **Tightens Operators**: Removes spaces around operators like `+`, `=`, `<`, `>`, `===`, etc. for compact representation.
- **Language Aware**: 
  - Safely handles whitespace-dependent languages like Python or YAML by skipping destructive formatting.
  - Smart string and regex literal detection ensures your multi-line strings or regexes are not unintentionally corrupted.
  - Dynamically disables operator tightening for languages like Bash/Shell where spaces are syntactically required.

## Usage

1. Open a file you want to minify.
2. Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`).
3. Type **Clean & Minify Code** and hit enter.
4. Alternatively, select specific lines of code, right-click, and choose **Clean & Minify Code** from the context menu to only minify the selection.

## Supported Languages
Fully tested and configured for Javascript, Typescript, Python, Ruby, C, C++, C#, Java, Rust, Go, PHP, Kotlin, Swift, HTML, CSS, SCSS, JSON, Bash, Shell, PowerShell, YAML, Lua, SQL, Haskell, and more!

