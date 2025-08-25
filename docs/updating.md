# Keeping Dependencies Up-to-Date

This document explains how to keep the project's frameworks and libraries (npm packages) up-to-date. Regularly updating dependencies is crucial for security, performance, and accessing new features.

## Manual Updates

You can update your dependencies manually using npm.

### 1. Check for Outdated Packages

To see which packages have newer versions available, run the following command in your terminal:

```bash
npm outdated
```

This will show you the current version, the wanted version (respecting semantic versioning rules in `package.json`), and the latest available version of each outdated package.

### 2. Update Packages

To update the packages to the latest versions allowed by your `package.json` file, run:

```bash
npm update
```

For major version updates, you may need to install the package individually:

```bash
npm install package-name@latest
```

After updating, it's important to run the tests to ensure that the new versions haven't introduced any breaking changes:

```bash
npm test
```

## Automated Updates with Renovate Bot

Manually checking and updating dependencies can be time-consuming. A better approach is to automate the process using a tool like [Renovate Bot](https://github.com/renovatebot/renovate).

### What is Renovate Bot?

Renovate is a free tool that automatically detects outdated dependencies and creates pull requests (PRs) to update them. It's highly configurable and works with GitHub repositories.

### How to Set It Up

1.  **Install the Renovate App**: Go to the [Renovate GitHub App](https://github.com/apps/renovate) and install it on your repository.
2.  **Create a Configuration File**: Add a `renovate.json` file to the root of your repository to configure its behavior. A simple configuration might look like this:

    ```json
    {
      "$schema": "https://docs.renovatebot.com/renovate-schema.json",
      "extends": [
        "config:base"
      ]
    }
    ```

3.  **Merge the Onboarding PR**: Renovate will create an initial PR to confirm it's set up correctly. Once you merge it, Renovate will start scanning your dependencies and creating PRs for updates.

Using an automated tool like Renovate ensures your project stays current with minimal manual effort, allowing you to focus on development.
