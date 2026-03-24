# Audio Summarizer - Technical Project Description

## Product Overview

A modern web application that enables users to record or upload audio, transcribe it using AI, generate intelligent summaries, and interact with timestamped transcripts through an integrated audio player with waveform visualization.

**Core Value Proposition**: Transform audio content into searchable, navigable, and summarized text with seamless timestamp synchronization.

---

## Finalized Tech Stack

### Core Framework

- **Next.js 14+** with App Router (TypeScript)
- **React 18+** with Server Components and Server Actions
- **Node.js 18+**

### Database & ORM

- **Neon PostgreSQL** (serverless, excellent free tier)
- **Drizzle ORM** (type-safe, lightweight)
- **Drizzle Kit** for migrations

### Authentication

- **NextAuth.js v5** (Auth.js) with credentials provider
- Session management with JWT
- Protected routes and API endpoints

### Storage

- **Vercel Blob** for audio file storage
- Optimized for Vercel deployment
- Simple SDK integration

### AI Services

- **OpenAI Whisper API** for transcription
  - Excellent accuracy, ~$0.006/minute
  - Supports 50+ languages
  - Returns timestamped segments
- **OpenAI GPT-3.5-turbo** for summarization
  - Cost-effective at ~$0.50/1M tokens
  - Good quality summaries
  - Can reference specific timestamps

### UI & Styling

- **Tailwind CSS** for utility-first styling
- **shadcn/ui** for component library
- **Radix UI** primitives (via shadcn)
- Responsive design patterns

### Audio Processing

- **WaveSurfer.js** for waveform visualization
- Browser MediaRecorder API for recording
- Audio playback with seek functionality

### Deployment & Infrastructure

- **Vercel** for hosting (serverless functions)
- Edge-ready architecture
- Environment variable management

### Future Additions

- **Inngest** or **Trigger.dev** for background job processing (when needed for large files)
- **Zod** for runtime validation
- **React Hook Form** for form management

---

## Architecture Design

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Next.js App Router                   │
├─────────────────────────────────────────────────────────┤
│  Public Routes          │  Protected Routes              │
│  - /                    │  - /dashboard                  │
│  - /login               │  - /record                     │
│  - /register            │  - /upload                     │
│                         │  - /entry/[id]                 │
├─────────────────────────────────────────────────────────┤
│              Server Actions & API Routes                 │
│  - auth actions         │  - audio processing            │
│  - file upload          │  - AI transcription            │
│  - data queries         │  - AI summarization            │
├─────────────────────────────────────────────────────────┤
│              Business Logic Layer                        │
│  - Audio service        │  - AI service                  │
│  - Storage service      │  - User service                │
├─────────────────────────────────────────────────────────┤
│          External Services & Data Layer                  │
│  Neon PostgreSQL  │  Vercel Blob  │  OpenAI APIs        │
└─────────────────────────────────────────────────────────┘
```

### Request Flow Example: Audio Upload → Transcription

1. User uploads audio file via `/upload` page
2. Client sends file to Server Action
3. Server Action:
   - Validates file (size, format)
   - Uploads to Vercel Blob
   - Creates database entry with status "processing"
   - Sends audio URL to OpenAI Whisper API
4. Whisper returns timestamped transcript
5. Server Action:
   - Stores transcript in database
   - Sends transcript to GPT-3.5-turbo for summarization
6. GPT-3.5-turbo returns summary
7. Server Action:
   - Stores summary in database
   - Updates entry status to "completed"
8. Client redirects to entry view page

---

## Database Schema

### Entities and Relationships

```sql
-- Users (managed by NextAuth)
users
  - id (uuid, pk)
  - name (string, nullable)
  - email (string, unique, not null)
  - emailVerified (timestamp, nullable)
  - image (string, nullable)
  - createdAt (timestamp)
  - updatedAt (timestamp)

accounts (NextAuth OAuth accounts)
  - id (uuid, pk)
  - userId (uuid, fk → users.id)
  - type (string)
  - provider (string)
  - providerAccountId (string)
  - refresh_token (text, nullable)
  - access_token (text, nullable)
  - expires_at (integer, nullable)
  - token_type (string, nullable)
  - scope (string, nullable)
  - id_token (text, nullable)
  - session_state (string, nullable)

