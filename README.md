# Sous - Production Deployment Guide

A full-stack web application that helps users manage recipes, ingredients, and shopping lists with AI-powered features.

## 🚀 Features

- **Recipe Management**: Import recipes from TheMealDB or create custom recipes
- **Ingredient Recognition**: AI-powered ingredient detection from images (Gemini 2.5 Flash)
- **Smart Recipe Search**: Find recipes based on available ingredients
- **Shopping Lists**: Generate and manage shopping lists from recipes
- **Multiple Export Formats**: Export shopping lists as CSV, TXT, Markdown, or JSON
- **User Authentication**: Secure OAuth-based authentication (Manus platform)
- **Responsive UI**: Built with React 19 and Tailwind CSS 4

## 📋 Tech Stack

### Frontend
- **React 19** - Latest React with Concurrent Features
- **Tailwind CSS 4** - Utility-first CSS framework
- **Wouter** - Lightweight client-side routing
- **TanStack React Query** - Server state management
- **Radix UI** - Accessible component primitives

### Backend
- **Next.js (latest)** - Full-stack React framework
- **tRPC 11** - End-to-end typesafe APIs
- **Express 4** - Web server
- **Drizzle ORM** - TypeScript ORM for MySQL
- **MySQL 8** - Relational database

### Infrastructure
- **Docker & Docker Compose** - Containerization
- **GitHub Actions** - CI/CD pipeline
- **Vitest** - Unit testing framework

## 🔧 Prerequisites

- **Node.js 20+** and **pnpm 10.4.1+**
- **MySQL 8.0+** (or use Docker Compose)
- **Docker & Docker Compose** (for containerized deployment)

## 📦 Environment Variables

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

### Required Variables

```env
# Database
DATABASE_URL=mysql://username:password@localhost:3306/ai_cooking_agent

# OAuth (Manus Platform)
OAUTH_AUTHORIZATION_URL=https://your-oauth-provider.com/oauth/authorize
OAUTH_TOKEN_URL=https://your-oauth-provider.com/oauth/token
OAUTH_CLIENT_ID=your_client_id
OAUTH_CLIENT_SECRET=your_client_secret
OAUTH_REDIRECT_URI=http://localhost:3000/api/oauth/callback

# Session Security (generate with: openssl rand -hex 32)
SESSION_SECRET=your_random_session_secret_min_32_chars

# LLM (Gemini API)
LLM_API_KEY=your_gemini_api_key
LLM_BASE_URL=https://generativelanguage.googleapis.com/v1beta

# Storage
STORAGE_API_URL=https://your-storage-api.com
STORAGE_API_KEY=your_storage_api_key

# Admin User
OWNER_OPEN_ID=your_admin_user_open_id
```

## 🛠️ Local Development

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Set Up Database

Start MySQL (or use Docker Compose):

```bash
docker-compose up -d db
```

Run migrations:

```bash
pnpm db:push
```

### 3. Start Development Server

```bash
pnpm dev
```

The application will be available at `http://localhost:3000`

### 4. Run Tests

```bash
# Run all tests
pnpm test

# Run type checking
pnpm check

# Format code
pnpm format
```

## 🐳 Docker Deployment

### Using Docker Compose (Recommended for Production)

1. **Configure environment variables** in `.env` file

2. **Start all services**:

```bash
docker-compose up -d
```

This starts:
- MySQL database (port 3306)
- Application server (port 3000)

3. **Check service health**:

```bash
docker-compose ps
docker-compose logs app
```

4. **Stop services**:

```bash
docker-compose down
```

### Using Docker Only

1. **Build the image**:

```bash
docker build -t ai-cooking-agent .
```

2. **Run the container**:

```bash
docker run -d \
  --name ai-cooking-agent \
  -p 3000:3000 \
  --env-file .env \
  ai-cooking-agent
```

## 📊 Database Management

### Generate New Migration

```bash
pnpm drizzle-kit generate
```

### Apply Migrations

```bash
pnpm db:push
```

### Database Backup

```bash
# Backup
docker exec ai_cooking_agent_db mysqldump -u root -p ai_cooking_agent > backup.sql

# Restore
docker exec -i ai_cooking_agent_db mysql -u root -p ai_cooking_agent < backup.sql
```

## 🔒 Security Features

### Implemented Security Measures

- ✅ **Input Validation**: Comprehensive Zod schema validation on all API endpoints
- ✅ **Authorization Checks**: User ownership verification on all data operations
- ✅ **Rate Limiting**: Request throttling to prevent abuse
- ✅ **Security Headers**: CSP, HSTS, X-Frame-Options, etc.
- ✅ **SQL Injection Protection**: Drizzle ORM with parameterized queries
- ✅ **XSS Prevention**: Input sanitization and output encoding
- ✅ **SSRF Protection**: URL validation for external requests
- ✅ **Authentication**: Secure OAuth flow with JWT sessions
- ✅ **Database Indexes**: Optimized queries for performance

### Additional Recommendations for Production

1. **Enable HTTPS**: Use a reverse proxy (nginx/Traefik) with SSL/TLS certificates
2. **Set up WAF**: Web Application Firewall (e.g., Cloudflare, AWS WAF)
3. **Configure CORS**: Restrict allowed origins in production
4. **Enable Logging**: Integrate with logging service (Datadog, Sentry, CloudWatch)
5. **Backup Strategy**: Automated database backups to cloud storage
6. **Monitoring**: Set up health checks and alerting (UptimeRobot, Pingdom)
7. **Redis for Rate Limiting**: Use Redis for distributed rate limiting at scale

