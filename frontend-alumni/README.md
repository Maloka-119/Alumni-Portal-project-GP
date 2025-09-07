# Alumni Portal Frontend

This is the frontend application for the Alumni Portal, built with React and Vite.

## Project Structure

```
frontend-alumni/
├─ node_modules/
├─ public/
│   └─ index.html
├─ src/
│   ├─ components/     # Reusable UI components (Navbar, Button, Card)
│   ├─ pages/          # Full pages (Login, Dashboard, Profile)
│   ├─ services/       # API calls (axios instances)
│   ├─ routes/         # Routing files
│   ├─ assets/         # Images, icons, static files
│   ├─ App.js
│   └─ index.js
├─ package.json
├─ vite.config.js
└─ README.md

```

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. Install dependencies:

```bash
npm install
```

### Available Scripts

#### `npm run dev`

Runs the app in development mode with Vite's fast HMR (Hot Module Replacement).\
Open [http://localhost:5173](http://localhost:5173) to view it in your browser.

The page will reload instantly when you make changes.

#### `npm run build`

Builds the app for production to the `dist` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

#### `npm run preview`

Locally preview the production build.

## Technologies Used

- **React 18** - Frontend framework
- **Vite** - Build tool and development server
- **ES Modules** - Modern JavaScript module system

## Development

This project uses Vite for fast development and building. Vite provides:

- Lightning fast HMR
- Optimized builds
- Native ES modules support
- TypeScript support out of the box

## Learn More

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://reactjs.org/)
