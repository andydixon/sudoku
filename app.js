/**
 * Initialises the WebAssembly module for Sudoku solving.
 * Loads and runs the WASM, then builds the default 9x9 grid.
 *
 * This uses the Go WASM runtime and fetches the compiled Sudoku solver.
 */
const go = new Go();
WebAssembly.instantiateStreaming(fetch("sudoku.wasm"), go.importObject).then(
  (result) => {
    go.run(result.instance);
    buildGrid(); // Build default 9x9 grid
  }
);

/**
 * Example Sudoku puzzles for demonstration purposes.
 * Each puzzle is represented as a flat array of numbers, where 0 denotes an empty cell.
 */
const examples = {
  easy: [
    5, 3, 0, 0, 7, 0, 0, 0, 0, 6, 0, 0, 1, 9, 5, 0, 0, 0, 0, 9, 8, 0, 0, 0, 0,
    6, 0, 8, 0, 0, 0, 6, 0, 0, 0, 3, 4, 0, 0, 8, 0, 3, 0, 0, 1, 7, 0, 0, 0, 2,
    0, 0, 0, 6, 0, 6, 0, 0, 0, 0, 2, 8, 0, 0, 0, 0, 4, 1, 9, 0, 0, 5, 0, 0, 0,
    0, 8, 0, 0, 7, 9,
  ],
  medium: [
    0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 3, 0,
    0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0, 9, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 4, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 9, 0, 0,
    0, 0, 0, 0, 0, 0,
  ],
  hard: [
    8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 6, 0, 0, 0, 0, 0, 0, 7, 0, 0, 9, 0, 2,
    0, 0, 0, 5, 0, 0, 0, 7, 0, 0, 0, 0, 0, 0, 0, 4, 5, 7, 0, 0, 0, 0, 0, 1, 0,
    0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 0, 6, 8, 0, 0, 8, 5, 0, 0, 0, 1, 0, 0, 9, 0,
    0, 0, 0, 4, 0, 0,
  ],
};

/**
 * Builds the Sudoku grid in the user interface.
 * The grid size is determined by the user's input. Optionally highlights subgrids for clarity.
 *
 * This function clears any previous grid and creates a new one based on the selected size.
 */