sessions (NextAuth sessions)
  - id (uuid, pk)
  - sessionToken (string, unique)
  - userId (uuid, fk → users.id)
  - expires (timestamp)

-- Core Application Entities
entries
  - id (uuid, pk)
  - userId (uuid, fk → users.id, not null)
  - title (string, nullable)
  - audioUrl (string, not null) // Vercel Blob URL
  - audioFileName (string, not null)
  - audioFileSize (integer, not null) // bytes
  - audioDuration (float, nullable) // seconds
  - mimeType (string, not null)
  - source (enum: 'upload' | 'recording')
  - status (enum: 'processing' | 'completed' | 'failed')
  - processingError (text, nullable)
  - createdAt (timestamp, default now)
  - updatedAt (timestamp)
  - deletedAt (timestamp, nullable) // soft delete

transcripts
  - id (uuid, pk)
  - entryId (uuid, fk → entries.id, unique, not null)
  - fullText (text, not null)
  - language (string, nullable)
  - confidence (float, nullable)
  - wordCount (integer, nullable)
  - createdAt (timestamp)

transcript_segments
  - id (uuid, pk)
  - transcriptId (uuid, fk → transcripts.id, not null)
  - text (text, not null)
  - startTime (float, not null) // seconds
  - endTime (float, not null) // seconds
  - confidence (float, nullable)
  - sequenceNumber (integer, not null) // order in transcript

summaries
  - id (uuid, pk)
  - entryId (uuid, fk → entries.id, unique, not null)
  - content (text, not null)
  - model (string, not null) // e.g., "gpt-3.5-turbo"
  - createdAt (timestamp)

summary_timestamps
  - id (uuid, pk)
  - summaryId (uuid, fk → summaries.id, not null)
  - text (text, not null) // the summary point
  - timestamp (float, not null) // seconds - reference point in audio
  - sequenceNumber (integer, not null) // order in summary
```

### Indexes

- `entries.userId + entries.createdAt` (for dashboard queries)
- `entries.status` (for filtering)
- `transcript_segments.transcriptId + sequenceNumber`
- `summary_timestamps.summaryId + sequenceNumber`

---

## Folder Structure

```
audio-summarizer/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # Auth route group
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── register/
│   │   │       └── page.tsx
│   │   ├── (protected)/              # Protected route group
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── record/
│   │   │   │   └── page.tsx
│   │   │   ├── upload/
│   │   │   │   └── page.tsx
│   │   │   └── entry/
│   │   │       └── [id]/
│   │   │           └── page.tsx
│   │   ├── api/                      # API routes
│   │   │   ├── auth/
│   │   │   │   └── [...nextauth]/
│   │   │   │       └── route.ts
│   │   │   └── webhooks/             # Future: for background jobs
│   │   ├── layout.tsx                # Root layout
│   │   ├── page.tsx                  # Landing page
│   │   └── globals.css
│   ├── components/                   # React components
│   │   ├── ui/                       # shadcn/ui components
│   │   ├── audio/
│   │   │   ├── AudioPlayer.tsx
│   │   │   ├── AudioRecorder.tsx
│   │   │   ├── AudioUploader.tsx
│   │   │   └── Waveform.tsx
│   │   ├── entry/
│   │   │   ├── EntryCard.tsx
│   │   │   ├── TranscriptView.tsx
│   │   │   ├── SummaryView.tsx
│   │   │   └── TimestampLink.tsx
│   │   ├── dashboard/
│   │   │   ├── EntryList.tsx
│   │   │   └── EntryFilters.tsx
│   │   └── layout/
│   │       ├── Header.tsx
│   │       ├── Sidebar.tsx
│   │       └── Footer.tsx
│   ├── lib/                          # Core business logic
│   │   ├── actions/                  # Server actions
│   │   │   ├── auth.ts
│   │   │   ├── entries.ts
│   │   │   ├── transcribe.ts
│   │   │   └── summarize.ts
│   │   ├── services/                 # Service layer
│   │   │   ├── ai/
│   │   │   │   ├── whisper.ts
│   │   │   │   ├── summarization.ts
│   │   │   │   └── openai-client.ts
│   │   │   ├── storage/
│   │   │   │   └── blob-storage.ts
│   │   │   ├── audio/
│   │   │   │   └── audio-processor.ts
│   │   │   └── entries/
│   │   │       └── entry-service.ts
│   │   ├── db/                       # Database
│   │   │   ├── index.ts              # Drizzle client
│   │   │   ├── schema.ts             # Drizzle schema
│   │   │   └── queries.ts            # Reusable queries
│   │   ├── auth/                     # Auth configuration
│   │   │   ├── auth.config.ts
│   │   │   └── auth.ts               # NextAuth setup
│   │   ├── validations/              # Zod schemas
│   │   │   ├── auth.ts
│   │   │   └── entry.ts
│   │   └── utils/                    # Utilities
│   │       ├── cn.ts                 # Class name helper
│   │       ├── format.ts             # Formatters
│   │       └── errors.ts             # Error handling
│   ├── hooks/                        # Custom React hooks
│   │   ├── use-audio-player.ts
│   │   ├── use-audio-recorder.ts
│   │   └── use-entries.ts
│   └── types/                        # TypeScript types
│       ├── audio.ts
│       ├── entry.ts
│       └── index.ts
├── drizzle/                          # Drizzle migrations
│   └── migrations/
├── public/                           # Static assets
│   ├── audio-placeholder.png
│   └── favicon.ico
├── .env.local                        # Environment variables
├── .env.example                      # Example env file
├── components.json                   # shadcn/ui config
├── drizzle.config.ts                 # Drizzle configuration
├── next.config.js                    # Next.js config
├── package.json
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

