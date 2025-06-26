# Sudoku WebAssembly Solver & Generator

A modern Sudoku puzzle solver and generator written in Go, compiled to WebAssembly (WASM) for fast, secure, and interactive web use. The project includes a visual solver, human-style solving strategies, and robust domain protection.

## Features

- **Fast Backtracking Solver:** Solves any standard Sudoku puzzle using efficient algorithms.
- **Visual Step-by-Step Solver:** Watch the solving process unfold visually in the browser.
- **Human-Style Strategies:** Implements naked singles and hidden singles for educational solving.
- **Puzzle Generator:** Creates new puzzles with varying difficulty levels (Easy, Medium, Hard).
- **Domain Protection:** Only runs on approved domains (dixon.rs, andydixon.com) using obfuscated logic in WASM.
- **Modern UI:** Responsive interface built with HTML, CSS, and JavaScript.

## Getting Started

### Prerequisites

- Go 1.21+ (with WebAssembly support)
- Node.js (for local development, optional)
- A modern web browser

### Build Instructions

1. **Install Go:** [Download Go](https://golang.org/dl/)
2. **Build WASM:**
   ```sh
   GOOS=js GOARCH=wasm go build -o sudoku.wasm main.go
   ```
3. **Serve Locally:**
   Use any static file server, e.g.:
   ```sh
   python3 -m http.server
   ```
   or
   ```sh
   npx serve .
   ```
4. **Open `index.html` in your browser.**

### File Structure

- `main.go` — Go source code for solver, generator, and WASM bindings
- `app.js` — JavaScript UI logic and WASM integration
- `index.html` — Main web page and UI
- `style.css` — Custom styles for the Sudoku grid and controls
- `wasm_exec.js` — Go's WebAssembly JS runtime
- `Makefile` — Optional build automation

## Security & Domain Protection

This project enforces domain restrictions in the WASM code. If loaded on an unauthorised domain, the UI will display a warning and redirect to the official site after 5 seconds. All domain logic is obfuscated and cannot be bypassed by editing JavaScript.

## Contributing

Pull requests and suggestions are welcome! Please use British English for documentation and comments.

## Author

Andy Dixon — [andydixon.com](https://andydixon.com)

---

For questions or support, please contact me.
