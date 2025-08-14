# AI Agent Guidelines

## Build/Test Commands
- **Build**: `npm run build` or `yarn build`
- **Test**: `npm test` or `yarn test`
- **Single test**: `npm test -- --testNamePattern="TestName"` or `yarn test TestName`
- **Lint**: `npm run lint` or `yarn lint`
- **Type check**: `npm run typecheck` or `yarn typecheck`

## Code Style Guidelines
- **Imports**: Use absolute imports from `src/`, group by external → internal → relative
- **Formatting**: Use Prettier defaults (2 spaces, single quotes, trailing commas)
- **Types**: Prefer TypeScript interfaces over types, explicit return types for functions
- **Naming**: camelCase for variables/functions, PascalCase for components/classes, UPPER_CASE for constants
- **Error handling**: Use try/catch for async operations, proper error boundaries in React
- **Components**: Functional components with hooks, props interfaces defined above component

## Project Structure
- Follow existing folder structure and naming conventions
- Place tests adjacent to source files with `.test.ts` or `.spec.ts` extensions
- Use index files for clean exports from directories

## Important Notes
- Always run lint and typecheck after making changes
- Check existing code patterns before implementing new features
- Never commit secrets or API keys