---

## Key User Flows

### 1. New User Registration & First Entry

1. Visit landing page → Click "Get Started"
2. Register with email/password
3. Redirected to dashboard (empty state)
4. Click "Upload Audio" or "Record Audio"
5. Upload/record audio file
6. Automatic processing begins (loading state)
7. Redirected to entry view showing transcript and summary
8. Click on timestamps to jump in audio

### 2. Returning User - Browse History

1. Login → Dashboard
2. See list of past entries with thumbnails/metadata
3. Filter by date, status, or search by title
4. Click entry → View full details

### 3. Audio Recording Flow

1. Navigate to /record
2. Click "Start Recording"
3. Browser requests microphone permission
4. Record audio (with live waveform)
5. Click "Stop Recording"
6. Preview recording with playback
7. Click "Process" → Upload to Vercel Blob
8. Processing begins (same as upload flow)

### 4. Interactive Transcript Navigation

1. On entry page, see audio player with waveform
2. Below: timestamped transcript segments
3. Click any segment → Audio seeks to that timestamp
4. Audio playing → Highlight current segment in transcript
5. Summary section has key points with timestamp links

---

## API & Backend Design

### Server Actions (preferred for mutations)

**File**: `src/lib/actions/entries.ts`

```typescript
"use server";

// Upload and process audio
export async function createEntryFromUpload(formData: FormData);
export async function createEntryFromRecording(audioBlob: Blob);
export async function deleteEntry(entryId: string);
export async function updateEntryTitle(entryId: string, title: string);
```

**File**: `src/lib/actions/transcribe.ts`

```typescript
"use server";

export async function transcribeAudio(entryId: string);
export async function retryTranscription(entryId: string);
```

**File**: `src/lib/actions/summarize.ts`

```typescript
"use server";

export async function summarizeTranscript(entryId: string);
export async function regenerateSummary(entryId: string);
```

### API Routes (for webhooks, external integrations)

**File**: `src/app/api/auth/[...nextauth]/route.ts`

- NextAuth.js handlers

**Future**: `src/app/api/webhooks/inngest/route.ts`

- Background job webhooks when scaling

---

## AI Workflow Design

### Transcription Workflow (OpenAI Whisper)

