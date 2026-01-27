# Luccibot

![Build Status](https://github.com/lucci-labs/luccibot/actions/workflows/ci.yml/badge.svg)
[![Go Report Card](https://goreportcard.com/badge/github.com/lucci-labs/luccibot)](https://goreportcard.com/report/github.com/lucci-labs/luccibot)
[![License](https://img.shields.io/github/license/lucci-labs/luccibot)](LICENSE)

**Luccibot** is a **self-hosted**, CLI-based personal crypto manager and assistant written in Go. It is designed to help users efficiently manage cryptocurrency portfolios, track real-time market trends, and receive personalized insights directly from the terminal.

Because it is self-hosted, you retain full control over your data. You can securely store **private keys** and **CEX API credentials** locally on your own machine, ensuring sensitive information never leaves your control.

## Features

-   **Self-Hosted & Secure**: Run locally to keep your private keys and exchange API tokens safe.
-   **Portfolio Management**: Track your assets across different wallets and exchanges (Planned).
-   **Market Tracking**: Real-time price updates and trend analysis (Planned).
-   **Personalized Insights**: AI-driven recommendations for your portfolio (Planned).
-   **CLI Interface**: Fast and scriptable command-line interface powered by [Cobra](https://github.com/spf13/cobra).

## Getting Started

### Prerequisites

-   [Go 1.24+](https://go.dev/dl/)

### Installation

Clone the repository and build the binary:

```bash
git clone https://github.com/lucci-labs/luccibot.git
cd luccibot
make build
```

This will create the `luccibot` binary in the `bin/` directory.

### Usage

Run the bot using the binary:

```bash
./bin/luccibot [command] [flags]
```

Or using `go run`:

```bash
go run cmd/luccibot/main.go [command]
```

## Development

This project follows the [Standard Go Project Layout](https://github.com/golang-standards/project-layout).

### Project Structure

```
.
├── cmd/luccibot/       # Main entry point for the application
├── internal/           # Private application and business logic
├── pkg/                # Library code that can be used by external applications
├── .github/workflows/  # CI/CD configurations
├── Makefile            # Build and task automation
└── README.md           # This file
```

### Common Tasks

We use `make` for common development tasks:

-   `make build`: Compiles the application to `bin/luccibot`.
-   `make run`: Builds and runs the application.
-   `make test`: Runs all unit tests.
-   `make lint`: Runs `go vet` (and `golangci-lint` if installed).
-   `make clean`: Removes build artifacts.

## Contributing

Contributions are welcome! Please read the [CONTRIBUTING.md](CONTRIBUTING.md) file for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
