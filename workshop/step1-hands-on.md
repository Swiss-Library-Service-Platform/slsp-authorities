# Workshop: Hands-On Exercise

This guide walks you through building your first Cloud App during the workshop.

## Prerequisites

Before you start, make sure you have:

- [ ] **Node.js** (v18.19.1 or higher)

  - Check: `node --version`
  - Download: https://nodejs.org/
  - Consider using NVM (Node Version Manager): https://github.com/coreybutler/nvm-windows

- [ ] **npm** (comes with Node.js)

  - Check: `npm --version`

- [ ] **IDE/Code Editor**

  - Recommended: [VS Code](https://code.visualstudio.com/)
  - You can use any text editor, but an IDE will make development easier.

- [ ] **Git** (optional, but recommended)
  - Check: `git --version`
  - Download: https://git-scm.com/

## Installation Steps

The following steps can also be found in the official Ex Libris [Getting Started guide](https://developers.exlibrisgroup.com/cloudapps/started).

1. **Install the Cloud App CLI**

   ```bash
   npm install -g @exlibris/exl-cloudapp-cli
   ```

2. **Verify installation**

   ```bash
   eca --version
   ```

3. **Create a new Cloud App project**

   ```bash
   mkdir eca-created-app
   cd eca-created-app
   eca init
   ```

   Follow the prompts to set up your new Cloud App project.

   **Important:** When asked for Environment URL, use:

   ```
   https://slsp-hph-psb.alma.exlibrisgroup.com/institution/41SLSP_HPH
   ```

   Verify that the project structure is created:

   - `manifest.json`
   - ...

4. **Start the development server**

   ```bash
   eca start
   ```

5. **Open the app in your browser**

   Navigate to http://localhost:4200 to see your Cloud App in action.

## Resources

See [resources/](resources/) folder for:

- API documentation links
- Useful references
- Troubleshooting tips
