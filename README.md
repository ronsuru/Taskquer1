# Taskquer1 - Full-Stack Task Management Application

A modern full-stack application built with React, Express, and PostgreSQL for managing tasks and campaigns.

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database (local or cloud service like Neon)
- npm or yarn package manager

## Quick Setup for Visual Studio

### Option 1: Automated Setup (Recommended)

1. **Run the PowerShell setup script:**
   ```powershell
   .\setup-dev.ps1
   ```

2. **Or run the batch file:**
   ```cmd
   setup-dev.bat
   ```

### Option 2: Manual Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create a `.env` file in the root directory:**
   ```env
   # Database Configuration
   DATABASE_URL="postgresql://username:password@localhost:5432/taskquer1_dev"
   
   # Environment
   NODE_ENV=development
   
   # Server Configuration
   PORT=5000
   ```

3. **Update the DATABASE_URL with your actual database credentials**

## Database Setup

### Option 1: Local PostgreSQL (Recommended for Development)

#### Windows Installation:
1. **Download PostgreSQL**: Go to [postgresql.org/download/windows](https://www.postgresql.org/download/windows/)
2. **Run the installer**: Choose the latest version (15 or 16)
3. **Set password**: Use `password` for the postgres user (or change it in .env)
4. **Keep default port**: 5432
5. **Complete installation**

#### Create Database:
1. **Open pgAdmin** (comes with PostgreSQL) or use command line
2. **Connect to server** using password you set
3. **Create database**: Right-click on "Databases" → "Create" → "Database"
4. **Name it**: `taskquer1_dev`

#### Alternative: Command Line Setup:
```bash
# Connect to PostgreSQL as postgres user
psql -U postgres

# Create database
CREATE DATABASE taskquer1_dev;

# Exit
\q
```

#### Update .env file:
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/taskquer1_dev
```

### Option 2: Neon (Cloud PostgreSQL)
1. Sign up at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string and update DATABASE_URL in `.env`

## Running the Application

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Open your browser and navigate to:**
   ```
   http://localhost:5000
   ```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run check` - TypeScript type checking
- `npm run db:push` - Push database schema changes

## Project Structure

```
Taskquer1/
├── client/          # React frontend
├── server/          # Express backend
├── shared/          # Shared types and schemas
├── .env             # Environment variables (create this)
└── package.json     # Dependencies and scripts
```

## Troubleshooting

### Common Issues

1. **"DATABASE_URL must be set"**
   - Make sure you have a `.env` file with DATABASE_URL
   - Verify the database connection string is correct

2. **Port already in use**
   - Change the PORT in `.env` file
   - Or kill the process using the port

3. **TypeScript errors**
   - Run `npm run check` to see specific errors
   - Make sure all dependencies are installed

### Getting Help

- Check the console output for error messages
- Verify your database connection
- Ensure all environment variables are set correctly

## Features

- User authentication and authorization
- Task and campaign management
- Real-time updates
- Admin dashboard
- Telegram bot integration
- TON blockchain integration
- File upload and storage

## Tech Stack

- **Frontend:** React 18, TypeScript, Tailwind CSS, Radix UI
- **Backend:** Express.js, Node.js, TypeScript
- **Database:** PostgreSQL with Drizzle ORM
- **Build Tools:** Vite, esbuild
- **State Management:** TanStack Query (React Query)
- **Authentication:** Passport.js with session management