```typescript
// src/lib/services/ai/whisper.ts

import OpenAI from "openai";
import { put } from "@vercel/blob";

export async function transcribeAudioFile(audioUrl: string) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  // 1. Download audio from Vercel Blob
  const audioResponse = await fetch(audioUrl);
  const audioBlob = await audioResponse.blob();

  // 2. Convert to File object for Whisper API
  const file = new File([audioBlob], "audio.mp3", { type: "audio/mpeg" });

  // 3. Call Whisper API with timestamp_granularities
  const transcription = await openai.audio.transcriptions.create({
    file,
    model: "whisper-1",
    response_format: "verbose_json",
    timestamp_granularities: ["segment"],
  });

  // 4. Parse response
  return {
    fullText: transcription.text,
    language: transcription.language,
    segments: transcription.segments.map((seg, idx) => ({
      text: seg.text,
      startTime: seg.start,
      endTime: seg.end,
      sequenceNumber: idx,
    })),
  };
}
```

### Summarization Workflow (GPT-3.5-turbo)

```typescript
// src/lib/services/ai/summarization.ts

import OpenAI from "openai";

export async function summarizeTranscript(
  fullText: string,
  segments: Array<{ text: string; startTime: number }>
) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  // 1. Build prompt with instructions
  const prompt = `
You are an expert at summarizing transcripts. Given the following timestamped transcript, provide:
1. A concise summary (3-5 bullet points)
2. For each bullet point, include the most relevant timestamp in the format [MM:SS]

Transcript:
${segments.map((s) => `[${formatTime(s.startTime)}] ${s.text}`).join("\n")}

Output format:
- [00:30] Summary point 1
- [02:15] Summary point 2
...
  `.trim();

  // 2. Call GPT-3.5-turbo
  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content:
          "You are a helpful assistant that summarizes audio transcripts.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 500,
  });

  // 3. Parse response and extract timestamps
  const summaryText = completion.choices[0].message.content;
  const summaryPoints = parseSummaryWithTimestamps(summaryText);

  return {
    content: summaryText,
    model: "gpt-3.5-turbo",
    timestampedPoints: summaryPoints,
  };
}

function parseSummaryWithTimestamps(text: string) {
  // Parse [MM:SS] patterns and extract text
  const regex = /\[(\d{2}):(\d{2})\]\s*(.+?)(?=\n|$)/g;
  const points = [];
  let match;
  let sequence = 0;

  while ((match = regex.exec(text)) !== null) {
    const minutes = parseInt(match[1]);
    const seconds = parseInt(match[2]);
    const timestamp = minutes * 60 + seconds;
    const text = match[3].trim();

    points.push({
      text,
      timestamp,
      sequenceNumber: sequence++,
    });
  }

  return points;
}
```

### Complete Processing Pipeline

```typescript
// src/lib/services/entries/entry-service.ts

export async function processAudioEntry(entryId: string) {
  try {
    // 1. Update status to processing
    await db
      .update(entries)
      .set({ status: "processing" })
      .where(eq(entries.id, entryId));

    // 2. Get entry with audio URL
    const entry = await db.query.entries.findFirst({
      where: eq(entries.id, entryId),
    });

    if (!entry) throw new Error("Entry not found");

    // 3. Transcribe audio
    const transcriptionResult = await transcribeAudioFile(entry.audioUrl);

    // 4. Save transcript and segments to database
    const [transcript] = await db
      .insert(transcripts)
      .values({
        entryId,
        fullText: transcriptionResult.fullText,
        language: transcriptionResult.language,
        wordCount: transcriptionResult.fullText.split(" ").length,
      })
      .returning();

    await db.insert(transcriptSegments).values(
      transcriptionResult.segments.map((seg) => ({
        ...seg,
        transcriptId: transcript.id,
      }))
    );

    // 5. Summarize transcript
    const summaryResult = await summarizeTranscript(
      transcriptionResult.fullText,
      transcriptionResult.segments
    );

    // 6. Save summary and timestamp references
    const [summary] = await db
      .insert(summaries)
      .values({
        entryId,
        content: summaryResult.content,
        model: summaryResult.model,
      })
      .returning();

    if (summaryResult.timestampedPoints.length > 0) {
      await db.insert(summaryTimestamps).values(
        summaryResult.timestampedPoints.map((point) => ({
          ...point,
          summaryId: summary.id,
        }))
      );
    }

    // 7. Update entry status to completed
    await db
      .update(entries)
      .set({
        status: "completed",
        audioDuration:
          transcriptionResult.segments[transcriptionResult.segments.length - 1]
            ?.endTime,
      })
      .where(eq(entries.id, entryId));

    return { success: true };
  } catch (error) {
    // Handle errors
    await db
      .update(entries)
      .set({
        status: "failed",
        processingError: error.message,
      })
      .where(eq(entries.id, entryId));

    throw error;
  }
}
```

