# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server with Turbopack (runs on http://localhost:3000)
- `npm run build` - Build the production application
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint for code linting
- `npm run seed` - Seed database with default users

## Testing Commands

No test framework is currently configured in this project.

## Database Commands

- `npx prisma generate` - Generate Prisma client (outputs to `src/generated/prisma/`)
- `npx prisma db push` - Push schema changes to database
- `npx prisma studio` - Open Prisma Studio database GUI
- `npx prisma migrate dev` - Create and apply a new migration

## Project Architecture

### Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS v4 with tw-animate-css for animations
- **UI Components**: shadcn/ui (New York style with Lucide icons)
- **Authentication**: NextAuth.js v4 with JWT strategy
- **Fonts**: Geist Sans and Geist Mono via `next/font`
- **Notifications**: Sonner toast library
- **Forms**: React Hook Form with Zod validation
- **Image Processing**: Cloudinary integration with react-dropzone

### Database Schema
The application uses a three-model system centered around a Roblox store concept:

- **User**: Authentication and role management (SELLER, MANAGER, REGULAR_USER)
- **Listing**: Player account listings with pricing, status tracking, and custom notes
- **Order**: Purchase orders linked to listings

Key relationships:
- Users can have multiple Listings (one-to-many)
- Listings can have multiple Orders (one-to-many)

### Directory Structure
- `src/app/` - Next.js App Router pages and layouts
  - `src/app/api/` - API routes for listings, dashboard, auth, and uploads
  - `src/app/listing/` - Listing creation and management pages
  - `src/app/dashboard/` - Manager dashboard with analytics
  - `src/app/generator/` - Script generator page
- `src/components/` - Custom React components
  - `src/components/ui/` - shadcn/ui components (auto-generated, do not edit manually)
- `src/lib/` - Utility functions and configurations
  - `src/lib/auth.ts` - NextAuth configuration
  - `src/lib/prisma.ts` - Database connection singleton
  - `src/lib/scriptGenerator.ts` - Roblox script generation logic
  - `src/lib/utils.ts` - Utility functions including `cn()` for class merging
- `src/generated/prisma/` - Generated Prisma client (do not edit manually)
- `prisma/` - Database schema and migrations
- `public/uploads/` - Transfer proof images

### Important Configuration
- **Prisma Client**: Generates to `src/generated/prisma/` instead of default location (configured in schema.prisma)
- **Path Aliases**: `@/*` maps to `./src/*`
- **Database**: Uses PostgreSQL via `DATABASE_URL` environment variable
- **shadcn/ui**: Configured with New York style, neutral base color, and Lucide icons

## Development Notes

### Database Development
- Always run `npx prisma generate` after schema changes to update the client
- The Prisma client is generated to a custom location (`src/generated/prisma/`)
- Use `npx prisma studio` to visually inspect/edit database data during development
- Import Prisma client from `@/generated/prisma`, NOT from `@prisma/client`

### Authentication
- Uses NextAuth.js v4 with JWT session strategy
- Credentials provider with bcrypt password hashing
- User roles (SELLER, MANAGER, REGULAR_USER) are stored in JWT token and session
- Custom session callback extends default session with role and username
- Auth configuration in `src/lib/auth.ts`

### Next.js Specific
- Project uses App Router (not Pages Router)
- Turbopack is enabled for faster development builds
- Custom fonts (Geist) are configured in the root layout
- API routes follow Next.js 15 App Router conventions (route handlers)

### Environment Variables Required
- `DATABASE_URL` - PostgreSQL connection string for Prisma
- `NEXTAUTH_URL` - Application URL (http://localhost:3000 for development)
- `NEXTAUTH_SECRET` - Secret key for NextAuth.js (generate with `openssl rand -base64 32`)
- Optional Cloudinary variables for image upload:
  - `CLOUDINARY_CLOUD_NAME`
  - `CLOUDINARY_API_KEY`
  - `CLOUDINARY_API_SECRET`

### Application Features
- **Role-based Authentication**: Sellers, Managers, and Regular Users with different access levels
- **Listing Management**: Create listings with categories (GamePass, Senjata, Title, Rupiah, Unknown)
- **Status Workflow**: Listings progress from PENDING → IN_PROGRESS → DONE
- **Dashboard Analytics**: Monthly/yearly income statistics for managers
- **Image Uploads**: Transfer proof images stored in `public/uploads/`
- **Script Generator**: Generates Roblox Lua scripts for inventory management
- **Notifications**: Sound alerts when listings are completed
- **Responsive UI**: Built with shadcn/ui components and Tailwind CSS

### Default Test Users (after running `npm run seed`)
- Seller: `seller1` / `password123`
- Manager: `manager1` / `password123`
- Regular User: `user1` / `password123`

## Component Architecture

### UI Components
- Built with shadcn/ui following the New York style variant
- Components located in `src/components/ui/` (auto-generated via CLI, do not edit manually)
- Custom components in `src/components/`
- Configured for Lucide React icons

### Key Utilities
- `src/lib/prisma.ts` - Database connection singleton with query logging in development
- `src/lib/auth.ts` - NextAuth configuration with JWT callbacks
- `src/lib/utils.ts` - Utility functions including `cn()` for class merging
- `src/lib/scriptGenerator.ts` - Generates Roblox Lua scripts based on purchase data

### Path Aliases
- `@/*` maps to `./src/*`
- `@/components` for UI components
- `@/lib` for utility functions
- `@/hooks` for custom React hooks
- `@/generated/prisma` for Prisma client (important: use this instead of @prisma/client)