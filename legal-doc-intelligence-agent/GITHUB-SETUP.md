# GitHub Repository Setup

## Create Your Repository

### Step 1: Create New Repository on GitHub

1. Go to https://github.com/new
2. Fill in:
   - **Repository name**: `legal-doc-intelligence-agent`
   - **Description**: `AI-powered legal document analysis agent for Indian contracts`
   - **Visibility**: Public
   - **Initialize with**: None (we'll push our code)

3. Click **Create repository**

---

### Step 2: Add All Files to Your Local Repository

In your terminal, in the project root:

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Legal Document Intelligence Agent

- Complete architecture with Mastra, Qdrant, Enkrypt AI
- TypeScript backend with Next.js frontend
- PDF contract parsing and analysis
- Safety validation layer
- Q&A with contract memory
- Ready for HiDevs Mastra Hackathon 2026"

# Add remote
git remote add origin https://github.com/YOUR_USERNAME/legal-doc-intelligence-agent.git

# Push to GitHub
git branch -M main
git push -u origin main
```

---

### Step 3: Directory Structure on GitHub

Your repo should have this structure:

```
legal-doc-intelligence-agent/
│
├── 📄 README.md                          ← Start here
├── 📄 INSTALLATION.md                    ← Setup guide
├── 📄 PRD.md                             ← Product requirements
├── 📄 SOLUTION.md                        ← Technical details
├── 📄 DEMO.md                            ← Demo script
├── 📄 ARCHITECTURE-DIAGRAM.svg           ← System diagram
├── 📄 CONTRIBUTING.md                    ← How to contribute
│
├── 📁 src/                               ← Source code
│   ├── 📁 agents/
│   │   └── documentAnalyzer.ts
│   ├── 📁 api/
│   │   ├── analyze.ts
│   │   └── chat.ts
│   ├── 📁 services/
│   │   ├── enkrypt.ts
│   │   ├── qdrant.ts
│   │   └── pdf-processor.ts
│   ├── 📁 types/
│   │   └── index.ts
│   └── 📁 utils/
│       └── logger.ts
│
├── 📁 pages/                             ← Next.js pages
│   ├── index.tsx
│   ├── analyze.tsx
│   └── 📁 api/
│       ├── analyze.ts
│       └── chat.ts
│
├── 📁 data/                              ← Knowledge base
│   ├── 📁 templates/
│   ├── 📁 precedents/
│   └── knowledge-base.json
│
├── 📁 docs/                              ← Documentation
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── KNOWLEDGE-BASE.md
│   └── 📁 examples/
│       ├── sample-contract.pdf
│       └── request-response.json
│
├── 📁 public/                            ← Static assets
│   └── 📁 uploads/
│
├── 📁 .github/                           ← GitHub workflows
│   ├── 📁 workflows/
│   │   ├── test.yml
│   │   └── deploy.yml
│   └── ISSUE_TEMPLATE/
│
├── 📄 .env.example                       ← Environment template
├── 📄 .gitignore                         ← Git ignore rules
├── 📄 tsconfig.json                      ← TypeScript config
├── 📄 next.config.js                     ← Next.js config
├── 📄 package.json                       ← Dependencies
├── 📄 package-lock.json                  ← Lock file
├── 📄 LICENSE                            ← MIT License
└── 📄 .editorconfig                      ← Editor settings
```

---

## GitHub Settings to Configure

### 1. Branch Protection (Settings > Branches)

```
Branch name pattern: main

Rules:
✓ Require a pull request before merging
✓ Require status checks to pass before merging
✓ Require branches to be up to date before merging
```

### 2. Automatic Workflows (Actions)

Create `.github/workflows/test.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run type-check
      - run: npm test
```

### 3. README Badge

Add to your README.md:

```markdown
[![Tests](https://github.com/YOUR_USERNAME/legal-doc-intelligence-agent/actions/workflows/test.yml/badge.svg)](https://github.com/YOUR_USERNAME/legal-doc-intelligence-agent/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
```

---

## Add to GitHub Topics

On your GitHub repo page, add topics:
- `agent`
- `mastra`
- `qdrant`
- `claude`
- `legal-tech`
- `india`
- `contracts`
- `hackathon`

---

## File: `.gitignore`

Create `.gitignore` in root:

```
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment
.env
.env.local
.env.*.local

# Build outputs
.next/
dist/
build/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Testing
coverage/
.nyc_output/

# Uploads
public/uploads/*
!public/uploads/.gitkeep

# Logs
logs/
*.log

# Database
*.sqlite
*.sqlite3
```

---

## File: `LICENSE`

Create `LICENSE` file (MIT):

```
MIT License

Copyright (c) 2026 Ishu Patel

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## File: `CONTRIBUTING.md`

```markdown
# Contributing to Legal Document Intelligence Agent

First off, thanks for your interest in contributing! 🎉

## How to Contribute

1. **Fork the repository**
   ```bash
   git clone https://github.com/YOUR_FORK/legal-doc-intelligence-agent.git
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make your changes**
   - Keep commits atomic and descriptive
   - Write tests for new features
   - Update documentation

4. **Test your changes**
   ```bash
   npm run type-check
   npm test
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```

6. **Open a Pull Request**
   - Link any related issues
   - Describe your changes clearly
   - Tag with appropriate labels

## Code Style

- Use TypeScript for all backend code
- Follow existing code style (prettier + eslint)
- Write descriptive commit messages

## Questions?

Open an issue or discussion on GitHub!

---

Made with ❤️ for the HiDevs × Mastra Hackathon 2026
```

---

## Final Checklist

- [ ] Repository created on GitHub
- [ ] All files pushed (`git push -u origin main`)
- [ ] README visible and comprehensive
- [ ] INSTALLATION.md clear and tested
- [ ] All documentation in `docs/` folder
- [ ] `.env.example` provided (no real keys!)
- [ ] LICENSE file added
- [ ] GitHub topics added
- [ ] Branch protection enabled
- [ ] Workflows configured (optional)

---

## Share Your Repo Link

Once everything is up, share this link:

```
https://github.com/YOUR_USERNAME/legal-doc-intelligence-agent
```

**For HiDevs Submission**, use this link in your architecture challenge submission!

---

**Author**: Ishu Patel  
**Hackathon**: HiDevs × Mastra 2026  
**Date**: June 20, 2026
```
