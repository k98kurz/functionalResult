# Publishing Updates

This package can be published to both the npm public registry and GitHub Packages.
The package name is the same in both: `@k98kurz/functionalResult`.

## Pre-publish checklist

1. **Update version** in `package.json` (follow semantic versioning)
2. **Build the project:**
   ```bash
   npm run build
   ```
3. **Verify distribution tests pass:**
   ```bash
   npm run test:dist
   ```

Note: `prepublishOnly` automatically runs `build` and `test:dist` before any publish.

---

## Publishing to npm (public registry)

### Prerequisites

1. Login to npmjs.com
2. Authenticate locally:
   ```bash
   npm login
   ```
   This stores your auth token in `~/.npmrc`.

### Publish

```bash
npm run publish:npm
# or simply:
npm publish
```

The package will be published to `https://www.npmjs.com/package/@k98kurz/functionalResult`.

---

## Publishing to GitHub Packages

### Prerequisites

1. Go to https://github.com/settings/tokens/new and create a personal access token
  (PAT) with the `write:packages` scope.
2. Add the auth token to your **home** `.npmrc` (`~/.npmrc`), not the project's:
```
//npm.pkg.github.com/:_authToken=YOUR_TOKEN
```

### Publish

```bash
npm run publish:github
```

The package will be published to `https://github.com/k98kurz?tab=packages`.

---

## Publishing to both registries

You can publish to both. The packages are independent, so each registry maintains its own version history. To keep them in sync, publish the same version to both.

Example workflow:
```bash
npm run build
npm run publish:npm
npm run publish:github
```
