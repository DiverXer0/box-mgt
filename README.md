# Box Management System

A comprehensive web application for organizing and tracking physical storage boxes and their contents. Perfect for home organization, storage unit management, or any scenario where you need to keep track of items stored in multiple boxes.

![Box Management System](https://img.shields.io/badge/Version-1.0.0-blue) ![Docker](https://img.shields.io/badge/Docker-Ready-green) ![License](https://img.shields.io/badge/License-MIT-yellow)

## ✨ Features

### 📦 **Box & Item Management**
- Create and organize storage boxes with locations and descriptions
- Add items to boxes with quantities, values, and detailed descriptions
- Edit and delete boxes and items with full CRUD operations
- Cascade delete protection (deleting a box removes all its items)

### 📱 **QR Code Integration**
- Generate unique QR codes for each box for quick mobile access
- QR code scanner for instant box lookup (HTTPS required for camera access)
- Printable QR code labels for physical box labeling
- Manual box ID entry as fallback for HTTP deployments

### 🗂️ **Smart Organization**
- **Location Management**: Organize boxes by storage locations (basement, garage, closet, etc.)
- **Global Search**: Find boxes and items across your entire inventory
- **Value Tracking**: Monitor total value of stored items
- **Statistics Dashboard**: Overview of total boxes, items, and values

### 📄 **File Management**
- Upload and attach receipt images (PDF, JPG, PNG, GIF) to items
- View receipts directly in the web interface
- Receipts included in backup/restore operations

### 💾 **Backup & Restore**
- **Full System Backup**: Download complete ZIP archives of all data
- **One-Click Restore**: Upload backup files to completely restore your data
- Includes all boxes, items, receipt files, and locations
- SQLite database with automatic data persistence

### 🎨 **Modern User Experience**
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Dark/Light Theme**: Automatic theme detection with manual override
- **Smooth Animations**: Polished UI with fade-in effects and hover interactions
- **Mobile-First**: Optimized for mobile organization tasks

## 🚀 Quick Start

### Using Docker (Recommended)

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd box-management-system
   ```

2. **Build and run with Docker:**
   ```bash
   docker build -t box-management .
   docker run -d -p 80:80 -v $(pwd)/data:/app/data --name box-management box-management
   ```

3. **Access the application:**
   Open your browser and go to `http://localhost`

### Using Node.js

1. **Prerequisites:**
   - Node.js 20+ and npm
   - Git

2. **Installation:**
   ```bash
   git clone <repository-url>
   cd box-management-system
   npm install
   ```

3. **Development:**
   ```bash
   npm run dev
   ```
   Access at `http://localhost:5000`

4. **Production:**
   ```bash
   npm run build
   npm start
   ```

## 🐳 Container Station / NAS Deployment

This application is specifically designed for Container Station deployment on QNAP, Synology, and other NAS systems:

### Container Station Setup

1. **Create Container:**
   - Image: Build from Dockerfile or use pre-built image
   - Port: 80 (HTTP)
   - Volume: Mount `/app/data` to persistent storage

2. **Volume Mapping:**
   ```
   Host Path: /share/Container/box-management/data
   Container Path: /app/data
   ```

3. **Environment Variables (Optional):**
   - `NODE_ENV=production`
   - `PORT=80`

### Important Notes for NAS Deployment

- **Data Persistence**: All data stored in SQLite database in `/data` directory
- **Port 80**: Configured to run on standard HTTP port
- **No HTTPS**: QR scanner requires manual navigation fallback
- **Backup Location**: Store backups on NAS for redundancy
- **Resource Usage**: Lightweight - uses ~50MB RAM, minimal CPU

## 📱 Mobile Usage

### QR Code Scanning
- **HTTPS Required**: Camera access needs secure connection
- **HTTP Fallback**: Manual box ID entry available
- **Mobile Browser**: Works with any modern mobile browser

### Mobile Features
- Touch-optimized interface
- Responsive navigation
- Mobile-friendly forms
- Optimized for inventory management on-the-go

## 🗃️ Data Management

### Backup Strategy
1. **Automatic Backups**: Use the built-in backup feature regularly
2. **Manual Backups**: Download backup files to secure location
3. **NAS Integration**: Store backups on your NAS for redundancy

### Data Structure
- **SQLite Database**: `data/boxes.db` - All structured data
- **Receipt Files**: `uploads/receipts/` - Attached receipt images
- **Backup Format**: ZIP archives containing database + files

### Sample Data
The application automatically creates sample data on first run:
- 3 sample boxes (Kitchen Storage, Garage Tools, Office Supplies)
- 6 sample items with realistic values and descriptions
- 3 sample locations (Basement Shelf A1, Garage Wall Unit, Office Closet)

## 🛠️ Technical Details

### Technology Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Backend**: Express.js, Node.js 20
- **Database**: SQLite with Drizzle ORM
- **UI Components**: Radix UI, shadcn/ui
- **State Management**: TanStack React Query
- **Build**: Multi-stage Docker build, ESBuild optimization

### Architecture
- **Full-Stack TypeScript**: Type safety across client and server
- **Shared Schemas**: Consistent validation between frontend and backend
- **RESTful API**: Clean API design with proper error handling
- **Component Library**: Reusable UI components with consistent design

### Performance
- **Small Bundle Size**: ~22KB backend, optimized frontend assets
- **Fast Database**: SQLite with indexing for quick searches
- **Efficient Queries**: Proper database relations and caching
- **Responsive UI**: Smooth animations and loading states

## 📁 Project Structure

```
box-management-system/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Main application pages
│   │   ├── lib/            # Utilities and helpers
│   │   └── hooks/          # Custom React hooks
├── server/                 # Express backend
│   ├── routes.ts           # API endpoints
│   ├── db.ts               # Database configuration
│   └── storage.ts          # Data access layer
├── shared/                 # Shared TypeScript schemas
├── data/                   # SQLite database location
├── uploads/                # Receipt file storage
├── Dockerfile              # Container configuration
└── docker-compose.yml      # Development setup
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Development Setup
```bash
npm install
npm run dev        # Start development server
npm run build      # Build for production
npm run db:push    # Push database schema changes
```

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

### Common Issues

**QR Scanner Not Working**
- Ensure HTTPS connection for camera access
- Use manual box ID entry as fallback
- Check browser permissions for camera

**Data Not Persisting**
- Verify volume mount for `/app/data` directory
- Check file permissions for database writes
- Ensure sufficient disk space

**Container Won't Start**
- Check port 80 availability
- Verify volume mount paths
- Review container logs for errors

### Getting Help
- Check the logs: `docker logs box-management`
- Verify database: SQLite browser can open `data/boxes.db`
- Test connectivity: Ensure port 80 is accessible

## 🎯 Use Cases

- **Home Organization**: Track items in storage boxes, closets, and rooms
- **Moving**: Inventory and organize items during relocation
- **Storage Units**: Manage contents of multiple storage units
- **Business Inventory**: Small business storage and warehouse organization
- **Seasonal Items**: Keep track of holiday decorations, winter clothes, etc.
- **Collections**: Organize and catalog collectibles, books, or hobby items

---

**Made with ❤️ for better organization and peace of mind.**