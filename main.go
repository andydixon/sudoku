// Sudoku Solver and Generator (WASM)
// This file contains the logic for solving, generating, and visualising Sudoku puzzles in Go, compiled to WebAssembly.
// All comments and documentation use British English and are written to be clear and human-readable.

package main

import (
	"math/rand"
	"strings" // Added for robust string operations
	"syscall/js"
	"time"
)

// decodeDomain decodes an array of integer character codes into a string.
// Used to obfuscate domain names and messages, making them difficult to tamper with using a hex editor.
func decodeDomain(arr []int) string {
	s := ""
	for _, v := range arr {
		s += string(rune(v))
	}
	return s
}

// checkAllowedHost ensures the code only runs on permitted domains.
// If the hostname is not allowed, a toast is shown and the user is redirected after 5 seconds.
// Allowed domains are dixon.rs and andydixon.com, stored in obfuscated form for security.
func checkAllowedHost() bool {
	allowed := [][]int{
		{100,105,120,111,110,46,114,115}, // dixon.rs
		{97,110,100,121,100,105,120,111,110,46,99,111,109}, // andydixon.com
	}
	host := js.Global().Get("window").Get("location").Get("hostname").String()
	valid := false
	for _, arr := range allowed {
		if len(host) >= len(decodeDomain(arr)) && strings.Contains(host, decodeDomain(arr)) {
			valid = true
			break
		}
	}
	if !valid {
		// Message and redirect URL are obfuscated for security
		msg := decodeDomain([]int{67,111,100,101,32,104,97,115,32,98,101,101,110,32,115,116,111,108,101,110,46,32,82,101,100,105,114,101,99,116,105,110,103,32,105,110,32,53,32,115,101,99,111,110,100,115,46})
		js.Global().Call("showToast", msg, "danger")
		js.Global().Call("setTimeout", js.FuncOf(func(this js.Value, args []js.Value) interface{} {
			js.Global().Get("window").Set("location", decodeDomain([]int{104,116,116,112,115,58,47,47,115,117,100,111,107,117,46,100,105,120,111,110,46,114,115}))
			return nil
		}), 5000)
		return false
	}
	return true
}

// visualSolve enables step-by-step visualisation of the solving process.
var visualSolve bool
// stepCallback is the JavaScript callback for visual solving steps.
var stepCallback js.Value
// stepDelay is the delay between visual solving steps.
var stepDelay time.Duration

// main initialises the WASM module and exposes Go functions to JavaScript.
func main() {
	c := make(chan struct{}, 0)

	js.Global().Set("solveSudoku", js.FuncOf(solveSudoku))
	js.Global().Set("solveSudokuVisual", js.FuncOf(solveSudokuVisual))
	js.Global().Set("generateSudoku", js.FuncOf(generateSudoku))
	js.Global().Set("humanSolve", js.FuncOf(humanSolve))

	<-c
}

// ---------- Standard Backtracking Solver ----------
// These functions implement the classic backtracking algorithm for solving Sudoku puzzles.

// solveSudoku solves the puzzle using standard backtracking.
// Returns the solved grid as a flat array, or null if unsolvable or not allowed.
func solveSudoku(this js.Value, args []js.Value) interface{} {
	if !checkAllowedHost() {
		return js.Null()
	}
	size := args[0].Int()
	grid := argsToGrid(args, size)
	if solve(grid, size) {
		return gridToFlat(grid)
	}
	return js.Null()
}

// solveSudokuVisual solves the puzzle visually, calling back to JS for each step.
// Returns null, but calls JS with each step and the final result.
func solveSudokuVisual(this js.Value, args []js.Value) interface{} {
	if !checkAllowedHost() {
		return js.Null()
	}
	size := args[0].Int()
	grid := argsToGrid(args, size)
	stepCallback = args[2]
	delayMs := args[3].Int()
	stepDelay = time.Duration(delayMs) * time.Millisecond
	visualSolve = true

	go func() {
		if solve(grid, size) {
			js.Global().Call("visualDone", gridToFlat(grid))
		} else {
			js.Global().Call("visualDone", js.Null())
		}
	}()
	return js.Null()
}

