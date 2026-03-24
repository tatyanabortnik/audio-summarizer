import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  varchar,
  uuid,
  integer,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";

// ============================================================================
// NextAuth.js Tables
// ============================================================================

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  password: varchar("password", { length: 255 }), // For credentials provider
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 255 }).notNull(),
  provider: varchar("provider", { length: 255 }).notNull(),
  providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: varchar("token_type", { length: 255 }),
  scope: varchar("scope", { length: 255 }),
  id_token: text("id_token"),
  session_state: varchar("session_state", { length: 255 }),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionToken: varchar("session_token", { length: 255 }).notNull().unique(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable("verification_tokens", {
  identifier: varchar("identifier", { length: 255 }).notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

// ============================================================================
// Application Tables
// ============================================================================

// Entry status enum
export const entryStatusEnum = pgEnum("entry_status", [
  "pending",
  "processing",
  "completed",
  "failed",
]);

// Entries table - Main audio entries
export const entries = pgTable("entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  audioUrl: text("audio_url").notNull(), // Vercel Blob URL
  audioDuration: integer("audio_duration"), // Duration in seconds
  audioSize: integer("audio_size"), // Size in bytes
  audioFormat: varchar("audio_format", { length: 50 }), // e.g., "mp3", "wav", "m4a"
  status: entryStatusEnum("status").notNull().default("pending"),
  errorMessage: text("error_message"), // Store error details if processing fails
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

// Transcripts table - Full transcript for each entry
export const transcripts = pgTable("transcripts", {
  id: uuid("id").primaryKey().defaultRandom(),
  entryId: uuid("entry_id")
    .notNull()
    .references(() => entries.id, { onDelete: "cascade" })
    .unique(), // One transcript per entry
  fullText: text("full_text").notNull(), // Complete transcript text
  language: varchar("language", { length: 10 }), // e.g., "en", "es"
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

// Transcript segments table - Timestamped segments
export const transcriptSegments = pgTable("transcript_segments", {
  id: uuid("id").primaryKey().defaultRandom(),
  transcriptId: uuid("transcript_id")
    .notNull()
    .references(() => transcripts.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  startTime: integer("start_time").notNull(), // Start time in milliseconds
  endTime: integer("end_time").notNull(), // End time in milliseconds
  segmentIndex: integer("segment_index").notNull(), // Order of segment
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

// Summaries table - AI-generated summaries
export const summaries = pgTable("summaries", {
  id: uuid("id").primaryKey().defaultRandom(),
  entryId: uuid("entry_id")
    .notNull()
    .references(() => entries.id, { onDelete: "cascade" })
    .unique(), // One summary per entry
  content: text("content").notNull(), // Summary text
  model: varchar("model", { length: 100 }), // e.g., "gpt-3.5-turbo"
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

// Summary timestamps table - Clickable timestamp references in summaries
export const summaryTimestamps = pgTable("summary_timestamps", {
  id: uuid("id").primaryKey().defaultRandom(),
  summaryId: uuid("summary_id")
    .notNull()
    .references(() => summaries.id, { onDelete: "cascade" }),
  timestamp: integer("timestamp").notNull(), // Timestamp in milliseconds
  label: varchar("label", { length: 255 }), // Optional label for the timestamp
  position: integer("position").notNull(), // Position in summary text
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

// ============================================================================
// Relations
// ============================================================================

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  entries: many(entries),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const entriesRelations = relations(entries, ({ one, many }) => ({
  user: one(users, {
    fields: [entries.userId],
    references: [users.id],
  }),
  transcript: one(transcripts),
  summary: one(summaries),
}));

export const transcriptsRelations = relations(transcripts, ({ one, many }) => ({
  entry: one(entries, {
    fields: [transcripts.entryId],
    references: [entries.id],
  }),
  segments: many(transcriptSegments),
}));

export const transcriptSegmentsRelations = relations(
  transcriptSegments,
  ({ one }) => ({
    transcript: one(transcripts, {
      fields: [transcriptSegments.transcriptId],
      references: [transcripts.id],
    }),
  })
);

export const summariesRelations = relations(summaries, ({ one, many }) => ({
  entry: one(entries, {
    fields: [summaries.entryId],
    references: [entries.id],
  }),
  timestamps: many(summaryTimestamps),
}));

export const summaryTimestampsRelations = relations(
  summaryTimestamps,
  ({ one }) => ({
    summary: one(summaries, {
      fields: [summaryTimestamps.summaryId],
      references: [summaries.id],
    }),
  })
);
