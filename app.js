/**
 * Pure JavaScript Sudoku Solver

 * No WASM here mate, just good old fashioned JavaScript doing the heavy lifting instead of a WASM like before
 *  (c) 2026 Andy Dixon - www.dixon.cx / andydixon.com
 * This whole thing works by trying numbers in empty cells
 * and checking if they're valid. Classic backtracking innit.
 * 
 * Also got some "human" solving strategies in here - those clever tricks 
 * like "naked singles" which sounds rude but it's actually a proper sudoku term
 */

// Just build the grid when the page loads - simple as that
document.addEventListener('DOMContentLoaded', function() {
  buildGrid();
});

/**
 * Pre-made puzzles for the lazy (or those just wanting a quick game)
 * Zero means "empty cell" - everyone knows that by now surely
 */
const examples = {
  easy: [
    5, 3, 0, 0, 7, 0, 0, 0, 0, 
    6, 0, 0, 1, 9, 5, 0, 0, 0, 
    0, 9, 8, 0, 0, 0, 0, 6, 0, 
    8, 0, 0, 0, 6, 0, 0, 0, 3, 
    4, 0, 0, 8, 0, 3, 0, 0, 1, 
    7, 0, 0, 0, 2, 0, 0, 0, 6, 
    0, 6, 0, 0, 0, 0, 2, 8, 0, 
    0, 0, 0, 4, 1, 9, 0, 0, 5, 
    0, 0, 0, 0, 8, 0, 0, 7, 9
  ],
  medium: [
    0, 0, 0, 0, 0, 0, 0, 0, 1, 
    0, 0, 0, 0, 0, 0, 0, 2, 0, 
    0, 0, 0, 0, 0, 3, 0, 0, 0, 
    0, 0, 1, 0, 0, 0, 0, 0, 0, 
    0, 0, 0, 5, 0, 9, 0, 0, 0, 
    0, 0, 0, 0, 0, 0, 4, 0, 0, 
    0, 0, 0, 2, 0, 0, 0, 0, 0, 
    0, 3, 0, 0, 0, 0, 0, 0, 0, 
    9, 0, 0, 0, 0, 0, 0, 0, 0
  ],
  hard: [
    8, 0, 0, 0, 0, 0, 0, 0, 0, 
    0, 0, 3, 6, 0, 0, 0, 0, 0, 
    0, 7, 0, 0, 9, 0, 2, 0, 0, 
    0, 5, 0, 0, 0, 7, 0, 0, 0, 
    0, 0, 0, 0, 4, 5, 7, 0, 0, 
    0, 0, 0, 1, 0, 0, 0, 3, 0, 
    0, 0, 1, 0, 0, 0, 0, 6, 8, 
    0, 0, 8, 5, 0, 0, 0, 1, 0, 
    0, 9, 0, 0, 0, 0, 4, 0, 0
  ],
};

/**
 * Builds the Sudoku grid in the DOM
 * 
 * This takes the size from the input field and creates a proper grid
 * with all the fancy border highlighting for the 3x3 boxes (or whatever size boxes)
 * 
 * Honestly this bit is more about CSS than JS but hey ho
 */
function buildGrid() {
  const size = parseInt(document.getElementById("sizeInput").value);
  const grid = document.getElementById("grid");
  
  // Clear out the old grid - fresh start
  grid.innerHTML = "";

  // Set CSS variable so the grid knows how many columns to make
  grid.style.setProperty("--size", size);

  const highlightSubgrids = document.getElementById("subgridCheck").checked;
  const subSize = Math.sqrt(size); // For a 9x9 grid, boxes are 3x3

  // Create all the input cells
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      const input = document.createElement("input");
      input.type = "number";
      input.min = "1";
      input.max = size.toString();
      input.className = "grid-cell";

      // Add the thick borders to show the subgrids (if enabled and it's a perfect square)
      if (highlightSubgrids && Number.isInteger(subSize)) {
        if (i % subSize === 0) input.classList.add("subgrid-top");
        if (j % subSize === 0) input.classList.add("subgrid-left");
        if (j === size - 1) input.classList.add("subgrid-right");  
        if (i === size - 1) input.classList.add("subgrid-bottom");
      }
      
      grid.appendChild(input);
    }
  }
}

