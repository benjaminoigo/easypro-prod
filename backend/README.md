# EasyPro Backend - Academic Writing Management System

A comprehensive backend system for managing academic writing orders, writers, and payments built with NestJS and TypeORM.

## Features

### 🔐 Authentication & Authorization
- JWT-based authentication
- Role-based access control (Admin/Writer)
- Invite-only registration system
- Admin approval workflow

### 👥 User Management
- Admin and Writer roles
- User approval system
- Account activation/deactivation

### ✍️ Writer Management
- Writer status tracking (Active, Probation, Suspended)
- Balance management in USD
- Performance statistics
- Status change history with reasons

### 📋 Order Management
- Complete order lifecycle management
- Order assignment to writers
- Status tracking (Assigned, In Progress, Submitted, Cancelled)
- Order cancellation with consequences

### ⏰ Shift System
- Automated 24-hour shift creation (6:00 AM - 5:59 AM)
- Configurable pages per shift limit
- Automatic shift statistics reset
- Cron job for shift management

### 📝 Work Submissions
- File upload support
- Page and amount validation
- Shift limit enforcement
- Admin review and approval system

### 💰 Payment System
- Balance tracking for writers
- Payment creation and processing
- Payment status management
- Transaction history

### 📊 Analytics & Reporting
- Admin dashboard with comprehensive metrics
- Writer performance analytics
- Order and submission statistics
- Payment tracking and reports

## Tech Stack

- **Framework**: NestJS
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **Authentication**: JWT with Passport
- **File Upload**: Multer
- **Validation**: class-validator
- **Scheduling**: @nestjs/schedule

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials and other settings
```

3. Set up PostgreSQL database:
```bash
# Create database named 'easypro' in PostgreSQL
createdb easypro
```

4. Start the development server:
```bash
npm run start:dev
```

5. Seed the admin user:
```bash
npm run seed
```

## Environment Variables

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your-password
DB_DATABASE=easypro
DB_SYNCHRONIZE=true
DB_LOGGING=false

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# Application Configuration
PORT=3000
NODE_ENV=development

# File Upload Configuration
UPLOAD_DEST=./uploads
MAX_FILE_SIZE=10485760

# CORS Configuration
CORS_ORIGIN=http://localhost:3001
```

## Default Admin Account

After running the seed command, use these credentials:
- **Email**: admin@easypro.com
- **Password**: admin123456

⚠️ **Important**: Change the admin password after first login!

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration (with invite token)
- `POST /api/auth/invite` - Generate invite link (Admin only)
- `PUT /api/auth/approve/:userId` - Approve user registration (Admin only)

### Users
- `GET /api/users` - Get all users (Admin only)
- `GET /api/users/pending-approvals` - Get pending user approvals (Admin only)

### Writers
- `GET /api/writers` - Get all writers (Admin only)
- `GET /api/writers/me` - Get current writer profile
- `PUT /api/writers/:id/status` - Update writer status (Admin only)

### Orders
- `POST /api/orders` - Create order (Admin only)
- `GET /api/orders` - Get all orders
- `PUT /api/orders/:id/assign/:writerId` - Assign order to writer (Admin only)

### Submissions
- `POST /api/submissions` - Submit work (Writer only)
- `GET /api/submissions` - Get all submissions (Admin only)
- `PUT /api/submissions/:id/review` - Review submission (Admin only)

### Payments
- `POST /api/payments` - Create payment (Admin only)
- `GET /api/payments` - Get all payments (Admin only)
- `PUT /api/payments/:id/mark-paid` - Mark payment as paid (Admin only)

### Analytics
- `GET /api/analytics/admin-dashboard` - Admin dashboard data
- `GET /api/analytics/my-analytics` - Writer's analytics

## Development

Start the development server:
```bash
npm run start:dev
```

The API will be available at `http://localhost:3000/api`

## Security Features

- Password hashing with bcrypt
- JWT token validation
- Role-based route protection
- File type validation
- Input validation with DTOs
- SQL injection protection via TypeORM