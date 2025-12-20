# IPO Tracker Pro

A comprehensive IPO tracking platform with live Grey Market Premium (GMP) data, market indices, and news. Built with Next.js, FastAPI, and Playwright.

## Features
- **Live GMP Data:** Real-time Grey Market Premium rates scraped from leading financial sources.
- **Market Dashboard:** Live NIFTY 50 and SENSEX ticker (via `yfinance`).
- **News Aggregator:** Latest market news headlines.
- **Modern UI:** "Apple-like" clean, glassmorphic design.

## Prerequisites
- **Node.js** (v18 or higher)
- **Python** (v3.10 or higher)
- **Git**

## Hosting Locally (Quick Start)

You do **not** need to install PLSQL or Oracle. The project is pre-configured to use **SQLite** (a file-based database) which requires no setup.

### 1. Backend Setup

Open a terminal and navigate to the project root:

```bash
cd backend

# Create a virtual environment (optional but recommended)
python -m venv venv
# On Windows: venv\Scripts\activate
# On Mac/Linux: source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
pip install playwright
playwright install chromium

# Run the Scraper (Populate Data)
python scraper.py

# Start the API Server
uvicorn main:app --reload
```
The API will run at `http://localhost:8000`.

### 2. Frontend Setup

Open a new terminal window:

```bash
cd frontend

# Install dependencies
npm install

# Start the Development Server
npm run dev
```
The App will run at `http://localhost:3000`.

## Configuration (Optional)

### Using PostgreSQL (PLSQL)
If you prefer to use a production-grade database like PostgreSQL instead of SQLite:

1. Install and start PostgreSQL.
2. Create a database (e.g., `ipo_tracker`).
3. Set the environment variable before running the backend:

**Mac/Linux:**
```bash
export DATABASE_URL="postgresql://user:password@localhost/ipo_tracker"
uvicorn main:app --reload
```

**Windows (PowerShell):**
```powershell
$env:DATABASE_URL="postgresql://user:password@localhost/ipo_tracker"
uvicorn main:app --reload
```

### Data Sources
- **Market Data:** Uses `yfinance` (Yahoo Finance API). No API key required.
- **IPO Data:** Scraped from `ipowatch.in` using Playwright.