/**
 * Check if sticking a number in a specific spot is actually legal
 * 
 * Has to check:
 * - Same row (no duplicates obviously)
 * - Same column (same deal)
 * - Same 3x3 box or whatever sized box we're using
 * 
 * Returns true if the number can go there, false if it's gonna break the rules
 */
function isSafe(grid, row, col, num, size) {
  // Check row and column in one loop - efficient innit
  for (let x = 0; x < size; x++) {
    if (grid[row][x] === num || grid[x][col] === num) {
      return false;
    }
  }

  // Now check the box (3x3 or whatever)
  const subSize = Math.floor(Math.sqrt(size));
  const startRow = row - (row % subSize);
  const startCol = col - (col % subSize);

  for (let i = 0; i < subSize; i++) {
    for (let j = 0; j < subSize; j++) {
      if (grid[startRow + i][startCol + j] === num) {
        return false;
      }
    }
  }

  return true; // All good!
}

/**
 * The main solving algorithm - classic backtracking
 * 
 * Basically tries every number in every empty cell until it finds something that works
 * If it gets stuck, it backs up and tries something different
 * 
 * It's brute force but it's reliable as hell
 */
function solveBacktrack(grid, size) {
  // Find the next empty cell
  let row = -1;
  let col = -1;
  let isEmpty = true;

  for (let i = 0; i < size && isEmpty; i++) {
    for (let j = 0; j < size && isEmpty; j++) {
      if (grid[i][j] === 0) {
        row = i;
        col = j;
        isEmpty = false; // Found an empty cell, stop looking
      }
    }
  }

  // If no empty cell found, puzzle is solved!
  if (isEmpty) {
    return true;
  }

  // Try numbers 1 through 9 (or whatever the size is)
  for (let num = 1; num <= size; num++) {
    if (isSafe(grid, row, col, num, size)) {
      grid[row][col] = num; // Stick it in

      // Recursively solve the rest
      if (solveBacktrack(grid, size)) {
        return true; // Sorted!
      }

      // That didn't work, so backtrack
      grid[row][col] = 0;
    }
  }

  return false; // Tried everything, no solution exists
}

/**
 * Visual solving - same as regular solve but with pretty animations
 * 
 * This one calls a callback function for each step so you can see it working
 * Runs in a separate "thread" (well, async) so it doesn't freeze the page
 */
