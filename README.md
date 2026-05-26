# Intelligent Code Cleaner

An intelligent, zero-configuration, language-aware extension to clean, compact, and minify your source code directly inside VS Code. 

Whether you want to make your code more readable, strip heavy comments for a production push, or compress your files down to their absolute smallest footprint, this extension provides instant optimization with smart syntax safety guards.

---

## Features

- **Auto-Language Detection:** If your file type is unrecognized, the extension uses a built-in scoring engine to analyze your code and instantly analyze its language architecture.
- **4 Presets (Readable to Nuclear):** Choose exactly how deep you want your cleaning cycle to go.
- **Syntax Safety Guards:** Automatically detects indentation-sensitive languages (like Python and YAML) or newline-sensitive scripts (like SQL and Shell) to prevent you from running destructive operations that would break your code execution.
- **Reduction Metrics:** Instantly notifies you of how many characters were saved and the total file size percentage reduction after every clean.

---

## Cleaning Levels (Presets)

| Level | Description | Comments | Indentation | Blank Lines | Operators | Collapsing |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **READABLE** | Normalises operator spaces; removes empty lines. | Keep | Keep | Remove | Normalise | Keep |
| **COMPACT** | Strips layout noise and notes; keeps structural spacing. | Remove | Keep | Remove | Normalise | Keep |
| **MINIFIED** | Flattens code structure entirely by stripping layout. | Remove | Remove | Remove | Normalise | Keep |
| **NUCLEAR** | Squashes your script into the smallest possible single-line block. | Remove | Remove | Remove | Strip Excess | Compress to 1 Line |

---

## Supported Languages

The engine includes specialized comment stripping and syntax formatting logic for a wide variety of development stacks:
- **Web:** JavaScript, TypeScript, HTML, CSS, JSON
- **Systems & Apps:** C, C++, Rust, Go, Java, Kotlin, Swift, Dart, Scala
- **Scripting & Data:** Python, Ruby, PHP, Lua, SQL, YAML, Shell Script (Bash/Zsh)

---

## How to Use

### Method 1: Right-Click Context Menu
1. Open any source code file.
2. **Right-click** anywhere inside the editor window.
3. Click **"Clean Code Engine..."** at the bottom of the context menu.
4. Select your preferred cleaning depth from the dropdown.

### Method 2: Command Palette
1. Open your code file.
2. Open the Command Palette (`Ctrl+Shift+P` on Windows/Linux or `Cmd+Shift+P` on macOS).
3. Type **"Clean Code Engine..."** and hit `Enter`.
4. Choose your configuration preset.

---

## Syntax Safety Alerts

The extension protects your workflow. If you choose **Minified** or **Nuclear** mode on a language like **Python** or **YAML** (where indentation dictates block structures), a native modal warning will pop up:

> *YAML uses indentation as syntax — removing it will break your code!*

You can choose to override it if you know what you are doing, or cancel safely without touching your file.

