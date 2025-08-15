# Contributing to Brand Listener

First off, thank you for considering contributing to Brand Listener! 🎉

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the issue list as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples to demonstrate the steps**
- **Describe the behavior you observed and what behavior you expected**
- **Include screenshots if applicable**
- **Include your environment details** (OS, Node.js version, etc.)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

- **Use a clear and descriptive title**
- **Provide a step-by-step description of the suggested enhancement**
- **Provide specific examples to demonstrate the steps**
- **Describe the current behavior and explain the behavior you expected**
- **Explain why this enhancement would be useful**

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Install dependencies**: `pnpm install`
3. **Make your changes** in a feature branch
4. **Add tests** if you're adding functionality
5. **Ensure the test suite passes**: `pnpm run test`
6. **Run linting**: `pnpm run lint`
7. **Run type checking**: `pnpm run typecheck`
8. **Update documentation** if needed
9. **Create a pull request** with a clear description

## Development Setup

```bash
# Clone your fork
git clone https://github.com/yourusername/brand-listener.git
cd brand-listener

# Install dependencies
pnpm install

# Set up environment for testing
cp .env.example .env
# Edit .env with test credentials

# Run in development mode
pnpm run dev
```

## Project Structure

```
brand-listener/
├── apps/brand-listener/     # Main application
├── packages/
│   ├── core/               # Core business logic
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Shared utilities
├── .github/workflows/      # CI/CD workflows
└── scripts/               # Build and utility scripts
```

## Coding Style

- **TypeScript**: Use TypeScript for all new code
- **ESLint**: Follow the existing ESLint configuration
- **Prettier**: Code formatting is handled by Prettier
- **Naming**: Use descriptive names for variables and functions
- **Comments**: Add JSDoc comments for public APIs

## Testing

- **Unit Tests**: Write unit tests for new functionality
- **Integration Tests**: Add integration tests for API interactions
- **Manual Testing**: Test your changes locally before submitting

```bash
# Run tests
pnpm run test

# Run tests in watch mode
pnpm run test:watch

# Run specific test
pnpm run test -- --grep "should process tweets"
```

## Adding New Features

### Adding a New Social Media Source

1. Create a new file in `packages/core/src/services/sources/`
2. Implement the `Source` interface
3. Add proper error handling and logging
4. Write tests for the new source
5. Update documentation

### Adding a New Output Destination

1. Create a new file in `packages/core/src/services/sinks/`
2. Implement the `Sink` interface
3. Add configuration options
4. Write tests for the new sink
5. Update configuration documentation

### Enhancing Tweet Processing

1. Modify `packages/core/src/services/processing/processor.ts`
2. Add new relevance scoring algorithms
3. Ensure backward compatibility
4. Add comprehensive tests
5. Update threshold documentation

## Documentation

- **README**: Update the README if you're adding features
- **Code Comments**: Add JSDoc comments for public APIs
- **Configuration**: Document new configuration options
- **Examples**: Provide usage examples for new features

## Release Process

1. **Version Bump**: Use semantic versioning (major.minor.patch)
2. **Changelog**: Update CHANGELOG.md with changes
3. **Documentation**: Ensure documentation is up to date
4. **Testing**: Run full test suite
5. **Review**: Get code review from maintainers

## Questions?

Don't hesitate to ask questions! You can:

- **Open an issue** for general questions
- **Start a discussion** for broader topics
- **Ask in pull requests** for specific implementation questions

## Recognition

Contributors will be recognized in our README and release notes. Thank you for making Brand Listener better! 🙏
