# Furtim Backend API

A secure backend API for the Furtim stealth address payment system, built with Express.js, TypeScript, and Supabase.

## 🚀 Features

- **Wallet Authentication**: Secure Aptos wallet-based authentication
- **User Management**: Complete user registration and session management
- **Two-Factor Authentication**: PIN-based security for returning users
- **Supabase Integration**: PostgreSQL database with Row Level Security
- **TypeScript**: Full type safety and modern development experience
- **Security**: JWT tokens, bcrypt hashing, and comprehensive validation

## 📋 Prerequisites

- Node.js 18+ 
- npm 8+
- Supabase account and project

## 🛠 Installation

1. **Clone and install dependencies:**
   ```bash
   cd furtim-backend
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp config.example.env .env
   ```
   
   Fill in your Supabase credentials and JWT secret:
   ```env
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRES_IN=7d
   PORT=3001
   NODE_ENV=development
   APTOS_NETWORK=testnet
   ```

3. **Set up Supabase database:**
   - Create a new Supabase project
   - Run the SQL schema from `database/schema.sql` in your Supabase SQL editor
   - This will create all necessary tables, indexes, and RLS policies

4. **Build and run:**
   ```bash
   npm run build
   npm start
   ```

## 🔧 Development

```bash
# Development mode with hot reload
npm run dev

# Build TypeScript
npm run build

# Run production build
npm start
```

## 📚 API Endpoints

### Authentication

#### `POST /api/auth/wallet`
Authenticate with wallet signature.

**Request:**
```json
{
  "wallet_address": "0x1234...5678",
  "signature": "signature_string",
  "message": "Authenticate with Furtim",
  "timestamp": 1234567890
}
```

**Response (New User):**
```json
{
  "success": true,
  "is_new_user": true,
  "message": "New user detected - proceed to registration",
  "session_token": "jwt_token"
}
```

**Response (Returning User):**
```json
{
  "success": true,
  "is_new_user": false,
  "user": {
    "id": "uuid",
    "username": "alice-designs",
    "wallet_address": "0x1234...5678",
    "created_at": "2024-01-01T00:00:00Z"
  },
  "session_token": "jwt_token",
  "message": "Authentication successful"
}
```

#### `POST /api/auth/register`
Register a new user.

**Request:**
```json
{
  "username": "alice-designs",
  "pin": "1234",
  "wallet_address": "0x1234...5678",
  "signature": "signature_string",
  "public_key": "optional_public_key"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "username": "alice-designs",
    "wallet_address": "0x1234...5678",
    "created_at": "2024-01-01T00:00:00Z"
  },
  "session_token": "jwt_token",
  "message": "User registered successfully"
}
```

#### `POST /api/auth/verify-pin`
Verify PIN for returning user.

**Request:**
```json
{
  "session_token": "jwt_token",
  "pin": "1234"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "username": "alice-designs",
    "wallet_address": "0x1234...5678"
  },
  "message": "PIN verification successful"
}
```

#### `POST /api/auth/check-username`
Check username availability.

**Request:**
```json
{
  "username": "alice-designs"
}
```

**Response:**
```json
{
  "success": true,
  "is_available": true,
  "message": "Username is available"
}
```

#### `GET /api/auth/me`
Get current user info (requires authentication).

**Headers:**
```
Authorization: Bearer jwt_token
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "username": "alice-designs",
    "wallet_address": "0x1234...5678",
    "created_at": "2024-01-01T00:00:00Z"
  },
  "message": "User info retrieved successfully"
}
```

#### `POST /api/auth/logout`
Logout user (requires authentication).

**Headers:**
```
Authorization: Bearer jwt_token
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

## 🔄 User Flow Implementation

### Flow A: New/Unregistered Users
1. User connects wallet → `POST /api/auth/wallet`
2. Backend returns `is_new_user: true`
3. Frontend shows full onboarding flow:
   - Username setup → `POST /api/auth/check-username`
   - PIN setup → `POST /api/auth/register`
4. User completes registration
5. Frontend navigates to dashboard

### Flow B: Returning/Registered Users
1. User connects wallet → `POST /api/auth/wallet`
2. Backend returns `is_new_user: false` with user data
3. Frontend skips onboarding, shows PIN entry screen
4. User enters PIN → `POST /api/auth/verify-pin`
5. Frontend navigates to dashboard

## 🗄 Database Schema

The database includes the following main tables:

- **users**: User profiles and authentication data
- **user_sessions**: JWT session management
- **payment_links**: Payment link configurations
- **transactions**: Blockchain transaction records
- **stealth_addresses**: Privacy-focused addresses
- **link_analytics**: Usage and performance metrics
- **user_settings**: User preferences and configurations
- **stealth_balances**: Real-time balance tracking

## 🔒 Security Features

- **Row Level Security (RLS)**: Database-level access control
- **JWT Tokens**: Secure session management
- **bcrypt Hashing**: PIN and sensitive data protection
- **Input Validation**: Comprehensive request validation
- **Rate Limiting**: API abuse prevention
- **CORS Protection**: Cross-origin request security
- **Helmet**: Security headers and protection

## 🌍 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SUPABASE_URL` | Supabase project URL | ✅ |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | ✅ |
| `JWT_SECRET` | JWT signing secret | ✅ |
| `JWT_EXPIRES_IN` | JWT expiration time | ❌ |
| `PORT` | Server port | ❌ |
| `NODE_ENV` | Environment mode | ❌ |

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 📦 Deployment

### Production Build
```bash
npm run build
npm start
```

### Environment Setup
Ensure all production environment variables are set:
- Use strong JWT secrets
- Configure proper CORS origins
- Set up SSL certificates
- Configure production database

### Docker (Optional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3001
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API examples

---

**Built with ❤️ for privacy-focused payments**
