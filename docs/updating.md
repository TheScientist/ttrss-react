# Keeping the Application Up-to-Date

Follow these simple steps to update your local installation with the latest changes from the repository.

## Step 1: Fetch the Latest Code

Open your terminal, navigate to the project directory, and pull the latest changes from the main branch:

```bash
git pull origin main
```

This command fetches the latest code from the remote repository and merges it into your local branch.

## Step 2: Install or Update Dependencies

After pulling the latest code, it's possible that new dependencies have been added or existing ones have been updated. Run the following command to ensure your dependencies are in sync with the `package-lock.json` file:

```bash
npm ci
```

Using `npm ci` (clean install) is recommended over `npm install` because it provides a reliable, repeatable build by installing the exact dependency versions specified in the lock file.

## Step 3: Rebuild the Application (Optional)

If you are self-hosting the application, you will need to create a new production build with the latest changes:

```bash
npm run build
```

This will generate an updated `dist` folder. You can then deploy the contents of this folder to your web server.

That's it! Your application is now up-to-date.
