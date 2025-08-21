# TakeOn - Gamified Learning Platform

A Next.js application that gamifies the learning experience to help users ace their exams through interactive quiz games.

## Features

- 🎮 Create multiplayer quiz games
- 📚 Upload PDF study materials
- 👥 Real-time game lobbies
- ⏱️ Timed questions
- 🏆 Score tracking

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd takeon
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory with:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Supabase Setup

#### Required Tables

Make sure your Supabase database has the following tables:

1. **profiles** (for user authentication)
2. **games** (with the schema shown in your database design)
3. **topics** (with the schema shown in your database design)

#### Storage Bucket Setup

**⚠️ Important**: PDF upload requires proper Supabase Storage configuration.

**Quick Setup (Public Bucket)**:
1. Go to your Supabase dashboard → Storage
2. Create new bucket named `topic-pdfs`
3. Set as **Public bucket** = `true`

**Secure Setup (Private with RLS)**:
See detailed guide: [`SUPABASE_STORAGE_SETUP.md`](./SUPABASE_STORAGE_SETUP.md)

**Troubleshooting**:
- Error "new row violates row-level security policy" → Missing bucket or RLS policies
- The app will work without PDF upload if storage is not configured

#### RLS Policies

Make sure to set up Row Level Security (RLS) policies for your tables to ensure proper access control.

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Game Creation Flow

1. User creates an account and logs in
2. User fills out the game creation form with:
   - Topic name
   - Topic description
   - PDF study material
   - Number of questions
   - Time per question
3. System uploads PDF to Supabase storage
4. Game and topic are created in the database
5. User is redirected to the game lobby
6. Host can share the game link with friends
7. Players can join and start the game

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Authentication**: Supabase Auth

## Learn More

To learn more about the technologies used:

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

Make sure to add your environment variables in the Vercel dashboard.