async function solveBacktrackVisual(grid, size, callback, delay) {
  // Find empty cell
  let row = -1;
  let col = -1;
  let isEmpty = true;

  for (let i = 0; i < size && isEmpty; i++) {
    for (let j = 0; j < size && isEmpty; j++) {
      if (grid[i][j] === 0) {
        row = i;
        col = j;
        isEmpty = false;
      }
    }
  }

  if (isEmpty) {
    return true; // Done!
  }

  // Try each number
  for (let num = 1; num <= size; num++) {
    if (isSafe(grid, row, col, num, size)) {
      grid[row][col] = num;
      
      // Show what we're trying
      if (callback) {
        callback(row, col, num, "try");
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      // Keep going
      if (await solveBacktrackVisual(grid, size, callback, delay)) {
        return true;
      }

      // Nope, didn't work - backtrack
      grid[row][col] = 0;
      
      if (callback) {
        callback(row, col, 0, "backtrack");
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  return false;
}

/**
 * Converts flat array to 2D grid because that's easier to work with
 * 
 * Flat arrays are horrible for sudoku - 2D is much more natural
 */
function flatToGrid(flat, size) {
  const grid = [];
  for (let i = 0; i < size; i++) {
    const row = [];
    for (let j = 0; j < size; j++) {
      row.push(flat[i * size + j]);
    }
    grid.push(row);
  }
  return grid;
}

/**
 * Converts 2D grid back to flat array for displaying in the UI
 */
function gridToFlat(grid) {
  const flat = [];
  for (let i = 0; i < grid.length; i++) {
    for (let j = 0; j < grid[i].length; j++) {
      flat.push(grid[i][j]);
    }
  }
  return flat;
}

/**
 * Main solve function that gets called when you click the solve button
 * 
 * Can do it instantly or with visual mode enabled
 * Visual mode is slower but looks dead cool
 */
async function solve() {
  const size = parseInt(document.getElementById("sizeInput").value);
  const inputs = document.querySelectorAll("#grid input");
  const values = [];
  
  // Grab all the values from the grid
  inputs.forEach((input) => {
    const val = input.value ? parseInt(input.value) : 0;
    values.push(val);
  });

  const visual = document.getElementById("visualCheck").checked;

  if (visual) {
    // Visual solve - nice and slow so you can watch
    const delay = parseInt(document.getElementById("speedRange").value);
    const grid = flatToGrid(values, size);

    const solved = await solveBacktrackVisual(grid, size, (row, col, num, action) => {
      const idx = row * size + col;
      const cell = inputs[idx];
      cell.value = num || "";
      cell.classList.remove("try", "backtrack");
      
      if (action === "try") {
        cell.classList.add("try");
      } else if (action === "backtrack") {
        cell.classList.add("backtrack");
      }
    }, delay);

    // Clean up classes when done
    inputs.forEach((c) => c.classList.remove("try", "backtrack"));

    if (solved) {
      const result = gridToFlat(grid);
      result.forEach((val, idx) => {
        inputs[idx].value = val;
      });
      showToast("Puzzle solved! 🎉", "success");
    } else {
      showToast("No solution found!", "danger");
    }
  } else {
    // Instant solve - just do it quick
    const grid = flatToGrid(values, size);
    
    if (solveBacktrack(grid, size)) {
      const result = gridToFlat(grid);
      result.forEach((val, idx) => {
        inputs[idx].value = val;
      });
      showToast("Solved!", "success");
    } else {
      showToast("No solution found!", "danger");
    }
  }
}

/**
 * Loads one of the example puzzles into the grid
 * 
 * Makes the given cells read-only so you can't accidentally change them
 * (Because let's be honest, that's annoying when it happens)
 */
function loadExample() {
  const choice = document.getElementById("exampleSelect").value;
  if (!choice) return; // Nothing selected, don't do anything
  
  const puzzle = examples[choice];
  document.getElementById("sizeInput").value = 9; // Examples are all 9x9
  buildGrid();
  
  const inputs = document.querySelectorAll("#grid input");
  puzzle.forEach((val, idx) => {
    const cell = inputs[idx];
    cell.value = val === 0 ? "" : val;
    cell.readOnly = val !== 0; // Lock the given numbers
    if (val !== 0) {
      cell.classList.add("given"); // Style them differently
    }
  });
}

/**
 * Clears the entire grid
 * 
 * Gets rid of all values and makes everything editable again
 * Fresh start basically
 */
function clearGrid() {
  const inputs = document.querySelectorAll("#grid input");
  inputs.forEach((cell) => {
    cell.value = "";
    cell.readOnly = false;
    // Remove all the fancy classes we might have added
    cell.classList.remove("try", "backtrack", "given", "hint", "mistake", "correct");
  });
}

/**
 * Checks if any of the user's entered numbers are wrong
 * 
 * Solves the puzzle first, then compares what they've entered
 * Highlights mistakes in red so they can fix them
 */
function checkMistakes() {
  const size = parseInt(document.getElementById("sizeInput").value);
  const inputs = document.querySelectorAll("#grid input");
  const values = [];
  
  inputs.forEach((i) => {
    values.push(i.value ? parseInt(i.value) : 0);
  });

  // First, solve it to get the correct answer
  const grid = flatToGrid(values, size);
  if (!solveBacktrack(grid, size)) {
    showToast("No valid solution exists!", "danger");
    return;
  }
  
  const solved = gridToFlat(grid);

  // Now check what they've entered against the solution
  inputs.forEach((cell, idx) => {
    if (cell.value && parseInt(cell.value) !== solved[idx]) {
      cell.classList.add("mistake");
    } else {
      cell.classList.remove("mistake");
    }
    
    // Remove the mistake class when they edit the cell
    cell.addEventListener("input", () => {
      cell.classList.remove("mistake");
    }, { once: true });
  });
}

/**
 * Gives the user a hint by filling in one random empty cell
 * 
 * Picks a random empty cell and fills it with the correct number
 * Marks it as a hint so they know it wasn't them who filled it in
 */
function giveHint() {
  const size = parseInt(document.getElementById("sizeInput").value);
  const inputs = document.querySelectorAll("#grid input");
  const values = [];
  
  inputs.forEach((i) => {
    values.push(i.value ? parseInt(i.value) : 0);
  });

  // Solve the puzzle
  const grid = flatToGrid(values, size);
  if (!solveBacktrack(grid, size)) {
    showToast("No valid solution exists!", "danger");
    return;
  }
  
  const solved = gridToFlat(grid);

  // Find all the empty cells
  const emptyIndices = [];
  inputs.forEach((c, idx) => {
    if (!c.value) {
      emptyIndices.push(idx);
    }
  });

  if (emptyIndices.length === 0) {
    showToast("No empty cells left!", "info");
    return;
  }

  // Pick a random empty cell
  const randomIdx = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
  const cell = inputs[randomIdx];
  cell.value = solved[randomIdx];
  cell.classList.add("hint");
  cell.readOnly = true; // Lock it so they don't change it
}

/**
 * Validates whether the puzzle is completed correctly
 * 
 * Checks if:
 * 1. All cells are filled
 * 2. The solution is actually correct
 * 
 * Then gives them a pat on the back (or tells them what's wrong)
 */
function validateCompletion() {
  const size = parseInt(document.getElementById("sizeInput").value);
  const inputs = document.querySelectorAll("#grid input");
  const values = [];
  let hasEmpty = false;

  inputs.forEach((i) => {
    if (!i.value) {
      hasEmpty = true;
    }
    values.push(i.value ? parseInt(i.value) : 0);
  });

  if (hasEmpty) {
    showToast("Puzzle not complete!", "warning");
    return;
  }

  // Check if it's correct by solving from this state
  const grid = flatToGrid(values, size);
  const gridCopy = grid.map(row => [...row]); // Make a copy
  
  if (!solveBacktrack(gridCopy, size)) {
    showToast("No valid solution exists!", "danger");
    return;
  }

  const solved = gridToFlat(gridCopy);
  let allCorrect = true;

  inputs.forEach((cell, idx) => {
    if (parseInt(cell.value) !== solved[idx]) {
      cell.classList.add("mistake");
      allCorrect = false;
    } else {
      cell.classList.remove("mistake");
      cell.classList.add("correct");
    }
    
    // Clean up on edit
    cell.addEventListener("input", () => {
      cell.classList.remove("mistake", "correct");
    }, { once: true });
  });

  if (allCorrect) {
    showToast("🎉 Congratulations! Correct solution!", "success");
  } else {
    showToast("❌ Mistakes found. Highlighted in red.", "danger");
  }
}

// ==================== HUMAN SOLVING STRATEGIES ====================
// This is the clever bit - strategies that humans actually use to solve sudoku
// Rather than just brute forcing it like the backtracking algorithm does

/**
 * Finds "naked singles" - cells where only one number is possible
 * 
 * These are the easy ones that humans spot first
 * If a cell can only have one possible number, that's a naked single
 */
function findNakedSingle(grid, size) {
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === 0) {
        // Cell is empty, check what numbers are possible
        const candidates = [];
        
        for (let num = 1; num <= size; num++) {
          if (isSafe(grid, r, c, num, size)) {
            candidates.push(num);
          }
        }

        // If only one number is possible, we found a naked single!
        if (candidates.length === 1) {
          return { row: r, col: c, val: candidates[0], strategy: "Naked Single" };
        }
      }
    }
  }
  
  return null; // No naked singles found
}

/**
 * Finds "hidden singles" - numbers that can only go in one place in a row/column/box
 * 
 * This is a bit more advanced than naked singles
 * If a number can only fit in one cell in a row/column/box, that's a hidden single
 */
function findHiddenSingle(grid, size) {
  const subSize = Math.floor(Math.sqrt(size));

  // Check each row
  for (let r = 0; r < size; r++) {
    for (let num = 1; num <= size; num++) {
      let count = 0;
      let position = -1;
      
      for (let c = 0; c < size; c++) {
        if (grid[r][c] === 0 && isSafe(grid, r, c, num, size)) {
          count++;
          position = c;
        }
      }
      
      // If this number can only go in one place in this row, found it!
      if (count === 1) {
        return { row: r, col: position, val: num, strategy: "Hidden Single (Row)" };
      }
    }
  }

  // Check each column
  for (let c = 0; c < size; c++) {
    for (let num = 1; num <= size; num++) {
      let count = 0;
      let position = -1;
      
      for (let r = 0; r < size; r++) {
        if (grid[r][c] === 0 && isSafe(grid, r, c, num, size)) {
          count++;
          position = r;
        }
      }
      
      if (count === 1) {
        return { row: position, col: c, val: num, strategy: "Hidden Single (Column)" };
      }
    }
  }

  // Check each box
  for (let boxRow = 0; boxRow < size; boxRow += subSize) {
    for (let boxCol = 0; boxCol < size; boxCol += subSize) {
      for (let num = 1; num <= size; num++) {
        let count = 0;
        let posR = -1;
        let posC = -1;
        
        for (let i = 0; i < subSize; i++) {
          for (let j = 0; j < subSize; j++) {
            const r = boxRow + i;
            const c = boxCol + j;
            
            if (grid[r][c] === 0 && isSafe(grid, r, c, num, size)) {
              count++;
              posR = r;
              posC = c;
            }
          }
        }
        
        if (count === 1) {
          return { row: posR, col: posC, val: num, strategy: "Hidden Single (Box)" };
        }
      }
    }
  }

  return null; // No hidden singles found
}

/**
 * Applies human solving strategies step by step
 * 
 * Returns an array of steps that a human would take
 * Each step includes the cell position, value, and which strategy was used
 */
function humanSolve(grid, size) {
  const steps = [];
  let changed = true;

  // Keep applying strategies until we can't find any more moves
  while (changed) {
    changed = false;

    // Try naked singles first (they're the easiest)
    const nakedSingle = findNakedSingle(grid, size);
    if (nakedSingle) {
      grid[nakedSingle.row][nakedSingle.col] = nakedSingle.val;
      steps.push(nakedSingle);
      changed = true;
      continue; // Found something, start over
    }

    // Try hidden singles next
    const hiddenSingle = findHiddenSingle(grid, size);
    if (hiddenSingle) {
      grid[hiddenSingle.row][hiddenSingle.col] = hiddenSingle.val;
      steps.push(hiddenSingle);
      changed = true;
      continue;
    }
  }

  return steps;
}

/**
 * UI function for the "Human Solve" button
 * 
 * Applies all the human strategies automatically with nice animations
 * Shows what strategy was used for each step (educational innit)
 */
async function humanSolveUI() {
  const size = parseInt(document.getElementById("sizeInput").value);
  const inputs = document.querySelectorAll("#grid input");
  const values = [];
  
  inputs.forEach((i) => {
    values.push(i.value ? parseInt(i.value) : 0);
  });

  const grid = flatToGrid(values, size);
  const steps = humanSolve(grid, size);

  if (!steps || steps.length === 0) {
    showToast("No human strategies found! Might need backtracking for this one.", "danger");
    return;
  }

  // Apply each step with a delay so you can see what's happening
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const idx = step.row * size + step.col;
    const cell = inputs[idx];
    
    cell.value = step.val;
    cell.readOnly = true;
    cell.classList.add("hint", "strategy-highlight");
    cell.title = step.strategy; // Show strategy on hover
    
    showToast(`Applied ${step.strategy} at (${step.row + 1},${step.col + 1})`, "info");
    
    // Wait a bit before doing the next one
    await new Promise(resolve => setTimeout(resolve, 1200));
    cell.classList.remove("strategy-highlight");
  }

  showToast(`Applied ${steps.length} human strategy steps.`, "success");
}

