# Overview

This is a comprehensive Box Management System - a web application for organizing and tracking physical storage boxes and their contents. The system enables users to catalog boxes, manage items within them, upload receipts, generate QR codes for easy access, and perform advanced search and export operations. The application is built as a full-stack solution with a React frontend and Express.js backend, designed to help users efficiently organize and track their physical storage.

## Current Status (August 15, 2025)
✅ **PRODUCTION READY & DEPLOYED** - All features fully working and Container Station deployment successful:
- Full-stack application with React frontend and Express backend running on port 80 (standard HTTP)
- **SQLite database persistence** - Data survives container restarts for NAS deployment
- **Docker build tested** - Multi-stage build creates 22.1KB backend + optimized frontend
- **Production server verified** - API responds correctly with persistent data
- Box and item management with complete CRUD operations
- QR code generation and display functionality  
- File upload system for receipt attachments (PDF, JPG, PNG, GIF)
- PDF/CSV export capabilities for box contents
- Global search functionality across boxes and items
- Statistics dashboard showing totals and metrics
- Sample data automatically loaded on first run (Kitchen Storage, Garage Tools, Office Supplies boxes)
- Responsive design with mobile-first approach
- Complete UI component library with shadcn/ui components
- Error handling and user feedback with toast notifications
- TypeScript throughout for type safety
- **Container Station deployment successful** - Vite dependency issues resolved, QR code display fixed, receipt viewing implemented
- **User verified working** - QR code generation and receipt viewing both functioning correctly
- **QR Scanner limitation identified** - Camera access requires HTTPS, manual navigation provided as fallback for HTTP deployments
- **Port 80 Configuration** - Updated to run on standard HTTP port 80 for production deployments
- **Complete Backup/Restore System** - Full data integrity with SQLite WAL checkpoint, creates ~94KB archives with all box/item data and receipts, restore completely overwrites existing data with proper database reconnection and storage reinitialization
- **Enhanced UX Implementation** - Universal AppHeader component with consistent navigation, improved animations with fade-in and slide-up effects, hover lift interactions, enhanced card designs with gradients and better visual hierarchy, responsive mobile-optimized layouts, staggered loading animations, and polished UI components throughout
- **Complete Location Management System** - Full CRUD operations for storage locations with database integration, location dropdowns in box forms, settings page management interface positioned prominently at top, sample locations auto-created, and protection against deleting locations in use by boxes

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The frontend is built using **React 18** with modern functional components and hooks, styled with **Tailwind CSS** for responsive design. The application uses **Vite** as the build tool for fast development and optimized production builds.

**Key Frontend Decisions:**
- **React Router (Wouter)** for lightweight client-side routing
- **TanStack React Query** for efficient server state management and caching
- **Radix UI** components for accessible, unstyled UI primitives
- **Shadcn/ui** component library built on top of Radix for consistent design system
- **React Hook Form** with **Zod** validation for type-safe form handling
- **TypeScript** throughout for type safety and better developer experience

## Backend Architecture
The backend is an **Express.js** server with TypeScript, implementing a RESTful API pattern. The server handles file uploads, database operations, and serves the built frontend in production.

**Key Backend Decisions:**
- **In-memory storage** with sample data for development (configurable for database integration)
- **Multer** middleware for handling file uploads (receipts)
- **Drizzle ORM** with SQLite configuration for future database persistence
- **Zod schemas** shared between frontend and backend for consistent validation
- **Express middleware** for logging, error handling, and CORS

## Data Storage Solutions
Uses **SQLite database persistence** with automatic sample data initialization for NAS deployment:

- **SQLite database** stored in `/data/boxes.db` for persistent storage
- **Drizzle ORM** with better-sqlite3 driver for high performance
- **Schema definitions** in shared TypeScript files with proper relations
- **Automatic table creation** and sample data initialization on first run
- **Volume mounting** configured for Container Station deployment

**Data Model:**
- **Boxes**: ID, name, location, description, timestamps
- **Items**: ID, box reference, name, quantity, details, value, receipt filename, timestamps
- **Locations**: ID, name, description, timestamps
- **Relationships**: One-to-many (Box → Items) with cascade delete, Locations referenced by Box location field

## Design Patterns and Architecture
- **Monorepo structure** with shared schemas between client and server
- **Type-safe API** with shared TypeScript interfaces
- **Component composition** using Radix UI primitives
- **Custom hooks** for business logic abstraction
- **Query invalidation** patterns for optimistic updates
- **Error boundaries** and comprehensive error handling
- **Responsive design** with mobile-first approach

# External Dependencies

## Core Framework Dependencies
- **React 18+** - Frontend framework with hooks and functional components
- **Express.js** - Backend web server framework
- **TypeScript** - Type safety across the entire application
- **Vite** - Build tool and development server
- **Node.js** - Runtime environment

## Database and ORM
- **Drizzle ORM** - Type-safe database ORM with migration support
- **Drizzle Kit** - Database migration and schema management
- **@neondatabase/serverless** - Serverless PostgreSQL client
- **SQLite** - Configured as alternative database option

## UI and Styling
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Unstyled, accessible UI component library
- **Lucide React** - Icon library for consistent iconography
- **Class Variance Authority** - Utility for creating variant-based component APIs

## Form Handling and Validation
- **React Hook Form** - Performant form library with minimal re-renders
- **Zod** - TypeScript-first schema validation
- **@hookform/resolvers** - Validation resolvers for React Hook Form

## File Upload and Storage
- **Multer** - Express middleware for handling multipart/form-data
- **File system** - Local file storage for receipt uploads

## State Management and Caching
- **TanStack React Query** - Server state management and caching
- **React Context** - Client-side state for UI components

## Development and Build Tools
- **ESBuild** - Fast JavaScript bundler for production builds
- **TSX** - TypeScript execution environment for development
- **PostCSS** - CSS post-processing with Tailwind integration

## Planned/Configured External Services
- **QR Code generation** - For box identification and mobile access
- **PDF export** - For generating printable box contents
- **CSV export** - For data portability
- **Camera integration** - For QR code scanning functionality