## 🚀 Production Deployment

### Manual Deployment

1. **Build the application**:

```bash
pnpm build
```

2. **Start production server**:

```bash
pnpm start
```

### CI/CD with GitHub Actions

The project includes a GitHub Actions workflow (`.github/workflows/ci.yml`) that:

1. Runs linting and type checking
2. Executes tests
3. Builds the application
4. Creates Docker images
5. Runs security audits

**To enable**:

1. Add secrets to GitHub repository:
   - `DOCKER_USERNAME`
   - `DOCKER_PASSWORD`

2. Push to `main` branch to trigger deployment

### Deployment Platforms

#### Vercel (Recommended)
**Deployment Method**: Vercel auto-deploy via Git integration (authoritative)

1. **Connect repository** in Vercel dashboard
2. **Set environment variables** in Vercel project settings
3. **Push to `main` branch** - Vercel automatically deploys

The project includes a GitHub Actions workflow (`.github/workflows/vercel-production.yml`) that runs **pre-deployment validation** (typecheck, tests, build) before Vercel's auto-deployment. This ensures code quality without blocking the deployment process.

For detailed setup instructions, see [VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md).

#### Netlify
```bash
# Connect your GitHub repo and deploy
# Set environment variables in platform dashboard
```

#### AWS / GCP / Azure
```bash
# Use Docker Compose or Kubernetes manifests
# Configure load balancer, auto-scaling, and RDS/Cloud SQL
```

#### DigitalOcean / Linode / Vultr
```bash
# Deploy using Docker Compose on VPS
docker-compose -f docker-compose.yml up -d
```

## 🧪 Testing

### Run All Tests

```bash
pnpm test
```

### Run Tests in Watch Mode

```bash
pnpm test --watch
```

### Test Coverage

```bash
pnpm test --coverage
```

### Example Tests

- **Unit Tests**: `server/_core/__tests__/security.test.ts`
- **Integration Tests**: `server/routers/__tests__/recipes.test.ts`

## 📁 Project Structure

```
ai_cooking_agent/
├── app/                    # Next.js app directory
│   ├── api/               # API routes (tRPC, OAuth)
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── client/                # Frontend React app
│   └── src/
│       ├── components/    # UI components (60+)
│       ├── pages/         # Page components
│       ├── hooks/         # React hooks
│       └── lib/           # Utilities
├── server/                # Backend Node.js
│   ├── routers.ts         # tRPC route definitions
│   ├── db.ts              # Database queries
│   ├── services/          # Business logic
│   │   └── export.ts      # Shopping list export
│   └── _core/             # Core utilities
│       ├── trpc.ts        # tRPC setup
│       ├── security.ts    # Security middleware
│       ├── logger.ts      # Logging utilities
│       └── errors.ts      # Error handling
├── drizzle/               # Database
│   ├── schema.ts          # Table definitions
│   └── migrations/        # SQL migrations
├── shared/                # Shared types
├── .github/workflows/     # CI/CD pipelines
├── docker-compose.yml     # Docker orchestration
├── Dockerfile             # Production container
└── package.json           # Dependencies
```

## 🔗 API Documentation

### tRPC Routes

#### Authentication
- `auth.me` - Get current user
- `auth.logout` - Logout user

#### Recipes
- `recipes.list` - List user recipes
- `recipes.getById` - Get recipe by ID
- `recipes.create` - Create new recipe
- `recipes.toggleFavorite` - Toggle favorite status
- `recipes.searchByIngredients` - Search TheMealDB
- `recipes.getTheMealDBDetails` - Get meal details
- `recipes.importFromTheMealDB` - Import from TheMealDB

#### Ingredients
- `ingredients.list` - List all ingredients
- `ingredients.getOrCreate` - Get or create ingredient
- `ingredients.recognizeFromImage` - AI image recognition
- `ingredients.addToUserList` - Add to user pantry
- `ingredients.getUserIngredients` - Get user pantry
- `ingredients.removeFromUserList` - Remove from pantry

#### Shopping Lists
- `shoppingLists.list` - List user shopping lists
- `shoppingLists.create` - Create shopping list
- `shoppingLists.getById` - Get shopping list
- `shoppingLists.getItems` - Get list items
- `shoppingLists.addItem` - Add item
- `shoppingLists.toggleItem` - Check/uncheck item
- `shoppingLists.removeItem` - Remove item
- `shoppingLists.delete` - Delete list
- `shoppingLists.addFromRecipe` - Add recipe ingredients
- `shoppingLists.export` - Export (CSV/TXT/MD/JSON)

## 🐛 Troubleshooting

### Database Connection Issues

```bash
# Check database is running
docker-compose ps db

# View database logs
docker-compose logs db

# Restart database
docker-compose restart db
```

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

### Build Failures

```bash
# Clear build cache
rm -rf .next dist node_modules

# Reinstall dependencies
pnpm install

# Rebuild
pnpm build
```

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📧 Support

For issues and questions:
- GitHub Issues: https://github.com/your-org/ai_cooking_agent/issues
- Documentation: See HANDOFF.md for detailed implementation notes

---

**Built with ❤️ using React 19, Next.js, tRPC, and Tailwind CSS 4**