// Global variables for step-through mode
// (Yeah I know, globals are bad, but this is the easiest way for this)
let stepSolveSteps = [];
let stepSolveIndex = 0;

/**
 * Starts step-through mode for human solving
 * 
 * Calculates all the steps but doesn't apply them yet
 * User can then click "Next Step" to apply them one at a time
 */
function startStepSolve() {
  const size = parseInt(document.getElementById("sizeInput").value);
  const inputs = document.querySelectorAll("#grid input");
  const values = [];
  
  inputs.forEach((i) => {
    values.push(i.value ? parseInt(i.value) : 0);
  });

  const grid = flatToGrid(values, size);
  stepSolveSteps = humanSolve(grid, size);
  stepSolveIndex = 0;

  if (!stepSolveSteps || stepSolveSteps.length === 0) {
    showToast("No human strategies available!", "danger");
    return;
  }

  showToast("Step-through mode started. Click 'Next Step'.", "primary");
  document.getElementById("nextStepBtn").classList.remove("d-none");
}

/**
 * Applies the next step in step-through mode
 * 
 * Shows which cell and what strategy is being used
 * Hides the button when we run out of steps
 */
function applyNextStep() {
  if (stepSolveIndex >= stepSolveSteps.length) {
    showToast("No more steps available.", "warning");
    document.getElementById("nextStepBtn").classList.add("d-none");
    return;
  }

  const size = parseInt(document.getElementById("sizeInput").value);
  const inputs = document.querySelectorAll("#grid input");
  const step = stepSolveSteps[stepSolveIndex];
  const idx = step.row * size + step.col;
  const cell = inputs[idx];

  cell.value = step.val;
  cell.readOnly = true;
  cell.classList.add("hint", "strategy-highlight");
  cell.title = step.strategy;

  showToast(
    `Step ${stepSolveIndex + 1}: ${step.strategy} at (${step.row + 1},${step.col + 1})`,
    "info"
  );

  setTimeout(() => {
    cell.classList.remove("strategy-highlight");
  }, 1000);

  stepSolveIndex++;

  if (stepSolveIndex >= stepSolveSteps.length) {
    showToast("Step-through complete!", "success");
    document.getElementById("nextStepBtn").classList.add("d-none");
  }
}

