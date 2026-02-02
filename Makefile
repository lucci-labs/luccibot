.PHONY: all build test clean run lint

BINARY_NAME=lucci

all: build

build:
	@echo "Building..."
	go build -v -o bin/$(BINARY_NAME) ./main.go

test:
	@echo "Testing..."
	go test -v ./...

clean:
	@echo "Cleaning..."
	go clean
	rm -rf bin/

run: build
	@echo "Running..."
	./bin/$(BINARY_NAME)

lint:
	@echo "Linting..."
	go vet ./...
	# If you have golangci-lint installed:
	# golangci-lint run
