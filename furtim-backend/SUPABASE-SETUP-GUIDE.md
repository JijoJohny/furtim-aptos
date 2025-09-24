# Supabase Database Setup Guide for Furtim

## 🗄️ What Will Be Reflected on Supabase

When you run the database schema on Supabase, the following will be created:

### 📊 **Database Tables (17 tables)**

#### **Core User Management**
- ✅ `users` - User accounts with enhanced fields
- ✅ `user_meta_keys` - Encrypted stealth address keys
- ✅ `user_sessions` - Session management with security
- ✅ `user_settings` - User preferences and settings
- ✅ `user_notifications` - Notification system
- ✅ `user_activity` - User behavior tracking

#### **Payment System**
- ✅ `payment_links` - Payment link management
- ✅ `transactions` - Transaction tracking
- ✅ `link_analytics` - Payment link analytics

#### **Stealth Address System**
- ✅ `stealth_addresses` - Generated stealth addresses
- ✅ `stealth_transactions` - Stealth payment tracking
- ✅ `stealth_events` - Blockchain event monitoring
- ✅ `stealth_balances` - User balance tracking

#### **System Management**
- ✅ `indexer_state` - Blockchain indexer state
- ✅ `system_logs` - System monitoring
- ✅ `security_events` - Security monitoring
- ✅ `api_keys` - API access management

### 🔒 **Security Features**

#### **Row Level Security (RLS)**
- ✅ All tables have RLS enabled
- ✅ Users can only access their own data
- ✅ Public access only for active payment links
- ✅ Admin access for system management

#### **Data Protection**
- ✅ Encrypted meta keys storage
- ✅ Secure session management
- ✅ API key authentication
- ✅ Security event logging

### 📈 **Performance Features**

#### **Indexes (25+ indexes)**
- ✅ Optimized for fast queries
- ✅ Foreign key relationships
- ✅ Composite indexes for complex queries
- ✅ Unique constraints for data integrity

#### **Automation**
- ✅ Automatic timestamp updates
- ✅ Trigger-based data consistency
- ✅ Automated backup configuration

## 🚀 **Setup Steps**

### 1. **Create Supabase Project**
```bash
# Go to https://supabase.com
# Click "New Project"
# Enter project details
# Set database password
# Select region
```

### 2. **Get Credentials**
```bash
# Go to Settings > API
# Copy Project URL (SUPABASE_URL)
# Copy anon public key (SUPABASE_ANON_KEY)
# Copy service_role key (SUPABASE_SERVICE_ROLE_KEY)
```

### 3. **Run Database Schema**
```sql
-- Copy contents of database/complete-schema.sql
-- Paste in Supabase SQL Editor
-- Execute all commands
-- Verify tables are created
```

### 4. **Configure Environment**
```bash
# Update .env.local with your credentials
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## 🧪 **Testing Your Setup**

### **Database Connection Test**
```javascript
// Test database connection
const { testDatabaseConnection } = require('./src/config/database.ts');
testDatabaseConnection().then(success => {
  if (success) {
    console.log('✅ Database connected successfully');
  } else {
    console.log('❌ Database connection failed');
  }
});
```

### **Health Check**
```javascript
// Check database health
const { checkDatabaseHealth } = require('./src/config/database.ts');
checkDatabaseHealth().then(health => {
  console.log('Database Status:', health.status);
  console.log('Tables Available:', health.details.tables.length);
});
```

## 📊 **What You'll See in Supabase Dashboard**

### **Tables Section**
- 17 tables with all the fields we defined
- Proper relationships between tables
- Indexes for performance optimization

### **Authentication Section**
- RLS policies for each table
- User access controls
- Security configurations

### **SQL Editor**
- All the schema commands executed
- Table creation confirmations
- Index creation confirmations

### **Database Section**
- Connection strings
- API documentation
- Real-time subscriptions

## 🔧 **Production Configuration**

### **Environment Variables**
```bash
# Production configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_key
DATABASE_URL=postgresql://postgres:[password]@db.[project-id].supabase.co:5432/postgres
```

### **Security Settings**
- Enable RLS on all tables
- Configure API rate limiting
- Set up monitoring and alerts
- Configure backup schedules

## ✅ **Verification Checklist**

- [ ] Supabase project created
- [ ] Database schema executed
- [ ] All 17 tables created
- [ ] RLS policies active
- [ ] Environment variables configured
- [ ] Database connection test passed
- [ ] Health check successful

## 🎉 **Result**

After setup, you'll have a fully functional database with:
- ✅ Complete user management system
- ✅ Stealth address functionality
- ✅ Payment processing capabilities
- ✅ Analytics and monitoring
- ✅ Security and compliance features
- ✅ Performance optimizations

The database will be ready for the Furtim stealth address payment system!
