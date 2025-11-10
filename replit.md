# ArmorOps: Auto-Fix & PR Agent

## Overview
ArmorOps is a DevSecOps security analysis platform that analyzes Infrastructure as Code (IaC) files for security vulnerabilities and compliance issues. The application uses Google's Gemini AI to provide intelligent security recommendations.

**Current State:** Project successfully imported and running on Replit. The application is a React + TypeScript frontend using Vite as the build tool, with Firebase authentication and Google Gemini AI integration.

## Recent Changes (November 10, 2025)
- Initial import from GitHub/AI Studio export
- Created missing component and page structure:
  - `components/LandingPage.tsx` - Main landing page
  - `pages/AnalyzerPage.tsx` - IaC security analyzer
  - `pages/AutoFixAgentPage.tsx` - Auto-fix functionality
  - `pages/PublicRulesPage.tsx` - Security rules display
  - `pages/AdminPage.tsx` - Admin dashboard
  - `pages/AboutPage.tsx` - About page
  - `pages/AuthPage.tsx` - Authentication
  - `services/firebase.ts` - Firebase configuration
- Configured Vite to run on port 5000 for Replit compatibility
- Set up workflow for development server
- Added GEMINI_API_KEY secret configuration
- Created .gitignore for Node.js project

## Project Architecture

### Frontend Stack
- **Framework:** React 19.2.0 with TypeScript
- **Build Tool:** Vite 6.2.0
- **Styling:** Tailwind CSS (via CDN)
- **Authentication:** Firebase Auth
- **AI Integration:** Google Gemini AI (@google/genai)

### Project Structure
```
├── App.tsx              # Main application component with routing
├── index.tsx            # React entry point
├── components/          # Reusable components
│   └── LandingPage.tsx
├── pages/               # Page components
│   ├── AnalyzerPage.tsx
│   ├── AutoFixAgentPage.tsx
│   ├── PublicRulesPage.tsx
│   ├── AdminPage.tsx
│   ├── AboutPage.tsx
│   └── AuthPage.tsx
├── services/            # Service integrations
│   └── firebase.ts
├── translations.ts      # i18n translations (Vietnamese/English)
├── prompts.ts           # AI prompts for security analysis
├── types.ts             # TypeScript type definitions
└── vite.config.ts       # Vite configuration
```

### Key Features
1. **Security Analyzer** - Analyzes IaC code for vulnerabilities
2. **Auto-Fix Agent** - Automated code fixes
3. **Compliance Rules** - Displays security compliance rules
4. **Admin Dashboard** - Management interface (requires authentication)
5. **Multi-language** - Vietnamese and English support

## Environment Configuration

### Required Secrets
- `GEMINI_API_KEY` - Google Gemini AI API key (configured)

### Port Configuration
- Development server: Port 5000
- Configured for Replit proxy compatibility

## Development

### Running Locally
The workflow is already configured and running:
```bash
npm run dev
```

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Important Notes

### Security Considerations
- The application uses client-side Gemini API calls (API key exposed to frontend)
- This is acceptable for demo/development but should be moved to a backend API for production
- Firebase configuration uses demo credentials and should be updated with real project credentials

### Tailwind CSS
- Currently using CDN version (not recommended for production)
- For production, should install Tailwind as a PostCSS plugin

### Firebase Setup
- Demo Firebase credentials are placeholder values
- Update `services/firebase.ts` with actual Firebase project credentials

## Deployment
Deployment configuration will be added when ready for production deployment.

## User Preferences
- None specified yet