// solve is the recursive backtracking solver for Sudoku.
// Returns true if solved, false otherwise.
func solve(grid [][]int, n int) bool {
	row, col := -1, -1
	found := false
	for i := 0; i < n; i++ {
		for j := 0; j < n; j++ {
			if grid[i][j] == 0 {
				row, col = i, j
				found = true
				break
			}
		}
		if found {
			break
		}
	}
	if !found {
		return true
	}

	for num := 1; num <= n; num++ {
		if isSafe(grid, row, col, num, n) {
			grid[row][col] = num
			if visualSolve && stepCallback.Truthy() {
				stepCallback.Invoke(row, col, num, "try")
				time.Sleep(stepDelay)
			}
			if solve(grid, n) {
				return true
			}
			grid[row][col] = 0
			if visualSolve && stepCallback.Truthy() {
				stepCallback.Invoke(row, col, 0, "backtrack")
				time.Sleep(stepDelay)
			}
		}
	}
	return false
}

// ---------- Human-Style Solving ----------
// These functions implement strategies that mimic how a human would solve Sudoku puzzles, such as naked singles and hidden singles.

// findNakedSingle finds cells with only one possible value (naked singles).
// Returns row, col, value, and true if found; otherwise returns false.
func findNakedSingle(grid [][]int, n int) (int, int, int, bool) {
	for r := 0; r < n; r++ {
		for c := 0; c < n; c++ {
			if grid[r][c] == 0 {
				candidates := []int{}
				for num := 1; num <= n; num++ {
					if isSafe(grid, r, c, num, n) {
						candidates = append(candidates, num)
					}
				}
				if len(candidates) == 1 {
					return r, c, candidates[0], true
				}
			}
		}
	}
	return -1, -1, -1, false
}

// findHiddenSingle finds cells where a value can only go in one place in a row, column, or box.
// Returns row, col, value, and true if found; otherwise returns false.
func findHiddenSingle(grid [][]int, n int) (int, int, int, bool) {
	subSize := intSqrt(n)

	// rows
	for r := 0; r < n; r++ {
		for num := 1; num <= n; num++ {
			count := 0
			pos := -1
			for c := 0; c < n; c++ {
				if grid[r][c] == 0 && isSafe(grid, r, c, num, n) {
					count++
					pos = c
				}
			}
			if count == 1 {
				return r, pos, num, true
			}
		}
	}
	// cols
	for c := 0; c < n; c++ {
		for num := 1; num <= n; num++ {
			count := 0
			pos := -1
			for r := 0; r < n; r++ {
				if grid[r][c] == 0 && isSafe(grid, r, c, num, n) {
					count++
					pos = r
				}
			}
			if count == 1 {
				return pos, c, num, true
			}
		}
	}
	// boxes
	for boxRow := 0; boxRow < n; boxRow += subSize {
		for boxCol := 0; boxCol < n; boxCol += subSize {
			for num := 1; num <= n; num++ {
				count := 0
				posR, posC := -1, -1
				for r := 0; r < subSize; r++ {
					for c := 0; c < subSize; c++ {
						rr := boxRow + r
						cc := boxCol + c
						if grid[rr][cc] == 0 && isSafe(grid, rr, cc, num, n) {
							count++
							posR, posC = rr, cc
						}
					}
				}
				if count == 1 {
					return posR, posC, num, true
				}
			}
		}
	}
	return -1, -1, -1, false
}

// humanSolve applies human-style strategies to solve the puzzle step by step.
// Returns a JS array of steps taken, or null if not allowed.
func humanSolve(this js.Value, args []js.Value) interface{} {
	if !checkAllowedHost() {
		return js.Null()
	}
	size := args[0].Int()
	grid := argsToGrid(args, size)

	var steps []map[string]interface{}
	changed := true
	for changed {
		changed = false
		if r, c, val, ok := findNakedSingle(grid, size); ok {
			grid[r][c] = val
			steps = append(steps, map[string]interface{}{
				"row":      r,
				"col":      c,
				"val":      val,
				"strategy": "Naked Single",
			})
			changed = true
			continue
		}
		if r, c, val, ok := findHiddenSingle(grid, size); ok {
			grid[r][c] = val
			steps = append(steps, map[string]interface{}{
				"row":      r,
				"col":      c,
				"val":      val,
				"strategy": "Hidden Single",
			})
			changed = true
			continue
		}
	}

	// Build a JS array of steps for the UI
	jsSteps := js.Global().Get("Array").New()
	for _, step := range steps {
		jsStep := js.ValueOf(map[string]interface{}{
			"row":      step["row"],
			"col":      step["col"],
			"val":      step["val"],
			"strategy": step["strategy"],
		})
		jsSteps.Call("push", jsStep)
	}

	return jsSteps
}

