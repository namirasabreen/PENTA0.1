# Penta - Library Management System

A modern Library Management System built with React, TypeScript, Tailwind CSS, and Supabase.

[![Open in Bolt](https://bolt.new/static/open-in-bolt.svg)](https://bolt.new/~/sb1-yho1kjvb)

## Deployment Guide

Follow these steps to deploy this application to **Vercel** and set up the **Supabase** backend database.

### Step 1: Set up Supabase Database

1. Go to [Supabase](https://supabase.com/) and create a new project.
2. Once your project is ready, navigate to the **SQL Editor** in the Supabase console.
3. Click **New Query**, paste the contents of the migration file:
   [`supabase/migrations/20260608214419_library_management_system.sql`](file:///C:/Users/NAMIRA/Desktop/Penta%20Project/supabase/migrations/20260608214419_library_management_system.sql)
4. Click **Run** to execute the script. This will set up the:
   - `profiles` table (linked to auth users).
   - `books` table (with seed data for sample books).
   - `borrowings` table (to track borrowed books).
   - Row-Level Security (RLS) policies.
   - Database functions to auto-generate library card numbers.

### Step 2: Configure Environment Variables

Create a `.env` file in the root directory (using `.env.example` as a template) and add your Supabase credentials:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```
You can find these credentials under **Project Settings -> API** in the Supabase console.

### Step 3: Deploy to Vercel

1. Push your repository to GitHub, GitLab, or Bitbucket.
2. Import the project on [Vercel](https://vercel.com).
3. Vercel will automatically detect the **Vite** framework preset.
4. Add the following **Environment Variables** in Vercel configuration:
   - `VITE_SUPABASE_URL` (your Supabase project URL)
   - `VITE_SUPABASE_ANON_KEY` (your Supabase anon key)
5. Click **Deploy**. Vercel will build the project and serve it.

### Routing Configuration
The project includes a [`vercel.json`](file:///C:/Users/NAMIRA/Desktop/Penta%20Project/vercel.json) file configured to route all traffic to `index.html`. This ensures that React Router's browser routing works correctly (e.g. direct access or refreshing on pages like `/books` or `/borrowings` won't result in a 404).

