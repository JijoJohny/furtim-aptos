# 🚀 Furtim - Private Payment 

**Furtim** lets you send and receive truly private payments on Aptos — your transactions stay unlinkable and your real wallet address stays hidden.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Aptos](https://img.shields.io/badge/Aptos-000000?logo=aptos&logoColor=white)](https://aptoslabs.com/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?logo=node.js&logoColor=white)](https://nodejs.org/)

## 📊 **Current Status**

- **Version**: V0.1.0 (Foundation Complete)
- **Network**: Devnet & Testnet
- **Status**: 🔧 **Active Development** - Extending Move modules and preparing for mainnet
- **Next Milestone**: V1.0 - Mainnet deployment with stealth-to-dApp transactions

## 🌟 Features

### 🔐 **Stealth Address Technology**
- **Untraceable Payments**: Send and receive payments without revealing wallet addresses
- **Meta Key System**: Advanced cryptographic key management for privacy
- **Ephemeral Keys**: One-time use keys for each transaction
- **Shared Secret Derivation**: Secure ECDH-based stealth address computation

### 💰 **Payment Features**
- **Fixed & Open Amount Links**: Create payment links with specified or flexible amounts
- **Digital Download Support**: Automatic file delivery after payment
- **Real-time Payment Tracking**: Monitor incoming stealth payments
- **Cross-platform Compatibility**: Works on all Aptos-compatible wallets

### 🛡️ **Security & Privacy**
- **PIN-based Authentication**: Secure access with user-defined PINs
- **Wallet Integration**: Seamless Aptos wallet connectivity
- **Session Management**: Secure JWT-based authentication
- **Row Level Security**: Database-level privacy protection

### 🎨 **User Experience**
- **Modern React UI**: Beautiful, responsive interface
- **Mobile-first Design**: Optimized for all devices
- **Real-time Updates**: Live payment status and balance updates
- **Intuitive Navigation**: Easy-to-use payment link creation

## 📁 Project Structure

```
furtim/
├── 📱 furtim-ui/                 # React frontend application
│   ├── src/
│   │   ├── components/          # UI components
│   │   ├── providers/           # Context providers
│   │   ├── services/            # API services
│   │   └── types/               # TypeScript definitions
│   ├── public/                  # Static assets
│   └── package.json
├── ⚙️ furtim-backend/            # Node.js/Express backend
│   ├── src/
│   │   ├── routes/              # API endpoints
│   │   ├── services/            # Business logic
│   │   ├── middleware/          # Express middleware
│   │   ├── config/              # Configuration files
│   │   └── tests/               # Test suites
│   ├── move/                    # Aptos Move smart contracts
│   │   ├── sources/             # Move source files
│   │   └── Move.toml            # Move package config
│   ├── database/                # Database schemas
│   ├── scripts/                 # Deployment & testing scripts
│   └── package.json
├── 🛠️ install_cli.py            # Aptos CLI installer
└── 📖 README.md                 # This file
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and **npm** 8+
- **Python** 3.7+ (for Aptos CLI installation)
- **Aptos wallet** (Petra, Pontem, etc.)
- **Supabase account** (for backend database)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/furtim.git
cd furtim
```

### 2. Install Aptos CLI

```bash
python install_cli.py
```

### 3. Setup Backend

```bash
cd furtim-backend
npm install
cp config.example.env config.env
# Edit config.env with your Supabase credentials
npm run dev
```

### 4. Setup Frontend

```bash
cd furtim-ui
npm install
cp config.example.env config.env
# Edit config.env with your backend API URL
npm start
```

### 5. Deploy Smart Contracts

```bash
cd furtim-backend
# Deploy to devnet (for testing)
.\scripts\deploy-devnet-simple.ps1

# Deploy to testnet (for staging)
.\scripts\deploy-testnet-simple.ps1
```

## 🏗️ Architecture

### Frontend (furtim-ui)
- **React 19** with TypeScript
- **Aptos Wallet Adapter** for blockchain integration
- **Lucide React** for icons and UI components
- **Modern CSS** with responsive design

### Backend (furtim-backend)
- **Express.js** with TypeScript
- **Supabase** for database and authentication
- **JWT** for session management
- **Helmet** for security headers
- **Rate limiting** for API protection

### Smart Contracts (Move)
- **Stealth Address Registry** for key management
- **Payment Creation** and claiming logic
- **Address Activation/Deactivation** functionality
- **Secure cryptographic operations**

## 🔧 Configuration

### Environment Variables

#### Backend (`furtim-backend/config.env`)
```env

# JWT Configuration
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=8000
NODE_ENV=development

# Aptos Configuration
APTOS_NETWORK=devnet
APTOS_NODE_URL=https://fullnode.devnet.aptoslabs.com
```

#### Frontend (`furtim-ui/config.env`)
```env
# Backend API Configuration
REACT_APP_API_URL=http://localhost:8000
REACT_APP_API_VERSION=v1

# Aptos Configuration
REACT_APP_APTOS_NETWORK=devnet
REACT_APP_APTOS_NODE_URL=https://fullnode.devnet.aptoslabs.com
```

## 🧪 Testing

### Run Backend Tests
```bash
cd furtim-backend
npm test
```

### Run Frontend Tests
```bash
cd furtim-ui
npm test
```

### Test Smart Contracts
```bash
cd furtim-backend
# Test on devnet
.\scripts\test-basic-devnet.ps1

# Test on testnet
.\scripts\test-testnet-quick.ps1
```

## 🚀 Deployment

### Development
```bash
# Start both frontend and backend
cd furtim
.\furtim\start-servers.ps1
```

### Production

#### Backend Deployment
```bash
cd furtim-backend
npm run build
npm start
```

#### Frontend Deployment
```bash
cd furtim-ui
npm run build
# Deploy build/ folder to your hosting service
```

#### Smart Contract Deployment
```bash
cd furtim-backend
# Deploy to mainnet
.\scripts\deploy-testnet-simple.ps1
```

## 🔐 Security Features

- **Stealth Addresses**: Complete payment privacy
- **Meta Key Encryption**: Secure key derivation
- **PIN Protection**: User-controlled access
- **JWT Authentication**: Secure session management
- **Rate Limiting**: API abuse prevention
- **Input Validation**: Comprehensive data sanitization
- **CORS Protection**: Cross-origin request security

## 🌐 Supported Networks

- **Devnet**: Development and testing
- **Testnet**: Staging and pre-production
- **Mainnet**: Production deployment

## 📱 Supported Wallets

- **Petra Wallet** (Recommended)
- **Pontem Wallet**
- **Martian Wallet**
- **Any Aptos-compatible wallet**

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Aptos Labs** for the excellent blockchain platform
- **Supabase** for the powerful backend-as-a-service
- **React Team** for the amazing frontend framework
- **Open Source Community** for inspiration and tools

## 📞 Support

- **Documentation**: [Wiki](https://github.com/your-username/furtim/wiki)
- **Issues**: [GitHub Issues](https://github.com/your-username/furtim/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/furtim/discussions)
- **Email**: support@furtim.com

## 🗺️ Development Roadmap

### ✅ **V0 - Foundation (Completed)**
- [✅] **Core Stealth Address System**: Basic stealth address implementation
- [✅] **React Frontend**: Complete UI with wallet integration
- [✅] **Express Backend**: API with authentication and user management
- [✅] **Move Smart Contracts**: Stealth address registry and payment logic
- [✅] **Devnet Deployment**: Testing and validation on Aptos devnet
- [✅] **Payment Link System**: Create and manage payment links
- [✅] **Meta Key Management**: Cryptographic key derivation and storage

### 🔧 **Current Development Phase (In Progress)**
- [✅] **Extended Move Modules**: Enhancing smart contract capabilities
- [✅] **Advanced Cryptographic Features**: Improved stealth address algorithms
- [✅] **Testnet Deployment**: Production-ready contract deployment
- [✅] **Comprehensive Testing**: Full contract verification and validation
- [✅] **Performance Optimization**: Gas efficiency and transaction speed improvements
- [🔄] **Security Audits**: Third-party security reviews and penetration testing

### 🚀 **V1 - Production Ready (Next Phase)**
- [🔄] **Mainnet Deployment**: Production deployment on Aptos mainnet
- [🔄] **Stealth-to-DApp Transactions**: Direct spending from stealth addresses
- [🔄] **Cross-DApp Integration**: Seamless interaction with other Aptos dApps
- [🔄] **Advanced Payment Features**: Recurring payments, payment scheduling
- [🔄] **Enhanced Privacy**: Additional privacy-preserving features
- [🔄] **Mobile Optimization**: Progressive Web App (PWA) capabilities
- [🔄] **API Extensions**: Enhanced API for third-party integrations
- [🔄] **Analytics Dashboard**: Payment insights and user analytics

### 🌟 **Future V2+ Features**
- [ ] **Mobile App**: React Native mobile application
- [ ] **Advanced Analytics**: Payment insights and reporting
- [ ] **API Marketplace**: Third-party integrations
- [ ] **Layer 2 Integration**: Optimistic rollups and sidechains
- [ ] **Institutional Features**: Enterprise-grade security and compliance

---

<div align="center">

**Built with ❤️ by the Furtim Team**

[Website](https://furtim.com) • [Documentation](https://docs.furtim.com) • [Twitter](https://twitter.com/furtim) • [Discord](https://discord.gg/furtim)

</div>
