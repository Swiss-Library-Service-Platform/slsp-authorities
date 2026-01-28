# Sample Cloud App

A minimal Ex Libris Alma Cloud App template. This can be used as starting point for new Cloud App projects.

## What's Included

This sample demonstrates:

**Cloud App Basics**

- Loading and displaying entities via the event service
- Fetching entity details from the Alma API using the rest service
- Basic error handling and memory management in RxJS pipes

**Modern Angular Patterns**

- Dependency injection using `inject()` function
- Proper cleanup with `takeUntilDestroyed()`
- Modern template control flow (`@if`, `@for`)

**Internationalization**

- Translation service usage in components
- Translation pipe usage in templates
- Pre-configured English and German translations

**Code Quality**

- ESLint configuration with Angular-specific rules
- Prettier for code formatting
- NPM scripts for linting, formatting, and development

## Prerequisites

- Node.js 22.x (see `.nvmrc`)
- Ex Libris Cloud App CLI: `npm install -g @exlibris/exl-cloudapp-cli`
- Access to an Alma sandbox instance

## Setup

1. Copy all files (including hidden files) to your new project directory

1. Install dependencies:

   ```bash
   npm install
   ```

1. Edit `manifest.json` with your app details:

   ```json
   {
     "id": "your-app-id",
     "title": "Your App Title",
     "subtitle": "Short description",
     "author": "Your Name"
   }
   ```

1. Copy and edit the config file:

   ```bash
   cp config.template.json config.json
   ```

   Update `config.json` with your institution details:

   ```json
   {
     "env": "https://your-institution.exlibrisgroup.com/institution/41SLSP_YOUR-CODE",
     "port": 4200
   }
   ```

## Development

Start the development server:

```bash
eca start
```

The app runs at `http://localhost:4200` and proxies to your configured Alma instance.

### Common Commands

- `eca start` - Start development server
- `eca build` - Build for production
- `npm run lint` - Check code with ESLint
- `npm run lint:fix` - Auto-fix linting issues
- `npm run format` - Format code with Prettier
- `npm test` - Run tests

## Troubleshooting

**Port in use**: Change the `port` value in `config.json`

**ECA command not found**: Install the CLI globally:

```bash
npm install -g @exlibris/exl-cloudapp-cli
```

**Node version mismatch**: Use the version from `.nvmrc`:

```bash
nvm use
```

## Resources

- [Ex Libris Cloud Apps Documentation](https://developers.exlibrisgroup.com/cloudapps/)
- [Ex Libris Developer Network](https://developers.exlibrisgroup.com/)
- [Angular Documentation](https://angular.dev/)
