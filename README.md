# IC3.0 Online Forms & Workflows

A modern, scalable form builder and workflow automation system built with Next.js, TypeScript, PostgreSQL, and Prisma.

## Features

- **Drag-and-drop Form Builder** - Create forms with ease using an intuitive interface
- **Display Logic** - Show/hide fields based on user input (single trigger in Release 1)
- **Multi-stage Approval Workflows** - Sequential, parallel, or all-must-approve workflows
- **Permission Management** - Fine-grained control over who can build, submit, and view forms
- **Submission Management** - View, export, and archive submissions with full audit trails
- **Microsoft Teams Integration** - Real-time notifications for approvers
- **Mobile Responsive** - Works seamlessly on desktop and mobile devices

## Tech Stack

- **Frontend:** Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** Session-based auth with secure cookies
- **Deployment:** Dockerized for Fly.io or Render

## Prerequisites

- Node.js 18+ 
- PostgreSQL 15+
- Docker (optional, for local database)

## Getting Started

### 1. Clone and Install

```bash
# Install dependencies
npm install
```

### 2. Database Setup

#### Option A: Using Docker Compose (Recommended for local dev)

```bash
# Start PostgreSQL
docker-compose up -d

# The database will be available at localhost:5432
```

#### Option B: Using Existing PostgreSQL

Make sure PostgreSQL is running and create a database:

```sql
CREATE DATABASE ic3_forms;
```

### 3. Environment Variables

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

Update `.env` with your database URL:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/ic3_forms?schema=public"
SESSION_SECRET="your-random-secret-here"
```

### 4. Database Migrations

```bash
# Generate Prisma Client
npm run db:generate

# Run migrations
npm run db:migrate

# Or push schema (for development)
npm run db:push
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
ic3-forms-workflows/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Migration files
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── api/              # API routes
│   │   ├── (auth)/           # Auth pages
│   │   ├── (dashboard)/      # Dashboard pages
│   │   └── submit/           # Form submission pages
│   ├── components/           # React components
│   │   ├── forms/            # Form builder components
│   │   ├── workflows/        # Workflow components
│   │   ├── submissions/       # Submission components
│   │   ├── ui/               # Reusable UI components
│   │   └── layout/           # Layout components
│   ├── lib/                  # Utilities
│   ├── services/             # Business logic
│   ├── types/                # TypeScript types
│   └── hooks/                # React hooks
├── tests/                    # Test files
└── docs/                     # Documentation
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Type check without emitting
- `npm run db:generate` - Generate Prisma Client
- `npm run db:push` - Push schema to database (dev)
- `npm run db:migrate` - Run migrations
- `npm run db:studio` - Open Prisma Studio
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage

## Development Workflow

1. **Create a new form:**
   - Navigate to `/forms/new`
   - Use the drag-and-drop builder to add fields
   - Configure field properties and display logic
   - Set permissions
   - Publish the form

2. **Submit a form:**
   - Navigate to `/submit/[formId]`
   - Fill out the form
   - Save as draft or submit
   - If workflow is configured, approval process begins

3. **Manage approvals:**
   - Navigate to `/approvals`
   - View pending approvals
   - Approve, decline, or reject submissions
   - Add comments and reasons

4. **View submissions:**
   - Navigate to `/forms/[id]/submissions`
   - View all submissions for a form
   - Export to CSV/Excel
   - Archive submissions

## API Documentation

See [docs/API_DESIGN.md](./docs/API_DESIGN.md) for complete API documentation.

## Data Model

See [docs/DATA_MODEL.md](./docs/DATA_MODEL.md) for database schema and entity relationships.

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Deployment

### Using Docker

1. Build the Docker image:
```bash
docker build -t ic3-forms-workflows .
```

2. Run the container:
```bash
docker run -p 3000:3000 \
  -e DATABASE_URL="your-database-url" \
  -e SESSION_SECRET="your-secret" \
  ic3-forms-workflows
```

### Using Fly.io

1. Install Fly CLI
2. Run `fly launch`
3. Set environment variables
4. Deploy with `fly deploy`

### Using Render

1. Connect your GitHub repository
2. Set environment variables in Render dashboard
3. Deploy automatically on push

## Environment Variables

See `.env.example` for all required environment variables.

## Contributing

1. Create a feature branch
2. Make your changes
3. Write tests
4. Submit a pull request

## License

Proprietary - IC3.0 Internal Use Only

## Support

For issues and questions, contact the development team.

