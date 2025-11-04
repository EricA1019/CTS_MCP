# Packaging & Distribution Guide

This guide covers publishing the CTS MCP Server to NPM and Docker Hub.

---

## NPM Publishing

### Prerequisites

1. **NPM Account**: Create at https://www.npmjs.com/signup
2. **Organization Access**: Request access to `@broken-divinity` organization
3. **Authentication**: `npm login`

### Pre-Publishing Checklist

```bash
# 1. Ensure all tests pass
npm test

# 2. Verify coverage meets thresholds
npm run test:coverage

# 3. Run performance benchmarks
npm run benchmark

# 4. Build TypeScript
npm run build

# 5. Verify package contents
npm pack --dry-run
```

### Publishing Process

#### First Time Setup

```bash
# Login to NPM
npm login

# Verify authentication
npm whoami
```

#### Publishing New Version

```bash
# 1. Update version in package.json
npm version [major|minor|patch]

# Examples:
npm version patch  # 3.0.0 → 3.0.1
npm version minor  # 3.0.0 → 3.1.0
npm version major  # 3.0.0 → 4.0.0

# 2. Update CHANGELOG.md
# Add new section with changes

# 3. Commit version bump
git add package.json CHANGELOG.md
git commit -m "chore: bump version to $(node -p "require('./package.json').version")"

# 4. Create git tag
git tag v$(node -p "require('./package.json').version")

# 5. Build and test
npm run prepublishOnly

# 6. Publish to NPM
npm publish --access public

# 7. Push commits and tags
git push origin main --tags
```

### Automated Publishing (GitHub Actions)

Create `.github/workflows/publish.yml`:

```yaml
name: Publish to NPM

on:
  release:
    types: [published]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
      
      - run: npm ci
      - run: npm run build
      - run: npm test
      - run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### Verification

```bash
# Check package is published
npm view @broken-divinity/cts-mcp-server

# Test installation
npm install -g @broken-divinity/cts-mcp-server

# Verify binary works
cts-mcp-server --version
```

---

## Docker Publishing

### Prerequisites

1. **Docker Hub Account**: Create at https://hub.docker.com/signup
2. **Authentication**: `docker login`

### Building Docker Image

```bash
# Build for current platform
docker build -t broken-divinity/cts-mcp-server:3.0.0 .

# Build for multiple platforms (ARM + x86)
docker buildx create --use
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t broken-divinity/cts-mcp-server:3.0.0 \
  -t broken-divinity/cts-mcp-server:latest \
  --push \
  .
```

### Testing Docker Image

```bash
# Run container
docker run --rm -it broken-divinity/cts-mcp-server:3.0.0

# Test with volume mount
docker run --rm -it \
  -v /path/to/godot/project:/workspace:ro \
  broken-divinity/cts-mcp-server:3.0.0

# Check image size
docker images broken-divinity/cts-mcp-server:3.0.0

# Scan for vulnerabilities
docker scan broken-divinity/cts-mcp-server:3.0.0
```

### Publishing to Docker Hub

```bash
# Login to Docker Hub
docker login

# Tag image
docker tag broken-divinity/cts-mcp-server:3.0.0 \
  broken-divinity/cts-mcp-server:latest

# Push specific version
docker push broken-divinity/cts-mcp-server:3.0.0

# Push latest tag
docker push broken-divinity/cts-mcp-server:latest
```

### Automated Docker Publishing

Create `.github/workflows/docker-publish.yml`:

```yaml
name: Publish Docker Image

on:
  release:
    types: [published]

jobs:
  docker:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      
      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}
      
      - name: Extract version
        id: version
        run: echo "VERSION=$(node -p "require('./package.json').version")" >> $GITHUB_OUTPUT
      
      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          platforms: linux/amd64,linux/arm64
          push: true
          tags: |
            broken-divinity/cts-mcp-server:${{ steps.version.outputs.VERSION }}
            broken-divinity/cts-mcp-server:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

---

## Using Docker Compose

### Development

```bash
# Start server
docker-compose up -d

# View logs
docker-compose logs -f

# Stop server
docker-compose down

# Rebuild
docker-compose up -d --build
```

### Production

```bash
# Use environment variables
export GODOT_PROJECT_PATH=/path/to/project
export DEBUG=cts:*

# Start with production settings
docker-compose -f docker-compose.yml up -d

# Scale for multiple projects
docker-compose up -d --scale cts-mcp=3
```

---

## Package Contents

### NPM Package

Files included (via `files` field in package.json):

```
@broken-divinity/cts-mcp-server/
├── build/              # Compiled JavaScript
│   ├── index.js
│   ├── index.d.ts
│   ├── cache/
│   ├── config/
│   ├── errors/
│   ├── sampling/
│   ├── schemas/
│   └── tools/
├── README.md
├── LICENSE
├── CHANGELOG.md
└── package.json
```

Excluded files:
- Source TypeScript (`src/`)
- Tests (`__tests__/`)
- Development configs (`tsconfig.json`, `jest.config.js`)
- Benchmarks and docs

