# CI/CD Setup for XMCP

This directory contains the GitHub Actions workflows for continuous integration of the XMCP monorepo.

## Workflows

### `ci.yml` - Main CI Pipeline

Runs on every pull request to `main`.

**What it does:**

- ✅ Builds all packages using Turbo
- ✅ Runs linting (if available)
- ✅ Verifies build outputs exist
- ✅ Tests that both CLIs are executable
- ✅ Tests `create-xmcp-app` can create new projects
- ✅ Validates example projects
- ✅ Checks package.json integrity
- ✅ Verifies lockfile is up to date

**Skip CLI Tests:**
Set the environment variable `SKIP_CLI_TESTS=true` in the workflow to skip CLI tests and only run build verification.

### `manual-ci.yml` - Manual CI with Options

Manually triggered workflow with options to customize testing.

**Features:**

- ✅ Choose to skip CLI tests for faster feedback
- ✅ Select target branch to test
- ✅ Same comprehensive testing as main CI

### `cross-platform.yml` - Cross-Platform Testing

Runs on PR to `main`.

**What it does:**

- ✅ Tests on Ubuntu, Windows, and macOS
- ✅ Ensures CLIs work across all platforms
- ✅ Verifies Node.js compatibility

## Running Tests Locally

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm run build

# Run full CI test suite
pnpm run ci

# Run build-only CI (skip CLI tests)
pnpm run ci:build-only

# Run individual test components
pnpm run test:build         # Test build outputs only
pnpm run test:cli           # Test CLI functionality
pnpm run test:cli:skip      # Skip CLI tests (exits immediately)
```

## Skipping CLI Tests

**Locally:**

```bash
# Skip CLI tests in full pipeline
pnpm run ci:build-only

# Or skip just the CLI portion
pnpm run test:ci:skip-cli
```

**In GitHub Actions:**

1. **Automatic CI:** Set `SKIP_CLI_TESTS: true` in the workflow environment
2. **Manual CI:** Use the "Manual CI" workflow and check "Skip CLI tests"

## Troubleshooting

**Build failures:**

- Ensure all packages have proper `build` scripts
- Check that TypeScript configurations are correct
- Verify all dependencies are properly declared

**CLI test failures:**

- Ensure CLIs have proper `--help` flags
- Check that bin files are executable
- Verify CLI entry points exist after build
- Use `pnpm run ci:build-only` to isolate build issues from CLI issues

## Development Tips

**Fast iteration during development:**

- Use `pnpm run ci:build-only` for quick build verification
- Use the "Manual CI" workflow in GitHub for on-demand testing
- Skip CLI tests when debugging build issues to get faster feedback
