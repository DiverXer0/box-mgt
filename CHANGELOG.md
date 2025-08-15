# Changelog

All notable changes to the Box Management System will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-08-15

### Added
- **Core Features**
  - Complete box and item management system with CRUD operations
  - Storage location management with dropdown integration
  - QR code generation and scanning functionality
  - Receipt file upload and viewing system (PDF, JPG, PNG, GIF)
  - Global search across boxes and items using Fuse.js
  - Statistics dashboard with totals and value tracking

- **Data Management**
  - SQLite database with persistent storage
  - Full backup and restore system with ZIP archives
  - Sample data initialization on first run
  - Database migrations using Drizzle ORM

- **User Experience**
  - Responsive design optimized for mobile and desktop
  - Universal navigation with AppHeader component
  - Smooth animations and loading states
  - Toast notifications for user feedback
  - Dark/light theme support

- **Deployment**
  - Docker containerization for easy deployment
  - Container Station compatibility for NAS systems
  - Port 80 configuration for standard HTTP
  - Multi-stage Docker build for optimized production images

- **Technical**
  - Full TypeScript implementation
  - React 18 with modern hooks and functional components
  - Express.js backend with RESTful API
  - Shared validation schemas between frontend and backend
  - TanStack React Query for efficient state management

### Technical Details
- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite, Radix UI
- **Backend**: Express.js, Node.js 20, SQLite, Drizzle ORM
- **Build**: Multi-stage Docker, ESBuild optimization
- **Database**: SQLite with automatic persistence and backup
- **Deployment**: Container Station ready, port 80 configuration

### Known Limitations
- QR code camera scanning requires HTTPS (manual entry fallback provided)
- Designed for single-user environments (no authentication system)
- SQLite database suitable for small to medium inventories

### Sample Data
- 3 sample boxes: Kitchen Storage, Garage Tools, Office Supplies
- 6 sample items with realistic descriptions and values
- 3 sample locations: Basement Shelf A1, Garage Wall Unit, Office Closet