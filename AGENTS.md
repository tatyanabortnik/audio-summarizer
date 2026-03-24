# AGENTS.md

This file provides guidance to agents like Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A web application for audio transcription and summarization. Users can record or upload audio, get AI-powered transcripts with timestamps, generate summaries, and interact with clickable timestamps synchronized with an audio player.

**Full Technical Spec**: See `project_description.md` for complete architecture.

## Tech Stack

- **Framework**: Next.js 14+ (App Router), TypeScript, React 18+
- **Database**: Neon PostgreSQL with Drizzle ORM
- **Auth**: NextAuth.js v5 (Auth.js)
- **Storage**: Vercel Blob
- **AI**: OpenAI Whisper API (transcription), GPT-3.5-turbo (summarization)
- **UI**: Tailwind CSS + shadcn/ui
- **Audio**: WaveSurfer.js for visualization and playback
- **Deployment**: Vercel
- **Validation**: Zod

## Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Database operations
npm run db:generate    # Generate migrations
npm run db:migrate     # Run migrations
npm run db:push        # Push schema changes
npm run db:studio      # Open Drizzle Studio

# Build for production
npm run build

# Run production server
npm start

# Linting
npm run lint
```

## Architecture Patterns

### App Router Structure

- Use Server Components by default
- Client components only when needed (interactivity, browser APIs)
- Server Actions for mutations (preferred over API routes)
- Colocate data fetching with components when possible

### Code Organization

> Note: There is **no `src/` directory**. All source folders live at the project root.

```
(project root)/
├── app/                        # Next.js App Router (pages, layouts, routes)
│   ├── (auth)/                 # Auth route group (login, register)
│   ├── (protected)/            # Protected route group (dashboard, upload, etc.)
│   └── api/auth/[...nextauth]/ # NextAuth API route handler
├── components/                 # React components
│   ├── ui/                     # shadcn/ui downloaded components
│   ├── audio/                  # Audio-related components
│   ├── entry/                  # Entry-related components
│   └── layout/                 # Layout components (Header, Footer)
├── lib/
│   ├── actions/                # Server actions (auth.ts, entries.ts, transcribe.ts, summarize.ts)
│   ├── services/               # Business logic (ai/, storage/)
│   ├── db/                     # Drizzle client (index.ts), schema.ts, migrate.ts
│   ├── auth/                   # NextAuth config (auth.ts)
│   ├── validations/            # Zod schemas (auth.ts, …)
│   └── utils.ts                # shadcn utility (cn helper)
├── hooks/                      # Custom React hooks (useFormValidation.ts, useAudioPlayer.ts)
└── types/                      # TypeScript types (next-auth.d.ts)
```

### Key Service Patterns

**Audio Processing Pipeline**:

1. Upload audio → Vercel Blob
2. Create entry in database (status: "processing")
3. Call OpenAI Whisper API for transcription
4. Save transcript + segments to database
5. Call GPT-3.5-turbo for summarization
6. Save summary + timestamp references
7. Update entry status to "completed"

**Timestamp Synchronization**:

- WaveSurfer.js manages audio playback
- Zustand store (`useAudioPlayer`) for shared player state
- Transcript segments highlight based on current time
- Clicking timestamps seeks audio player

### Database Schema Highlights

**Schema file**: `lib/db/schema.ts`

**Main entities**:

- `users` + `accounts` + `sessions` (NextAuth)
- `entries` (user audio uploads/recordings)
- `transcripts` + `transcript_segments` (timestamped text)
- `summaries` + `summary_timestamps` (AI-generated with references)

**Authorization**: All queries filter by `userId` for row-level security.

## Important Files

- `project_description.md` - Complete technical specification (full architecture, data models, API design)
- `lib/db/schema.ts` - Drizzle database schema
- `lib/auth/auth.ts` - NextAuth configuration
- `lib/validations/auth.ts` - Zod schemas for auth (register/login)
- `lib/actions/auth.ts` - Auth server actions (register, login)
- `hooks/use-form-validation.ts` - Client-side form validation hook
- `lib/services/ai/whisper.ts` - Transcription service (planned)
- `lib/services/ai/summarization.ts` - Summarization service (planned)
- `hooks/use-audio-player.ts` - Audio player state management (planned)

## Environment Variables

Required in `.env.local`:

```
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="..."
OPENAI_API_KEY="sk-..."
BLOB_READ_WRITE_TOKEN="..." (auto-provided by Vercel)
```

## Development Guidelines

1. **Imports**: Always use the `@/` alias for imports from project folders (e.g. `@/lib/db`, `@/components/ui/button`, `@/hooks/use-form-validation`). Never use relative paths (`../`, `./`) for cross-folder imports.
2. **Server Actions over API Routes**: Use server actions in `lib/actions/` for mutations
3. **Service Layer**: Keep business logic in `lib/services/` - server actions orchestrate services
4. **Type Safety**: Use Drizzle for type-safe queries, Zod for validation
5. **Authorization**: Always filter database queries by `userId` from session
6. **Error Handling**: Return `{ success: boolean, error?: string }` from server actions
7. **Component Strategy**: Server components by default, client only when needed
8. **Naming Conventions**: Use `PascalCase` for component names, `camelCase` for hook names (e.g. `useFormValidation`). Define components as arrow functions (e.g. `export const MyComponent = () => { ... }`).
9. **Composition**: Keep the code modular and create separate components. Keep the in `components/[domain]` folder.
10. **Data Fetching**: Fetch data in server components as close to where it is needed as possible. Pass a promise (not awaited) to child components and use `<Suspense>` to stream the UI. 11. **Exports** Pages and layouts have `export default` at the end. Components use named exports use `export const ComponentsName = ...`.

## Current Status

Project is in **development phase**. Follow the implementation roadmap in @todolist.md.

## Implementation Roadmap

See @todolist.md for detailed 8-phase roadmap:

1. Foundation (project setup, database, auth)
2. Core Audio Features (upload, recording)
3. AI Integration (transcription, summarization)
4. Audio Player & Synchronization
5. Dashboard & Entry Management
6. Polish & Optimization
7. Deployment
8. Post-Launch Iteration
