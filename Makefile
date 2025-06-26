APP_NAME = sudoku
WASM_OUT = $(APP_NAME).wasm

all: build

build:
	GOOS=js GOARCH=wasm go build -o $(WASM_OUT) main.go
	cp "$(shell go env GOROOT)/lib/wasm/wasm_exec.js" .

serve:
	python3 -m http.server 8080

clean:
	rm -f $(WASM_OUT) wasm_exec.js
