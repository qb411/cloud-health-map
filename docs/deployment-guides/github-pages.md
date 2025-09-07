# GitHub Pages Deployment Guide - V2 Static

This guide covers deploying the V2 static version to GitHub Pages for free hosting.

## Prerequisites

- GitHub repository with the project
- Node.js installed locally
- Git configured

## Setup Steps

### 1. Navigate to V2 Directory

```bash
cd versions/v2-static-github
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure for GitHub Pages

The project is already configured with:
- `basename="/cloud-health-map"` in App.tsx router
- `deploy` script in package.json
- `gh-pages` dependency for deployment

### 4. Build and Deploy

```bash
# Build the project
npm run build

# Deploy to GitHub Pages
npm run deploy
```

This will:
- Build the static files to `dist/`
- Push the built files to the `gh-pages` branch
- GitHub will automatically serve from this branch

### 5. Enable GitHub Pages

1. Go to your repository on GitHub
2. Navigate to Settings → Pages
3. Set Source to "Deploy from a branch"
4. Select branch: `gh-pages`
5. Select folder: `/ (root)`
6. Click Save

### 6. Access Your Site

Your site will be available at:
```
https://[username].github.io/cloud-health-map
```

## Configuration Details

### Router Configuration
```typescript
<BrowserRouter basename="/cloud-health-map">
```

### Build Configuration
The Vite config is set up for GitHub Pages deployment with proper base path handling.

### CORS Handling
The app includes fallback CORS proxy handling for the AWS RSS feed:
- First tries direct fetch
- Falls back to `api.allorigins.win` proxy if needed

## Updating the Deployment

To update your deployed site:

```bash
cd versions/v2-static-github
npm run build
npm run deploy
```

Changes will be live within a few minutes.

## Troubleshooting

### Build Errors
- Ensure all dependencies are installed: `npm install`
- Check for TypeScript errors: `npm run lint`

### Deployment Issues
- Verify GitHub Pages is enabled in repository settings
- Check that `gh-pages` branch exists and has content
- Ensure repository is public (or you have GitHub Pro for private repos)

### CORS Issues
- The app includes automatic CORS proxy fallback
- If RSS feed fails, check browser console for specific errors
- Test with different networks (some corporate firewalls block external APIs)

## Performance Optimization

The static build includes:
- Tree shaking for smaller bundle size
- Asset optimization
- localStorage caching for offline functionality
- Efficient refresh intervals (10min normal, 5min during issues)