---

## Audio Player + Timestamp Synchronization

### Architecture

- **WaveSurfer.js** for waveform rendering and playback control
- **React Context** for player state management (current time, playing status)
- **Ref-based communication** between player and transcript components

### Implementation Approach

**File**: `src/components/audio/AudioPlayer.tsx`

```typescript
'use client'

import { useEffect, useRef } from 'react'
import WaveSurfer from 'wavesurfer.js'

interface AudioPlayerProps {
  audioUrl: string
  onTimeUpdate?: (currentTime: number) => void
  seekToTime?: number
}

export function AudioPlayer({ audioUrl, onTimeUpdate, seekToTime }: AudioPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const wavesurferRef = useRef<WaveSurfer | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Initialize WaveSurfer
    const wavesurfer = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#ddd',
      progressColor: '#333',
      cursorColor: '#333',
      height: 128,
      barWidth: 2,
      responsive: true
    })

    wavesurfer.load(audioUrl)

    // Emit time updates
    wavesurfer.on('audioprocess', () => {
      onTimeUpdate?.(wavesurfer.getCurrentTime())
    })

    wavesurfer.on('seek', () => {
      onTimeUpdate?.(wavesurfer.getCurrentTime())
    })

    wavesurferRef.current = wavesurfer

    return () => wavesurfer.destroy()
  }, [audioUrl])

  // Handle external seek requests
  useEffect(() => {
    if (seekToTime !== undefined && wavesurferRef.current) {
      wavesurferRef.current.seekTo(seekToTime / wavesurferRef.current.getDuration())
    }
  }, [seekToTime])

  return <div ref={containerRef} className="w-full" />
}
```

**File**: `src/hooks/use-audio-player.ts`

```typescript
"use client";

import { create } from "zustand";

interface AudioPlayerState {
  currentTime: number;
  isPlaying: boolean;
  duration: number;
  seekToTime: number | null;

  setCurrentTime: (time: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setDuration: (duration: number) => void;
  seekTo: (time: number) => void;
  clearSeek: () => void;
}

export const useAudioPlayer = create<AudioPlayerState>((set) => ({
  currentTime: 0,
  isPlaying: false,
  duration: 0,
  seekToTime: null,

  setCurrentTime: (time) => set({ currentTime: time }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setDuration: (duration) => set({ duration }),
  seekTo: (time) => set({ seekToTime: time }),
  clearSeek: () => set({ seekToTime: null }),
}));
```

**File**: `src/components/entry/TranscriptView.tsx`

```typescript
'use client'

import { useAudioPlayer } from '@/hooks/use-audio-player'
import { TimestampLink } from './TimestampLink'

interface TranscriptSegment {
  id: string
  text: string
  startTime: number
  endTime: number
}

interface TranscriptViewProps {
  segments: TranscriptSegment[]
}

export function TranscriptView({ segments }: TranscriptViewProps) {
  const { currentTime, seekTo } = useAudioPlayer()

  return (
    <div className="space-y-2">
      {segments.map((segment) => {
        const isActive = currentTime >= segment.startTime && currentTime < segment.endTime

        return (
          <div
            key={segment.id}
            className={`p-3 rounded-lg cursor-pointer transition-colors ${
              isActive ? 'bg-blue-100 border-blue-300' : 'hover:bg-gray-50'
            }`}
            onClick={() => seekTo(segment.startTime)}
          >
            <TimestampLink timestamp={segment.startTime} className="text-sm text-gray-500" />
            <p className="mt-1">{segment.text}</p>
          </div>
        )
      })}
    </div>
  )
}
```

**File**: `src/components/entry/TimestampLink.tsx`

```typescript
'use client'

import { useAudioPlayer } from '@/hooks/use-audio-player'

interface TimestampLinkProps {
  timestamp: number
  className?: string
}

export function TimestampLink({ timestamp, className }: TimestampLinkProps) {
  const { seekTo } = useAudioPlayer()

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        seekTo(timestamp)
      }}
      className={`hover:underline font-mono ${className}`}
    >
      {formatTime(timestamp)}
    </button>
  )
}
```

