# Contributing to Box Management System

Thank you for your interest in contributing to the Box Management System! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites
- Node.js 20 or higher
- npm or yarn
- Git
- Docker (optional, for container testing)

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/box-management-system.git
   cd box-management-system
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```
   Access the application at `http://localhost:5000`

4. **Database Setup**
   The SQLite database is automatically created on first run with sample data.

## 🏗️ Project Structure

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
└── data/                   # SQLite database location
```

## 🛠️ Development Guidelines

### Code Style
- **TypeScript**: Use strict TypeScript throughout
- **Components**: Prefer functional components with hooks
- **Formatting**: Project uses Prettier/ESLint (if configured)
- **Naming**: Use camelCase for variables, PascalCase for components

### Database Changes
1. Update schemas in `shared/schema.ts`
2. Run `npm run db:push` to apply changes
3. Never write manual SQL migrations

### API Development
1. Add new routes in `server/routes.ts`
2. Update storage interface in `server/storage.ts`
3. Use Zod schemas for validation
4. Follow RESTful conventions

### Frontend Development
1. Use TanStack React Query for server state
2. Implement proper loading and error states
3. Add data-testid attributes for testing
4. Use Radix UI components when possible

## 🧪 Testing

### Manual Testing
1. **Core Features**
   - Box and item CRUD operations
   - QR code generation and scanning
   - Receipt upload and viewing
   - Search functionality
   - Backup and restore

2. **Responsive Design**
   - Test on mobile, tablet, and desktop
   - Verify navigation and forms work correctly
   - Check touch interactions on mobile

3. **Docker Testing**
   ```bash
   docker build -t box-management .
   docker run -p 80:80 box-management
   ```

### Browser Testing
- Chrome/Chromium
- Firefox
- Safari (macOS/iOS)
- Mobile browsers

## 📝 Pull Request Process

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**
   - Follow coding guidelines
   - Test thoroughly
   - Update documentation if needed

3. **Commit Changes**
   ```bash
   git commit -m "feat: add your feature description"
   ```
   Use conventional commit messages:
   - `feat:` new features
   - `fix:` bug fixes
   - `docs:` documentation changes
   - `refactor:` code refactoring
   - `style:` formatting changes

4. **Push and Create PR**
   ```bash
   git push origin feature/your-feature-name
   ```
   Create a pull request with:
   - Clear description of changes
   - Screenshots for UI changes
   - Testing instructions

## 🐛 Bug Reports

When reporting bugs, please include:
- **Environment**: OS, browser, Node.js version
- **Steps to Reproduce**: Clear step-by-step instructions
- **Expected Behavior**: What should happen
- **Actual Behavior**: What actually happens
- **Screenshots**: If applicable
- **Console Logs**: Any error messages

## 💡 Feature Requests

For new features, please:
- Check existing issues first
- Describe the use case clearly
- Explain why it would be valuable
- Consider implementation complexity
- Be open to discussion and feedback

## 🏷️ Release Process

1. Update CHANGELOG.md
2. Bump version in package.json
3. Create release tag
4. Build and test Docker image
5. Update documentation

## 📚 Documentation

- Keep README.md updated
- Document new features in CHANGELOG.md
- Add inline code comments for complex logic
- Update deployment instructions if needed

## ❓ Questions?

- Open an issue for discussion
- Check existing documentation
- Review similar projects for patterns

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for helping make Box Management System better! 🎉