### Docker Image

Layers:
```
1. Alpine Linux base (node:20-alpine)
2. Runtime dependencies (python3, make, g++)
3. Production npm packages
4. Compiled application code
5. Non-root user setup
```

Size optimization:
- Multi-stage build (builder + production)
- Production dependencies only
- No source files or tests
- Alpine Linux base (~5MB vs ~150MB)

Expected size: **~150-200MB** (vs ~500MB+ for standard Node image)

---

## Version Management

### Semantic Versioning

Follow [SemVer](https://semver.org/):

- **MAJOR** (X.0.0): Breaking changes
- **MINOR** (3.X.0): New features (backwards compatible)
- **PATCH** (3.0.X): Bug fixes

Examples:
```bash
# Bug fix
npm version patch  # 3.0.0 → 3.0.1

# New feature (Tier 3A integration)
npm version minor  # 3.0.0 → 3.1.0

# Breaking change (API redesign)
npm version major  # 3.0.0 → 4.0.0
```

### Release Process

1. **Create release branch**
   ```bash
   git checkout -b release/v3.1.0
   ```

2. **Update CHANGELOG.md**
   - Add new version section
   - Document all changes

3. **Bump version**
   ```bash
   npm version minor
   ```

4. **Test thoroughly**
   ```bash
   npm run build
   npm test
   npm run benchmark
   ```

5. **Create pull request**
   - Title: "Release v3.1.0"
   - Include changelog in description

6. **Merge to main**

7. **Create GitHub release**
   - Tag: v3.1.0
   - Title: "Release v3.1.0"
   - Copy CHANGELOG section

8. **Automated publishing**
   - GitHub Actions publishes to NPM
   - GitHub Actions builds/pushes Docker image

---

## Rollback Procedures

### NPM Rollback

```bash
# Deprecate bad version
npm deprecate @broken-divinity/cts-mcp-server@3.0.1 "Use 3.0.2 instead"

# Unpublish (only within 72 hours)
npm unpublish @broken-divinity/cts-mcp-server@3.0.1
```

### Docker Rollback

```bash
# Users can pin to previous version
docker pull broken-divinity/cts-mcp-server:3.0.0

# Or use git commit SHA tags
docker pull broken-divinity/cts-mcp-server:sha-abc123
```

---

## Distribution Channels

### NPM Registry
- **URL**: https://www.npmjs.com/package/@broken-divinity/cts-mcp-server
- **Install**: `npm install -g @broken-divinity/cts-mcp-server`
- **Audience**: Node.js developers, MCP client users

### Docker Hub
- **URL**: https://hub.docker.com/r/broken-divinity/cts-mcp-server
- **Pull**: `docker pull broken-divinity/cts-mcp-server:latest`
- **Audience**: Containerized deployments, production environments

### GitHub Releases
- **URL**: https://github.com/broken-divinity/prototypeBD/releases
- **Assets**: Source code, checksums
- **Audience**: Source code users, contributors

---

## Security Considerations

### NPM
- Enable 2FA: `npm profile enable-2fa`
- Use access tokens (not password)
- Regularly audit dependencies: `npm audit`

### Docker
- Scan for vulnerabilities: `docker scan`
- Sign images: `docker trust sign`
- Use official base images only
- Run as non-root user (UID 1001)

### Secrets Management

Never commit:
- NPM tokens
- Docker Hub credentials
- Private keys

Use GitHub Secrets:
```
Settings → Secrets → Actions
- NPM_TOKEN
- DOCKERHUB_USERNAME
- DOCKERHUB_TOKEN
```

---

## Monitoring & Analytics

### NPM Stats
- Downloads: https://npm-stat.com/charts.html?package=@broken-divinity/cts-mcp-server
- Weekly downloads trend
- Version distribution

### Docker Hub Stats
- Pull count
- Star count
- Platform breakdown (amd64/arm64)

### GitHub Insights
- Stars
- Forks
- Issues/PRs
- Release downloads

---

## Troubleshooting

### NPM Publish Failures

**Problem**: `npm ERR! 403 Forbidden`

**Solution**: Check organization access
```bash
npm access ls-packages @broken-divinity
npm owner add <username> @broken-divinity/cts-mcp-server
```

**Problem**: `npm ERR! version already exists`

**Solution**: Bump version
```bash
npm version patch
```

### Docker Build Failures

**Problem**: `ERROR [builder 4/7] RUN npm run build`

**Solution**: Check TypeScript errors locally first
```bash
npm run build
npm test
```

**Problem**: Native module build failures

**Solution**: Ensure build dependencies in Dockerfile
```dockerfile
RUN apk add --no-cache python3 make g++
```

---

## See Also

- [CI/CD Pipeline](CI_CD_PIPELINE.md)
- [Tier 2C Improvements](TIER_2C_IMPROVEMENTS.md)
- [MCP Upgrade Plan](../docs/mcp_upgrade_plan.md)
- [NPM Documentation](https://docs.npmjs.com/)
- [Docker Documentation](https://docs.docker.com/)