---

## File Storage Strategy

### Vercel Blob Integration

**Upload Flow:**

```typescript
// src/lib/services/storage/blob-storage.ts

import { put, del } from "@vercel/blob";

export async function uploadAudio(file: File, userId: string) {
  // Generate unique filename
  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const filename = `audio/${userId}/${timestamp}-${sanitizedName}`;

  // Upload to Vercel Blob
  const blob = await put(filename, file, {
    access: "public",
    addRandomSuffix: true,
  });

  return {
    url: blob.url,
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
  };
}

export async function deleteAudio(url: string) {
  await del(url);
}
```

**Security Considerations:**

- Files are publicly accessible by URL (needed for OpenAI Whisper API)
- URLs contain random suffixes (security through obscurity)
- Database stores userId for authorization checks
- Soft delete entries first, hard delete blobs in cleanup job

**Storage Limits:**

- Vercel Blob free tier: 1GB storage, 100GB bandwidth/month
- Max file size: 500MB per file (Vercel limit)
- Client-side validation: max 100MB for better UX
- Future: Implement chunked uploads for larger files

---

## Security & Authentication Considerations

### Authentication Flow (NextAuth.js v5)

**File**: `src/lib/auth/auth.ts`

```typescript
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db),
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        // Validate and return user
        const user = await db.query.users.findFirst({
          where: eq(users.email, credentials.email),
        });

        if (
          !user ||
          !(await bcrypt.compare(credentials.password, user.password))
        ) {
          return null;
        }

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
      }
      return session;
    },
  },
});
```

### Security Measures

1. **Authentication & Authorization**
   - All API routes and server actions check authentication
   - Row-level security: queries filter by `userId`
   - Session tokens in httpOnly cookies

2. **File Upload Security**
   - File type validation (audio/\* only)
   - File size limits (100MB client, 500MB server)
   - Virus scanning (future with background jobs)

3. **API Key Management**
   - All keys in environment variables
   - Never exposed to client
   - Separate keys for dev/prod

4. **Rate Limiting** (Future)
   - Implement Vercel rate limiting
   - Per-user processing limits
   - Cost monitoring for AI API usage

5. **Data Privacy**
   - Users can only access their own entries
   - Soft delete with option to permanently delete
   - Audio files deleted when entry is deleted

---

## Scalability Considerations

### Current Architecture (MVP)

- **Processing**: Inline in server actions (works for files < 10min)
- **Database**: Neon serverless (auto-scales)
- **Storage**: Vercel Blob (CDN-backed)
- **Hosting**: Vercel serverless functions

**Limitations:**

- Vercel function timeout: 60s (hobby), 300s (pro)
- Long audio files (>10min) may timeout
- No retry mechanism for failed processing

### Future Scaling Path

1. **Background Job Processing**
   - Integrate Inngest or Trigger.dev
   - Move transcription/summarization to background jobs
   - Add job status polling in UI
   - Implement retry logic

2. **Caching Layer**
   - Redis for frequently accessed entries
   - Cache waveform data
   - Cache summary responses

3. **Database Optimization**
   - Add read replicas for heavy queries
   - Implement pagination for large entry lists
   - Consider full-text search (Postgres FTS or Algolia)

4. **Cost Optimization**
   - Batch processing for multiple files
   - Use GPT-3.5-turbo instead of GPT-4 (already planned)
   - Implement per-user usage limits
   - Add user subscription tiers

5. **Performance Monitoring**
   - Vercel Analytics
   - Sentry for error tracking
   - Custom metrics for AI API usage and costs

---

## MVP Scope vs Future Improvements

### MVP Features (Phase 1 - Launch)

✅ **Must Have:**

- User registration & authentication
- Audio file upload (up to 100MB)
- In-browser audio recording
- AI transcription with timestamps
- AI-generated summary
- Audio player with waveform
- Clickable timestamps in transcript
- Dashboard with entry history
- Basic entry management (view, delete)

❌ **Not in MVP:**

- Background job processing
- OAuth providers (Google, GitHub)
- Team/sharing features
- Mobile app
- Real-time transcription
- Speaker diarization
- Export to PDF/Word
- Payment/subscription system
- Advanced search/filtering
- Audio editing capabilities

