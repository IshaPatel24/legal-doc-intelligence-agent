# Installation & Setup Guide

**Legal Document Intelligence Agent**  
*HiDevs × Mastra Hackathon 2026*

---

## Prerequisites

- **Node.js**: v18+ ([Download](https://nodejs.org/))
- **npm**: v9+ (comes with Node.js)
- **PostgreSQL**: v13+ (for session storage)
- **Docker** (optional, for Qdrant local setup)
- **Git**: v2.30+ ([Download](https://git-scm.com/))

---

## Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/legal-doc-intelligence-agent.git
cd legal-doc-intelligence-agent
```

---

## Step 2: Install Dependencies

```bash
npm install
```

This will install all required packages:
- `next@14` — React framework for frontend
- `@anthropic-ai/sdk@0.28` — Claude API client
- `@qdrant/js-client-rest@1.10` — Qdrant vector database client
- `pdfjs-dist@4` — PDF text extraction
- `zod@3.22` — Schema validation
- And more (see `package.json`)

---

## Step 3: Set Up Environment Variables

### Create `.env.local`

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

### Configure Your API Keys

Edit `.env.local` and add:

```bash
# 1. Anthropic API Key
ANTHROPIC_API_KEY=sk-ant-your-key-here

# 2. Qdrant Configuration
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=your-qdrant-key

# 3. Enkrypt AI Configuration
ENKRYPT_API_KEY=your-enkrypt-key
ENKRYPT_API_URL=https://api.enkrypt.ai/v1

# 4. Database (PostgreSQL)
DATABASE_URL=postgresql://postgres:password@localhost:5432/legal_agent

# 5. Application Port
PORT=3000
```

#### Getting API Keys:

**Anthropic (Claude API)**:
1. Visit https://console.anthropic.com
2. Sign up / log in
3. Create an API key
4. Copy it to `ANTHROPIC_API_KEY`

**Qdrant**:
1. Option A: Use cloud at https://cloud.qdrant.io
2. Option B: Run locally with Docker:
   ```bash
   docker run -p 6333:6333 qdrant/qdrant
   ```
3. Get your API key and configure `QDRANT_URL` and `QDRANT_API_KEY`

**Enkrypt AI**:
1. Visit https://enkrypt.ai
2. Create account and generate API key
3. Add to `ENKRYPT_API_KEY`

**PostgreSQL** (for session storage):
```bash
# macOS with Homebrew
brew install postgresql
brew services start postgresql

# Linux (Ubuntu/Debian)
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql

# Docker
docker run -d \
  --name postgres \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  postgres:15
```

---

## Step 4: Initialize the Database

```bash
# Create the database
createdb legal_agent

# Run migrations (if available)
npm run migrate
```

---

## Step 5: Start the Development Server

```bash
npm run dev
```

You should see:

```
> ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

Open http://localhost:3000 in your browser.

---

## Step 6: Load Knowledge Base (Optional)

To populate the Qdrant vector database with contract templates and precedents:

```bash
npm run load-knowledge-base
```

This will:
1. Parse 50+ Indian contract templates
2. Generate embeddings for each clause
3. Store in Qdrant with metadata
4. Index legal precedents

---

## Project Structure

```
legal-doc-intelligence-agent/
├── src/
│   ├── agents/
│   │   └── documentAnalyzer.ts       # Main Mastra agent orchestration
│   ├── api/
│   │   ├── analyze.ts                # POST /api/analyze endpoint
│   │   └── chat.ts                   # POST /api/chat endpoint (Q&A)
│   ├── services/
│   │   ├── enkrypt.ts                # Enkrypt AI validation service
│   │   ├── qdrant.ts                 # Qdrant vector DB operations
│   │   └── pdf-processor.ts          # PDF extraction & chunking
│   ├── types/
│   │   └── index.ts                  # TypeScript interfaces
│   └── utils/
│       └── logger.ts                 # Logging utility
├── pages/
│   ├── index.tsx                     # Home page
│   ├── analyze.tsx                   # Contract analysis page
│   └── api/
│       ├── analyze.ts                # API route
│       └── chat.ts                   # API route
├── data/
│   ├── templates/                    # 50+ contract templates
│   ├── precedents/                   # Legal precedent database
│   └── knowledge-base.json           # Master knowledge base
├── public/
│   └── uploads/                      # Temporary contract uploads
├── docs/
│   ├── ARCHITECTURE.md               # System architecture
│   ├── API.md                        # API documentation
│   └── KNOWLEDGE-BASE.md             # Knowledge base structure
├── .env.example                      # Environment variables template
├── .gitignore                        # Git ignore rules
├── tsconfig.json                     # TypeScript configuration
├── next.config.js                    # Next.js configuration
├── package.json                      # Dependencies
└── README.md                         # Project README
```

---

## Verify Installation

Run the test suite:

```bash
npm test
```

Or manually test the API:

```bash
# Test the analyze endpoint
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "contractText": "This freelance agreement...",
    "contractType": "freelance"
  }'
```

---

## Troubleshooting

### Issue: `ANTHROPIC_API_KEY not found`
**Solution**: Check that `.env.local` exists and contains `ANTHROPIC_API_KEY=sk-ant-...`

### Issue: `Cannot connect to Qdrant`
**Solution**: 
```bash
# Start Qdrant with Docker
docker run -p 6333:6333 qdrant/qdrant
```

### Issue: `PostgreSQL connection refused`
**Solution**:
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Start if not running
sudo systemctl start postgresql
```

### Issue: `PORT 3000 already in use`
**Solution**: Use a different port:
```bash
PORT=3001 npm run dev
```

---

## Development Workflow

### 1. Create a feature branch
```bash
git checkout -b feature/your-feature-name
```

### 2. Make changes
```bash
# Edit files in src/
```

### 3. Test locally
```bash
npm run dev
# Test in browser at http://localhost:3000
```

### 4. Type check
```bash
npm run type-check
```

### 5. Commit and push
```bash
git add .
git commit -m "feat: add your feature"
git push origin feature/your-feature-name
```

### 6. Create pull request
On GitHub, open a PR to merge into `main`

---

## Production Deployment

### Build for production
```bash
npm run build
npm run start
```

### Deploy to Vercel (Recommended for Next.js)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Deploy to Heroku
```bash
heroku create your-app-name
git push heroku main
```

### Deploy to AWS/GCP/Azure
Follow respective platform guides after `npm run build`

---

## API Documentation

Once running, API documentation is available at:
- Swagger/OpenAPI: http://localhost:3000/api/docs
- Postman Collection: See `docs/postman-collection.json`

---

## Next Steps

1. ✅ Installation complete
2. 📖 Read [ARCHITECTURE.md](./ARCHITECTURE.md)
3. 🔌 Review [API.md](./API.md)
4. 🧪 Check out example requests in `docs/examples/`
5. 🚀 Start developing!

---

## Support

- **Issues**: Open a GitHub issue
- **Discussions**: Use GitHub Discussions
- **Documentation**: See `docs/` folder

---

**Author**: Ishu Patel  
**Hackathon**: HiDevs × Mastra 2026  
**Last Updated**: June 20, 2026
