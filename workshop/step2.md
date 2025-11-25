# Step 2: Explore the Starter App

In Step 1, you created a basic Cloud App using `eca init`. Now let's explore a more complete starter template that demonstrates real-world patterns and best practices.

## Overview

The `starter-app` folder in this repository contains a pre-configured Cloud App with:

- Working API integration with Alma
- Modern Angular patterns (dependency injection, signals)
- Internationalization (i18n) support
- Code quality tools (ESLint, Prettier)

This serves as a good foundation for your own Cloud App projects.

## Setup Instructions

1. **Open the starter-app folder in VS Code** (recommended)

   For the best development experience, open the `starter-app` folder as a workspace in VS Code:

   - In VS Code: **File → Open Folder...** → select `starter-app`
   - Or from terminal: `code starter-app`

   This will:
   - Prompt you to install recommended extensions (Angular, ESLint, Prettier, etc.)
   - Load workspace settings for TypeScript and linting
   - Enable `manifest.json` schema validation

   **Not using VS Code?** You can use any editor, but you won't get the automatic extension recommendations.

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure your Alma environment**

   Copy the config template and edit it:

   ```bash
   cp config.template.json config.json
   ```

   Update `config.json` with your institution URL. For example:

   ```json
   {
     "env": "https://slsp-hph-psb.alma.exlibrisgroup.com/institution/41SLSP_HPH",
     "port": 4200
   }
   ```

4. **Start the development server**

   ```bash
   eca start
   ```

5. **Open in browser**

   Navigate to http://localhost:4200

6. **Log in to Alma**

   Use the Alma Sandbox credentials provided in SLSPhere to authenticate the app.
   See here for credentials: [SLSP Premium Sandbox - Testing](https://slsp.atlassian.net/wiki/spaces/AlmaPrimoVE/pages/77532053/SLSP+Premium+Sandbox#5.-Sandbox-4:-Testing)

## Explore the Project Structure

Take a moment to familiarise yourself with the folder structure.

```
starter-app/
├── cloudapp/
│   └── src/
│       ├── app/                 # Your application code
│       │   ├── entity-list/     # Entity list component
│       │   ├── entity-detail/   # Entity detail component
│       │   ├── main/            # Main component
│       │   └── services/        # Shared services
│       └── i18n/                # Translation files (en, de)
├── manifest.json                # App metadata & configuration
├── config.json                  # Local dev environment
└── package.json                 # Dependencies & scripts
```

**Key files to look at:**

- [`manifest.json`](starter-app/manifest.json) - App metadata, security settings, and widget configuration
- [`cloudapp/src/app/main/main.component.ts`](starter-app/cloudapp/src/app/main/main.component.ts) - Main app logic
- [`cloudapp/src/i18n/en.json`](starter-app/cloudapp/src/i18n/en.json) - Translation strings

## What's Different from `eca init`?

The starter-app includes several enhancements:

- **API Integration**: Demonstrates fetching entity details from Alma
- **Modern Angular**: Uses latest patterns like `inject()` and `@if`/`@for` control flow
- **i18n Ready**: Pre-configured for English and German
- **Code Quality**: ESLint and Prettier configs included

## Next Steps

Once the app is running and you've explored the structure, you're ready for Step 3.

## Troubleshooting

**Port already in use?**
Change the `port` value in `config.json` to something else (e.g., 4201)

**Can't find `eca` command?**
Make sure you've installed the CLI globally: `npm install -g @exlibris/exl-cloudapp-cli`

## Resources

Full details available in [starter-app/README.md](../starter-app/README.md)