// ---------- Generator ----------
// Functions for generating new Sudoku puzzles, including randomisation and difficulty setting.

// generateSudoku creates a new Sudoku puzzle and returns it to JS.
// Returns a map with the puzzle and its difficulty, or null if not allowed.
func generateSudoku(this js.Value, args []js.Value) interface{} {
	if !checkAllowedHost() {
		return js.Null()
	}
	size := 9
	grid := make([][]int, size)
	for i := range grid {
		grid[i] = make([]int, size)
	}
	rand.Seed(time.Now().UnixNano())
	fillDiagonalBoxes(grid, size)
	solve(grid, size)
	clues := rand.Intn(14) + 22 // 22–35 clues
	removeCells(grid, size, 81-clues)
	difficulty := "Hard"
	if clues >= 35 {
		difficulty = "Easy"
	} else if clues >= 28 {
		difficulty = "Medium"
	}
	flatPuzzle := []interface{}{}
	for i := 0; i < size; i++ {
		for j := 0; j < size; j++ {
			flatPuzzle = append(flatPuzzle, grid[i][j])
		}
	}
	return js.ValueOf(map[string]interface{}{
		"puzzle":     flatPuzzle,
		"difficulty": difficulty,
	})
}

// fillDiagonalBoxes fills the diagonal subgrids with random numbers.
func fillDiagonalBoxes(grid [][]int, n int) {
	subSize := intSqrt(n)
	for k := 0; k < n; k += subSize {
		fillBox(grid, k, k, subSize, n)
	}
}

// fillBox fills a subgrid with random numbers 1..n.
func fillBox(grid [][]int, row, col, subSize, n int) {
	nums := rand.Perm(n)
	idx := 0
	for i := 0; i < subSize; i++ {
		for j := 0; j < subSize; j++ {
			grid[row+i][col+j] = nums[idx] + 1
			idx++
		}
	}
}

// removeCells removes 'count' cells from the grid to create the puzzle.
func removeCells(grid [][]int, n, count int) {
	for count > 0 {
		i := rand.Intn(n)
		j := rand.Intn(n)
		if grid[i][j] != 0 {
			grid[i][j] = 0
			count--
		}
	}
}

// ---------- Shared Helpers ----------
// Utility functions shared by the solver and generator.

// isSafe checks if a number can be placed at grid[row][col] without violating Sudoku rules.
func isSafe(grid [][]int, row, col, num, n int) bool {
	for x := 0; x < n; x++ {
		if grid[row][x] == num || grid[x][col] == num {
			return false
		}
	}
	subSize := intSqrt(n)
	startRow := row - row%subSize
	startCol := col - col%subSize
	for i := 0; i < subSize; i++ {
		for j := 0; j < subSize; j++ {
			if grid[startRow+i][startCol+j] == num {
				return false
			}
		}
	}
	return true
}

// intSqrt returns the integer square root of n.
func intSqrt(n int) int {
	i := 1
	for i*i <= n {
		i++
	}
	return i - 1
}

// argsToGrid converts JS arguments to a 2D Go grid.
func argsToGrid(args []js.Value, size int) [][]int {
	grid := make([][]int, size)
	idx := 0
	for i := 0; i < size; i++ {
		grid[i] = make([]int, size)
		for j := 0; j < size; j++ {
			grid[i][j] = args[1].Index(idx).Int()
			idx++
		}
	}
	return grid
}

// gridToFlat converts a 2D Go grid to a flat JS array.
func gridToFlat(grid [][]int) js.Value {
	flat := []interface{}{}
	for i := range grid {
		for j := range grid[i] {
			flat = append(flat, grid[i][j])
		}
	}
	return js.ValueOf(flat)
}