// ==================== PUZZLE GENERATION ====================
// This bit creates new random sudoku puzzles
// It's actually quite tricky to make good ones that have unique solutions

/**
 * Fills the diagonal boxes with random numbers
 * 
 * These boxes don't interfere with each other, so we can fill them independently
 * Makes the generation process faster
 */
function fillDiagonalBoxes(grid, size) {
  const subSize = Math.floor(Math.sqrt(size));
  
  // Fill each diagonal box
  for (let box = 0; box < size; box += subSize) {
    fillBox(grid, box, box, subSize, size);
  }
}

/**
 * Fills a single box with random numbers 1 to 9
 * 
 * Uses a shuffled array so we don't repeat numbers
 */
function fillBox(grid, row, col, subSize, size) {
  // Create array of numbers 1 to size
  const numbers = [];
  for (let i = 1; i <= size; i++) {
    numbers.push(i);
  }
  
  // Shuffle them (Fisher-Yates shuffle)
  for (let i = numbers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [numbers[i], numbers[j]] = [numbers[j], numbers[i]]; // Swap
  }

  // Fill the box with the shuffled numbers
  let idx = 0;
  for (let i = 0; i < subSize; i++) {
    for (let j = 0; j < subSize; j++) {
      grid[row + i][col + j] = numbers[idx];
      idx++;
    }
  }
}