### Future Enhancements (Post-MVP)

**Phase 2: Enhanced Experience**

- Background processing for large files
- Speaker diarization (identify different speakers)
- Real-time transcription as recording
- Export transcripts (PDF, TXT, SRT)
- Audio trimming/editing
- Multiple language support UI

**Phase 3: Collaboration**

- Share entries with links
- Team workspaces
- Comments on transcript segments
- Collaborative editing of summaries

**Phase 4: Advanced Features**

- Custom AI prompts for summaries
- Keyword extraction and tagging
- Automatic chapter detection
- Integration with note-taking apps (Notion, Obsidian)
- API for third-party integrations

**Phase 5: Monetization**

- Free tier: 10 hours/month
- Pro tier: unlimited + advanced features
- Stripe integration
- Usage analytics dashboard

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1)

**Sprint 1.1: Project Setup**

- [ ] Initialize Next.js project with TypeScript
- [ ] Install and configure dependencies
- [ ] Set up Tailwind CSS and shadcn/ui
- [ ] Configure environment variables
- [ ] Set up Git and initial commit

**Sprint 1.2: Database & Auth**

- [ ] Set up Neon PostgreSQL database
- [ ] Install and configure Drizzle ORM
- [ ] Create database schema (users, entries, transcripts, summaries)
- [ ] Generate and run migrations
- [ ] Set up NextAuth.js v5
- [ ] Create login/register pages
- [ ] Implement protected route middleware

### Phase 2: Core Audio Features (Week 2)

**Sprint 2.1: Audio Upload**

- [ ] Create upload page UI
- [ ] Implement file validation (type, size)
- [ ] Integrate Vercel Blob storage
- [ ] Create entry in database on upload
- [ ] Show upload progress indicator

**Sprint 2.2: Audio Recording**

- [ ] Create recording page UI
- [ ] Implement MediaRecorder API integration
- [ ] Add recording controls (start, stop, pause)
- [ ] Show real-time waveform during recording
- [ ] Save recording to Vercel Blob

### Phase 3: AI Integration (Week 3)

**Sprint 3.1: Transcription**

- [ ] Set up OpenAI API client
- [ ] Implement Whisper API integration
- [ ] Create transcription service
- [ ] Save transcript and segments to database
- [ ] Add error handling and retry logic

**Sprint 3.2: Summarization**

- [ ] Implement GPT-3.5-turbo summarization
- [ ] Parse timestamps from summary
- [ ] Save summary and timestamp references
- [ ] Handle different transcript lengths
- [ ] Optimize prompt for best results

### Phase 4: Audio Player & Synchronization (Week 4)

**Sprint 4.1: Player Implementation**

- [ ] Integrate WaveSurfer.js
- [ ] Create AudioPlayer component
- [ ] Implement playback controls (play, pause, seek)
- [ ] Add waveform visualization
- [ ] Create Zustand store for player state

**Sprint 4.2: Timestamp Sync**

- [ ] Create TranscriptView component with segments
- [ ] Implement click-to-seek functionality
- [ ] Highlight active segment during playback
- [ ] Create TimestampLink component
- [ ] Add timestamp links in summary

### Phase 5: Dashboard & Entry Management (Week 5)

**Sprint 5.1: Dashboard**

- [ ] Create dashboard page layout
- [ ] Implement entry list with cards
- [ ] Add sorting (by date, title)
- [ ] Add filtering (by status)
- [ ] Show entry metadata (duration, date, status)

**Sprint 5.2: Entry Details Page**

- [ ] Create entry detail page layout
- [ ] Display audio player at top
- [ ] Show transcript below with segments
- [ ] Display summary with timestamps
- [ ] Add edit title functionality
- [ ] Add delete entry functionality

### Phase 6: Polish & Optimization (Week 6)

**Sprint 6.1: UI/UX Polish**

- [ ] Add loading states and skeletons
- [ ] Implement error boundaries
- [ ] Add toast notifications
- [ ] Improve responsive design
- [ ] Add keyboard shortcuts
- [ ] Optimize for accessibility (ARIA labels)

**Sprint 6.2: Testing & Bug Fixes**

