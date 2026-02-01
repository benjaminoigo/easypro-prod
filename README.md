# Academic Writing Management System

A full-stack Academic Writing Management System built with NestJS backend and React frontend, designed to manage academic writing orders, writers, and submissions with a comprehensive 24-hour shift system.

## 🚀 Features

### Admin Features
- **User Management**: Invite-only registration system with admin approval
- **Order Management**: Create, assign, and track writing orders
- **Writer Management**: Monitor writer performance and status
- **Analytics Dashboard**: Comprehensive analytics and reporting
- **Payment Tracking**: Monitor payments and balances
- **Shift Management**: Automated 24-hour shift system (6:00 AM - 5:59 AM)

### Writer Features
- **Order Dashboard**: View assigned orders with priority indicators
- **Submission System**: Submit completed work with file uploads
- **Performance Analytics**: Track earnings, ratings, and completion rates
- **Real-time Status**: Online/offline status tracking
- **Balance Management**: View current balance and pending payments

## 🛠 Tech Stack

### Backend
- **Framework**: NestJS
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT with Passport
- **File Upload**: Multer
- **Validation**: Class-validator & Class-transformer
- **Scheduling**: Cron jobs for automated shift management

### Frontend
- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Routing**: React Router v6
- **Forms**: React Hook Form
- **Charts**: Recharts
- **Notifications**: React Toastify

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Backend Setup

1. **Navigate to backend**:
   ```bash
   cd easypro/backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment configuration**:
   Create `.env` file:
   ```env
   # Database
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=your_username
   DB_PASSWORD=your_password
   DB_DATABASE=easypro

   # JWT
   JWT_SECRET=your-super-secret-jwt-key-here

   # File Upload
   UPLOAD_PATH=./uploads
   MAX_FILE_SIZE=10485760
   ```

4. **Start the server**:
   ```bash
   npm run start:dev
   ```

   Backend will run on `http://localhost:3000`

### Frontend Setup

1. **Navigate to frontend**:
   ```bash
   cd easypro/frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm start
   ```

   Frontend will run on `http://localhost:3001`

## 📊 API Endpoints

### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration (with invite token)
- `GET /auth/profile` - Get current user profile

### Users (Admin only)
- `GET /users` - List all users
- `POST /users/invite` - Send writer invitation
- `PATCH /users/:id/approve` - Approve pending user

### Orders
- `GET /orders` - List orders (filtered by role)
- `POST /orders` - Create new order (Admin only)
- `GET /orders/assigned` - Get assigned orders (Writer)

### Submissions
- `POST /submissions` - Create submission
- `GET /submissions` - List submissions

### Analytics
- `GET /analytics` - System analytics

## 🏗 Architecture

### Database Entities
- **User**: Base user information with role-based access
- **Writer**: Extended profile for writers with status tracking
- **Order**: Writing assignments with deadlines and requirements
- **Submission**: Completed work submissions with review status
- **Payment**: Financial transactions and balance tracking
- **Shift**: 24-hour work periods with automatic creation

### Authentication Flow
1. Invite-only registration with admin approval
2. JWT-based authentication with role guards
3. Role-based route protection (Admin/Writer)

### Shift System
- Automated 24-hour shifts (6:00 AM - 5:59 AM)
- Cron job creates new shifts daily
- Writer status tracking within shifts

## 📄 License

This project is private and proprietary. All rights reserved.

---

**EasyPro Academic Writing Management System** - Streamlining academic writing operations with modern technology.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).

## � Render Deployment

This project is configured for easy deployment on Render. See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

### Quick Deploy (Blueprint)
1. Connect your GitHub repo to Render
2. Create a new Blueprint and select this repo
3. Render auto-detects `render.yaml` and configures everything
4. Click "Apply" to deploy all services

### Manual Deploy Steps:
1. Create PostgreSQL database on Render
2. Deploy backend as Web Service (root: `backend`)
3. Deploy frontend as Static Site (root: `frontend`)
4. Configure environment variables

### Required Environment Variables:

**Backend:**
- `DATABASE_URL` - Provided by Render PostgreSQL
- `JWT_SECRET` - Your secret key (use Generate)
- `CORS_ORIGIN` - Frontend URL

**Frontend:**
- `REACT_APP_API_URL` - Backend API URL

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## License

This project is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