/**
 * Removes random cells from the solved grid to create the puzzle
 * 
 * The number of cells removed determines the difficulty
 * More removed = harder puzzle
 */
function removeCells(grid, size, count) {
  let removed = 0;
  
  while (removed < count) {
    const i = Math.floor(Math.random() * size);
    const j = Math.floor(Math.random() * size);
    
    if (grid[i][j] !== 0) {
      grid[i][j] = 0;
      removed++;
    }
  }
}

/**
 * Generates a brand new random sudoku puzzle
 * 
 * Process:
 * 1. Fill diagonal boxes with random numbers
 * 2. Solve the rest using backtracking
 * 3. Remove random cells to create the puzzle
 * 4. Figure out how hard it is based on how many clues are left
 */
function generatePuzzle() {
  const size = 9; // Only do 9x9 for now
  const grid = [];
  
  // Create empty grid
  for (let i = 0; i < size; i++) {
    grid[i] = [];
    for (let j = 0; j < size; j++) {
      grid[i][j] = 0;
    }
  }

  // Fill it up
  fillDiagonalBoxes(grid, size);
  solveBacktrack(grid, size); // Finish solving it

  // Remove cells to create the puzzle
  // Random number between 22 and 35 clues
  const clues = Math.floor(Math.random() * 14) + 22;
  removeCells(grid, size, 81 - clues);

  // Figure out difficulty based on number of clues
  let difficulty = "Hard";
  if (clues >= 35) {
    difficulty = "Easy";
  } else if (clues >= 28) {
    difficulty = "Medium";
  }

  // Load it into the grid
  document.getElementById("sizeInput").value = 9;
  buildGrid();

  const inputs = document.querySelectorAll("#grid input");
  const flatPuzzle = gridToFlat(grid);
  
  flatPuzzle.forEach((val, idx) => {
    const cell = inputs[idx];
    cell.value = val === 0 ? "" : val;
    cell.readOnly = val !== 0;
    if (val !== 0) {
      cell.classList.add("given");
    }
  });

  document.getElementById("difficultyLabel").textContent = difficulty;
}

/**
 * Shows a toast notification to the user
 * 
 * Uses Bootstrap's toast component for the nice animations
 * Automatically disappears after 3 seconds
 */
function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  const toast = document.createElement("div");
  
  toast.className = `toast align-items-center text-bg-${type} border-0`;
  toast.role = "alert";
  toast.ariaLive = "assertive";
  toast.ariaAtomic = "true";
  
  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${message}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
    </div>
  `;
  
  container.appendChild(toast);
  
  const bsToast = new bootstrap.Toast(toast, { delay: 3000 });
  bsToast.show();
  
  // Remove from DOM when hidden
  toast.addEventListener("hidden.bs.toast", () => {
    toast.remove();
  });
}

/**
 * Updates the speed display when the slider moves
 * 
 * Just shows the current value next to the slider
 * Nothing fancy but it's nice to see what you're setting
 */
document.getElementById("speedRange").addEventListener("input", (e) => {
  document.getElementById("speedValue").textContent = e.target.value;
});
