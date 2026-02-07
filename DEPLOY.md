# Deployment Guide

This guide will help you deploy the IPO Tracker Pro application for free using **Supabase** (Database), **Render** (Backend), and **Vercel** (Frontend).

## Prerequisites
1.  **GitHub Account**: You need to fork this repository to your own GitHub account.
2.  **Supabase Account**: [Sign up here](https://supabase.com/) (Free Tier).
3.  **Render Account**: [Sign up here](https://render.com/) (Free Tier).
4.  **Vercel Account**: [Sign up here](https://vercel.com/) (Free Tier).

---

## Step 1: Set up the Database (Supabase)

1.  Log in to **Supabase** and create a "New Project".
2.  Give it a name (e.g., `ipo-tracker-db`) and set a strong database password. **Save this password!**
3.  Wait for the database to be provisioned (takes ~1-2 minutes).
4.  Once ready, go to **Project Settings** (gear icon) -> **Database**.
5.  Under "Connection string", select **URI**.
6.  Copy the connection string. It will look like this:
    ```
    postgresql://postgres.kae...@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
    ```
    *Note: Replace `[YOUR-PASSWORD]` with the password you created in step 2.*
    *If using port 6543 (Transaction Pooler), make sure to add `?pgbouncer=true` to the end if you encounter issues, but standard port 5432 usually works fine with SQLAlchemy.*
    *Recommended: Use the "Session" connection string (Port 5432) for this app.*

---

## Step 2: Deploy the Backend (Render)

1.  Log in to **Render** and click **New +** -> **Web Service**.
2.  Connect your GitHub repository.
3.  **Name**: `ipo-tracker-api` (or any unique name).
4.  **Region**: Choose the one closest to you (e.g., Singapore/Ohio).
5.  **Root Directory**: `backend` (Important!).
6.  **Runtime**: select **Docker**.
7.  **Instance Type**: Select **Free**.
8.  **Environment Variables**:
    *   Click "Add Environment Variable".
    *   **Key**: `DATABASE_URL`
    *   **Value**: Paste the Supabase connection string from Step 1 (Replace `[YOUR-PASSWORD]`).
9.  Click **Create Web Service**.

Wait for the build to finish. It might take 5-10 minutes because it installs the browser for scraping.
Once deployed, copy the **onrender.com URL** (e.g., `https://ipo-tracker-api.onrender.com`).

---

## Step 3: Deploy the Frontend (Vercel)

1.  Log in to **Vercel** and click **Add New...** -> **Project**.
2.  Import your GitHub repository.
3.  **Framework Preset**: Next.js (should be auto-detected).
4.  **Root Directory**: Click "Edit" and select `frontend`.
5.  **Environment Variables**:
    *   Expand the section.
    *   **Key**: `NEXT_PUBLIC_API_URL`
    *   **Value**: The Render Backend URL from Step 2 (e.g., `https://ipo-tracker-api.onrender.com`).
    *   *Note: Do not include a trailing slash `/`.*
6.  Click **Deploy**.

Wait for the deployment to complete. Vercel will give you a live URL (e.g., `https://ipo-tracker-frontend.vercel.app`).

---

## Step 4: Verification

1.  Open your Vercel URL.
2.  The backend might take a minute to wake up (Render Free Tier spins down after inactivity). Be patient on the first load.
3.  The database will be empty initially. The backend is configured to scrape data every 4 hours.
4.  To trigger an immediate scrape, you can restart the Render service or wait for the scheduled job.

**Troubleshooting:**
*   **Database Error:** Check the `DATABASE_URL` in Render. Ensure the password is correct and special characters are URL-encoded if necessary.
*   **Scraping Error:** Check Render logs. If Playwright fails, ensure the Docker build completed successfully.
