# BOBUX STORE 💰

**Cuan adalah jalan ninjaku**

A Next.js-based store management system for Roblox item transactions with role-based access control.

## Features

- 🔐 **Role-based Authentication** (Seller, Manager, Regular User)
- 📝 **Listing Management** with multiple categories
- 📊 **Manager Dashboard** with income statistics
- 🔔 **Real-time Notifications** for status updates
- 📱 **Responsive Design** with shadcn/ui components
- 🖼️ **Image Upload** for transfer proof
- 📈 **Monthly Income Tracking**

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **UI**: shadcn/ui + Tailwind CSS
- **Notifications**: Sonner
- **Image Upload**: Local storage / Cloudinary (optional)

## Getting Started

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd bobux-store
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Required environment variables:
- `DATABASE_URL`: Your PostgreSQL connection string
- `NEXTAUTH_URL`: Your application URL (http://localhost:3000 for development)
- `NEXTAUTH_SECRET`: A random secret key for NextAuth

### 4. Set up the database

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# Seed initial users (optional)
npm run seed
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Default Users (after running seed)

- **Seller**: username: `seller1`, password: `password123`
- **Manager**: username: `manager1`, password: `password123`  
- **Regular User**: username: `user1`, password: `password123`

## User Roles & Permissions

### 🎯 Seller
- Access to Homepage and Listings
- Can create new listings
- View their own listings and status

### 👑 Manager  
- Access to Homepage, Listings, and Dashboard
- Can view all listings from all sellers
- Can update listing status (Pending → In Progress → Done)
- View monthly income statistics
- Manage completed orders

### 👤 Regular User
- Access to Homepage only
- View store information

## Application Flow

1. **Login**: Users authenticate with username/password
2. **Sellers**: Create listings with player details, categories, and pricing
3. **Managers**: Review and update listing status
4. **Notifications**: Sound alerts when listings are marked as "Done"
5. **Analytics**: Monthly income tracking and statistics

## Categories Available

- 🎮 GamePass
- ⚔️ Senjata (Weapons)
- 👑 Title
- 💰 Rupiah
- ❓ Unknown

## Database Commands

```bash
# Generate Prisma client (after schema changes)
npx prisma generate

# Apply schema changes to database
npx prisma db push

# Create and apply migrations
npx prisma migrate dev

# Open Prisma Studio (database GUI)
npx prisma studio

# Seed database with test users
npm run seed
```

## Deploy on Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set your environment variables in Vercel dashboard
4. Deploy!

The Prisma database should be automatically set up on first deployment.

## Contributing

This is a personal project for a small team of 5 users. Feel free to customize based on your needs.

---

**"Cuan adalah jalan ninjaku"** 🥷💰

