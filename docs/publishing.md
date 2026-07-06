# Publishing Updates

## 1. Update Version

Update the version in `package.json` (following semantic versioning).

## 2. Build the Project

```bash
npm run build
```

## 3. Authenticate with GitHub Packages

Ensure the `.npmrc` file has a valid token with `write:packages` scope:
```
//npm.pkg.github.com/:_authToken=YOUR_TOKEN
@k98kurz:registry=https://npm.pkg.github.com
```

## 4. Publish to GitHub
```bash
npm publish
```

The package will be published to `https://github.com/k98kurz?tab=packages`.