function buildGrid() {
  const size = parseInt(document.getElementById("sizeInput").value);
  const grid = document.getElementById("grid");
  grid.innerHTML = "";

  grid.style.setProperty("--size", size);

  const highlightSubgrids = document.getElementById("subgridCheck").checked;
  const subSize = Math.sqrt(size);

  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      const input = document.createElement("input");
      input.type = "number";
      input.min = "1";
      input.max = size.toString();
      input.className = "grid-cell";

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
 * Attempts to solve the current Sudoku puzzle.
 * Can run in instant or visual mode, depending on user selection.
 * Displays the solution or notifies if unsolvable.
 */
function solve() {
  const size = parseInt(document.getElementById("sizeInput").value);
  const inputs = document.querySelectorAll("#grid input");
  const values = [];
  inputs.forEach((i) => values.push(i.value ? parseInt(i.value) : 0));

  const visual = document.getElementById("visualCheck").checked;
  if (visual) {
    const delay = parseInt(document.getElementById("speedRange").value);
    window.solveSudokuVisual(
      size,
      values,
      (row, col, num, action) => {
        const idx = row * size + col;
        const cell = inputs[idx];
        cell.value = num || "";
        cell.classList.remove("try", "backtrack");
        if (action === "try") cell.classList.add("try");
        else if (action === "backtrack") cell.classList.add("backtrack");
      },
      delay
    );

    window.visualDone = (solved) => {
      inputs.forEach((c) => c.classList.remove("try", "backtrack"));
      if (solved) solved.forEach((val, idx) => (inputs[idx].value = val));
      else showToast("No solution found!", "danger");
    };
  } else {
    const solved = window.solveSudoku(size, values);
    if (solved) solved.forEach((val, idx) => (inputs[idx].value = val));
    else showToast("No solution found!", "danger");
  }
}

/**
 * Loads a pre-defined example puzzle into the grid.
 * Sets the grid to 9x9 and marks given cells as read-only.
 */
function loadExample() {
  const choice = document.getElementById("exampleSelect").value;
  if (!choice) return;
  const puzzle = examples[choice];
  document.getElementById("sizeInput").value = 9;
  buildGrid();
  const inputs = document.querySelectorAll("#grid input");
  puzzle.forEach((val, idx) => {
    const cell = inputs[idx];
    cell.value = val === 0 ? "" : val;
    cell.readOnly = val !== 0;
    if (val !== 0) cell.classList.add("given");
  });
}

/**
 * Generates a new Sudoku puzzle using WASM and loads it into the grid.
 * Displays the puzzle's difficulty level to the user.
 */
function generatePuzzle() {
  const result = window.generateSudoku();
  if (!result) return;
  const puzzle = result.puzzle,
    diff = result.difficulty;
  document.getElementById("sizeInput").value = 9;
  buildGrid();
  const inputs = document.querySelectorAll("#grid input");
  puzzle.forEach((val, idx) => {
    const cell = inputs[idx];
    cell.value = val === 0 ? "" : val;
    cell.readOnly = val !== 0;
    if (val !== 0) cell.classList.add("given");
  });
  document.getElementById("difficultyLabel").textContent = diff;
}

/**
 * Clears all entries from the grid, making all cells editable again.
 * Removes any highlighting or status classes from cells.
 */
function clearGrid() {
  const inputs = document.querySelectorAll("#grid input");
  inputs.forEach((cell) => {
    cell.value = "";
    cell.readOnly = false;
    cell.classList.remove(
      "try",
      "backtrack",
      "given",
      "hint",
      "mistake",
      "correct"
    );
  });
}

/**
 * Checks the user's entries against the solution and highlights any mistakes.
 * Mistaken cells are marked and feedback is provided.
 */
function checkMistakes() {
  const size = parseInt(document.getElementById("sizeInput").value);
  const inputs = document.querySelectorAll("#grid input");
  const values = [];
  inputs.forEach((i) => values.push(i.value ? parseInt(i.value) : 0));
  const solved = window.solveSudoku(size, values);
  if (!solved) {
    showToast("No valid solution exists!", "danger");
    return;
  }
  inputs.forEach((cell, idx) => {
    if (cell.value && parseInt(cell.value) !== solved[idx])
      cell.classList.add("mistake");
    else cell.classList.remove("mistake");
    cell.addEventListener("input", () => cell.classList.remove("mistake"), {
      once: true,
    });
  });
}

/**
 * Provides a hint by filling in one empty cell with the correct value.
 * The cell is marked and made read-only to indicate it was filled by the system.
 */
function giveHint() {
  const size = parseInt(document.getElementById("sizeInput").value);
  const inputs = document.querySelectorAll("#grid input");
  const values = [];
  inputs.forEach((i) => values.push(i.value ? parseInt(i.value) : 0));
  const solved = window.solveSudoku(size, values);
  if (!solved) {
    showToast("No valid solution exists!", "danger");
    return;
  }
  const emptyIndices = [];
  inputs.forEach((c, idx) => {
    if (!c.value) emptyIndices.push(idx);
  });
  if (emptyIndices.length === 0) {
    showToast("No empty cells left!", "info");
    return;
  }
  const choice = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
  const cell = inputs[choice];
  cell.value = solved[choice];
  cell.classList.add("hint");
  cell.readOnly = true;
}

/**
 * Validates whether the user's solution is both complete and correct.
 * Highlights mistakes and congratulates the user if the solution is correct.
 */
function validateCompletion() {
  const size = parseInt(document.getElementById("sizeInput").value);
  const inputs = document.querySelectorAll("#grid input");
  const values = [];
  let hasEmpty = false;
  inputs.forEach((i) => {
    if (!i.value) hasEmpty = true;
    values.push(i.value ? parseInt(i.value) : 0);
  });
  if (hasEmpty) {
    showToast("Puzzle not complete!", "warning");
    return;
  }
  const solved = window.solveSudoku(size, values);
  if (!solved) {
    showToast("No valid solution exists!", "danger");
    return;
  }
  let allCorrect = true;
  inputs.forEach((cell, idx) => {
    if (parseInt(cell.value) !== solved[idx]) {
      cell.classList.add("mistake");
      allCorrect = false;
    } else {
      cell.classList.remove("mistake");
      cell.classList.add("correct");
    }
    cell.addEventListener(
      "input",
      () => cell.classList.remove("mistake", "correct"),
      { once: true }
    );
  });
  if (allCorrect) showToast("🎉 Congratulations! Correct solution!", "success");
  else showToast("❌ Mistakes found. Highlighted in red.", "danger");
}

/**
 * Automatically applies human-like solving strategies to the puzzle.
 * Each step is highlighted and explained to the user for educational purposes.
 */
function humanSolveUI() {
  const size = parseInt(document.getElementById("sizeInput").value);
  const inputs = document.querySelectorAll("#grid input");
  const values = [];
  inputs.forEach((i) => values.push(i.value ? parseInt(i.value) : 0));
  const steps = window.humanSolve(size, values);
  if (!steps || steps.length === 0) {
    showToast("No human strategies found!", "danger");
    return;
  }
  let i = 0;
  function applyStep() {
    if (i >= steps.length) {
      showToast(
        "Applied " + steps.length + " human strategy steps.",
        "success"
      );
      return;
    }
    const step = steps[i];
    const idx = step.row * size + step.col;
    const cell = inputs[idx];
    cell.value = step.val;
    cell.readOnly = true;
    cell.classList.add("hint", "strategy-highlight");
    cell.title = step.strategy;
    showToast(
      `Applied ${step.strategy} at (${step.row + 1},${step.col + 1})`,
      "info"
    );
    setTimeout(() => cell.classList.remove("strategy-highlight"), 1000);
    i++;
    setTimeout(applyStep, 1200);
  }
  applyStep();
}

/**
 * Begins step-through mode for human solving strategies.
 * Allows the user to apply each step one at a time for learning purposes.
 */
let stepSolveSteps = [],
  stepSolveIndex = 0;
function startStepSolve() {
  const size = parseInt(document.getElementById("sizeInput").value);
  const inputs = document.querySelectorAll("#grid input");
  const values = [];
  inputs.forEach((i) => values.push(i.value ? parseInt(i.value) : 0));
  stepSolveSteps = window.humanSolve(size, values);
  stepSolveIndex = 0;
  if (!stepSolveSteps || stepSolveSteps.length === 0) {
    showToast("No human strategies available!", "danger");
    return;
  }
  showToast("Step-through mode started. Click 'Next Step'.", "primary");
  document.getElementById("nextStepBtn").classList.remove("d-none");
}
/**
 * Applies the next human solving step in step-through mode.
 * Highlights the cell and provides feedback to the user.
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
    `Step ${stepSolveIndex + 1}: ${step.strategy} at (${step.row + 1},${
      step.col + 1
    })`,
    "info"
  );
  setTimeout(() => cell.classList.remove("strategy-highlight"), 1000);
  stepSolveIndex++;
  if (stepSolveIndex >= stepSolveSteps.length) {
    showToast("Step-through complete!", "success");
    document.getElementById("nextStepBtn").classList.add("d-none");
  }
}

/**
 * Displays a toast notification to the user.
 * Used for feedback, errors, hints, and general messages.
 *
 * @param {string} message - The message to display.
 * @param {string} [type="info"] - The Bootstrap colour type for the toast.
 */
function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  const toast = document.createElement("div");
  toast.className = `toast align-items-center text-bg-${type} border-0`;
  toast.role = "alert";
  toast.ariaLive = "assertive";
  toast.ariaAtomic = "true";
  toast.innerHTML = `<div class="d-flex">
      <div class="toast-body">${message}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
    </div>`;
  container.appendChild(toast);
  const bsToast = new bootstrap.Toast(toast, { delay: 3000 });
  bsToast.show();
  toast.addEventListener("hidden.bs.toast", () => toast.remove());
}

/**
 * Updates the speed value display when the slider is moved.
 * Ensures the user sees the current speed setting in milliseconds.
 */
document.getElementById("speedRange").addEventListener("input", (e) => {
  document.getElementById("speedValue").textContent = e.target.value;
});
