# Chat with PDF SaaS

A secure, SaaS-style **AI document Q&A** web app built with Next.js.

Users can create an account, upload PDFs, and ask natural language questions. The app extracts PDF text, chunks it, generates embeddings, retrieves the most relevant context, and produces Markdown answers using Groq LLM models.

## What this project includes

### Product functionality
- Landing page with SaaS positioning and call-to-action (`/`)
- User authentication: signup + login + session-based access
- Protected dashboard (`/dashboard`) and chat workspace (`/dashboard/chat`)
- PDF upload, indexing, semantic retrieval, and grounded Q&A
- Markdown-rendered chat responses with source preview snippets
- Per-user document isolation (users can only access their own documents)

### AI / document pipeline
- PDF text extraction with `pdfjs-dist`
- Text chunking with overlap for long documents
- Local embeddings via `@xenova/transformers` (`all-MiniLM-L6-v2`)
- Similarity + MMR-based context selection (to avoid repetitive chunks)
- Final answer generation via Groq Chat Completions API

### Security implemented
- Password hashing with `bcryptjs` (cost factor 12)
- Input validation with `zod`
- Signup rate limiting (basic in-memory limiter)
- Route protection middleware for dashboard/auth pages
- API route authorization checks (session required)
- Per-user ownership checks in chat/upload/document APIs
- Security headers in `next.config.ts`:
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`

## Tech stack

- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS v4
- **Auth**: NextAuth (credentials provider, JWT sessions)
- **Database**: MongoDB (`mongodb` driver)
- **AI**: Groq SDK + Transformers.js embeddings
- **PDF**: `pdfjs-dist`
- **Validation**: `zod`

## Architecture flow

1. User signs up / logs in.
2. User uploads PDF at `/api/upload` (authenticated).
3. Server extracts text from PDF.
4. Text is chunked into overlapping segments.
5. Embeddings are generated for each chunk.
6. Document + chunk vectors are stored in MongoDB (scoped by `userId`).
7. User asks a question at `/api/chat` (authenticated).
8. Question embedding is generated.
9. Most relevant chunks are retrieved using MMR.
10. Retrieved context + user question are sent to Groq.
11. Markdown answer + source previews returned to UI.

## Project routes

### App pages
- `/` - Marketing landing page
- `/login` - Login
- `/signup` - Registration
- `/dashboard` - User overview
- `/dashboard/chat` - Chat with PDF workspace

### API routes
- `POST /api/auth/register` - Create account
- `GET|POST /api/auth/[...nextauth]` - NextAuth handlers
- `GET /api/documents` - List current user documents
- `POST /api/upload` - Upload/index PDF (auth required)
- `POST /api/chat` - Ask question on indexed document (auth required)

## Environment variables

Copy `.env.example` to `.env.local` and fill values:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_strong_secret
MONGODB_URI=mongodb://127.0.0.1:27017
# MONGODB_DB=chatwithpdf
GROQ_API_KEY=your_groq_key
# GROQ_MODEL=llama-3.1-8b-instant
```

### Generate a strong auth secret

```bash
openssl rand -base64 32
```

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

For production mode:

```bash
npm run build
npm start
```

## MongoDB collections

### `users`
- `email` (unique index)
- `name`
- `passwordHash`
- `createdAt`

### `documents`
- `_id` (string UUID)
- `userId`
- `fileName`
- `preview`
- `chunkCount`
- `chunks[]` -> `{ text, embedding[] }`
- `createdAt`

## Current limitations / notes

- Signup rate limiter is in-memory (not distributed). For multi-instance deployment, move to Redis.
- Embedding generation runs server-side and may be slower on first use.
- Very large PDFs may exceed MongoDB document size constraints.
- Middleware currently uses Next's `middleware.ts` convention (Next 16 warns about future `proxy` migration).
- `next-auth@4` is used with Next 16 via legacy peer resolution; verify compatibility during upgrades.

## Suggested next improvements

- Add email verification and password reset
- Add per-document chat history and conversation threads
- Move vector storage to a dedicated vector database (Pinecone/pgvector)
- Add team/workspace billing with Stripe
- Add audit logging and stronger abuse protection
