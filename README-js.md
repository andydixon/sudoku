# Sudoku Solver - Pure JavaScript Edition

Right then, this is a fully-fledged Sudoku solver and generator written entirely in JavaScript. No WASM, no fancy compilation - just plain old JavaScript doing all the work.

## What's In Here

- **Backtracking Solver**: Classic brute-force algorithm that tries every possibility until it finds a solution
- **Visual Solving Mode**: Watch the algorithm work in real-time with pretty animations
- **Human Solving Strategies**: Implements proper techniques like naked singles and hidden singles (the stuff humans actually use)
- **Puzzle Generator**: Creates random puzzles with varying difficulty levels
- **Validation Tools**: Check your work, get hints, and validate your solution

## Features

### Solving

- Instant solving using backtracking algorithm
- Visual mode with adjustable speed so you can watch it work
- Human-style solving that explains each step

### Grid Management

- Variable grid sizes (4x4 up to 16x16, though 9x9 is the standard)
- Highlight subgrids option for easier viewing
- Pre-loaded example puzzles (easy, medium, hard)

### Helper Functions

- **Check Mistakes**: Highlights incorrect entries in red
- **Give Hint**: Fills in one random cell correctly
- **Validate Completion**: Checks if your solution is correct
- **Step Through**: Apply human strategies one step at a time

### Generation

- Random puzzle generation with automatic difficulty rating
- Guarantees unique solutions (well, should do anyway)

## How To Use

1. Open `index.html` in your browser
2. Either load an example puzzle or generate a new one
3. Fill in some numbers or let it solve automatically
4. Use the various tools to check your work or get help

## Technical Bits

The code uses:

- Pure JavaScript (ES6+) - no frameworks, no WASM
- Async/await for the visual solving animations
- Bootstrap 5 for the UI (makes it look decent without much effort)
- Classic backtracking algorithm for solving
- Human-strategy pattern matching for educational solving

## The Algorithm

### Backtracking Solver

Tries every number 1-9 in each empty cell. If a number works, it moves on. If it gets stuck, it backtracks and tries a different number. Dead simple but effective.

### Human Strategies

- **Naked Singles**: Cells where only one number is possible
- **Hidden Singles**: Numbers that can only go in one place in a row/column/box

These are the strategies humans actually use to solve sudoku, rather than just guessing and checking.

## Browser Compatibility

Should work in any modern browser that supports:

- ES6 JavaScript
- Async/await
- CSS Grid
- Probably needs Chrome/Firefox/Safari from the last few years

## Running Locally

Just open `index.html` in your browser. No build step, no npm, no nonsense.

If you want a proper server:

```bash
python3 -m http.server 8000
# Then visit http://localhost:8000
```

## Credits

Written in proper British English because that's the correct way to do it.

Comments are deliberately verbose and human-readable because clean code should explain itself.