- [ ] Manual testing of all flows
- [ ] Fix identified bugs
- [ ] Test with different audio formats
- [ ] Test with various file sizes
- [ ] Cross-browser testing

### Phase 7: Deployment (Week 7)

**Sprint 7.1: Pre-deployment**

- [ ] Review environment variables
- [ ] Set up production database (Neon)
- [ ] Configure production Vercel Blob
- [ ] Add production OpenAI API keys
- [ ] Set up error monitoring (Sentry)

**Sprint 7.2: Launch**

- [ ] Deploy to Vercel
- [ ] Test production environment
- [ ] Monitor for errors
- [ ] Create landing page content
- [ ] Update CLAUDE.md and README.md

### Phase 8: Post-Launch Iteration (Ongoing)

- [ ] Monitor user feedback
- [ ] Track AI API costs
- [ ] Analyze usage patterns
- [ ] Plan Phase 2 features based on data
- [ ] Implement background jobs if needed

---

## Environment Variables

```bash
# .env.example

# Database
DATABASE_URL="postgresql://user:password@host/database"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# OpenAI
OPENAI_API_KEY="sk-..."

# Vercel Blob (automatically provided by Vercel)
BLOB_READ_WRITE_TOKEN="vercel_blob_..."

# Optional: Error Monitoring
SENTRY_DSN=""
```

---

## Key Dependencies

```json
{
  "dependencies": {
    "next": "^14.1.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^5.3.0",

    "next-auth": "^5.0.0-beta.4",
    "@auth/drizzle-adapter": "^1.0.0",
    "bcryptjs": "^2.4.3",

    "drizzle-orm": "^0.30.0",
    "drizzle-kit": "^0.20.0",
    "@neondatabase/serverless": "^0.9.0",

    "@vercel/blob": "^0.22.0",

    "openai": "^4.28.0",

    "wavesurfer.js": "^7.7.0",

    "tailwindcss": "^3.4.0",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-toast": "^1.1.5",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0",

    "zustand": "^4.5.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "@types/react": "^18.2.0",
    "@types/bcryptjs": "^2.4.6",
    "eslint": "^8.56.0",
    "eslint-config-next": "^14.1.0",
    "prettier": "^3.2.0",
    "prettier-plugin-tailwindcss": "^0.5.0"
  }
}
```

---

## Development Guidelines

### Code Organization Patterns

1. **Server Actions over API Routes**
   - Use server actions for mutations
   - Colocate data fetching with components when possible
   - Use API routes only for webhooks or external APIs

2. **Service Layer Pattern**
   - Keep business logic in `/lib/services`
   - Server actions orchestrate services
   - Services should be pure and testable

3. **Component Structure**
   - Client components only when needed (interactivity, hooks)
   - Server components by default
   - Use composition over prop drilling

4. **Database Queries**
   - Use Drizzle query builder for type safety
   - Create reusable queries in `/lib/db/queries.ts`
   - Always filter by userId for authorization

5. **Error Handling**
   - Use try/catch in server actions
   - Return { success: boolean, error?: string }
   - Show user-friendly error messages
   - Log errors for debugging

### Testing Strategy (Future)

- **Unit tests**: Services and utilities (Vitest)
- **Integration tests**: API routes and server actions
- **E2E tests**: Critical user flows (Playwright)
- **Manual testing**: Audio playback and synchronization

---

## Success Metrics (Post-Launch)

1. **User Engagement**
   - Daily active users
   - Average entries per user
   - Retention rate (D7, D30)

2. **Technical Performance**
   - Average transcription time
   - Error rate (failed processing)
   - API response times

3. **Cost Metrics**
   - OpenAI API costs per entry
   - Storage costs
   - Average file size

4. **Feature Usage**
   - Recording vs upload ratio
   - Timestamp click-through rate
   - Summary generation rate

---

## Next Steps

1. **Review this document** and align on tech stack and architecture
2. **Set up development environment** (install tools, create accounts)
3. **Begin Phase 1** following the implementation roadmap
4. **Iterate on design** as implementation progresses
5. **Document learnings** and update this file as needed

---

**Document Version**: 1.0
**Last Updated**: 2026-03-24
**Author**: Claude Code Project Planner
