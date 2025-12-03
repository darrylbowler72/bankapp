# Banking Application Architecture Documentation

**Version:** 1.0
**Last Updated:** 2025-12-03

---

## Table of Contents
1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture Design](#architecture-design)
4. [Data Model](#data-model)
5. [API Endpoints](#api-endpoints)
6. [Agentic AI Features](#agentic-ai-features)
7. [Security](#security)
8. [Deployment](#deployment)
9. [Development Setup](#development-setup)

---

## 1. System Overview

A modern, lightweight digital banking platform built with Node.js, Express, and PostgreSQL. The application supports core banking operations including user authentication, account management, transactions, and agentic AI automation features for enhanced security and user experience.

### Key Features
- User registration and JWT-based authentication
- Multi-account support (checking/savings)
- Deposit, withdrawal, and transfer operations
- Real-time transaction history
- Push notifications for account activities
- Agentic AI for fraud detection, balance monitoring, and customer assistance
- System health monitoring and self-healing capabilities

---

## 2. Technology Stack

### Frontend
- **Framework:** React 18
- **Routing:** React Router v6
- **HTTP Client:** Axios
- **Styling:** CSS3 with Grid and Flexbox
- **Build Tool:** Create React App
- **Web Server:** Nginx

### Backend
- **Runtime:** Node.js 20+
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** PostgreSQL 15
- **Caching:** Redis (optional)
- **Authentication:** JWT (jsonwebtoken)
- **Password Hashing:** bcrypt

### DevOps
- **Containerization:** Docker & Docker Compose
- **Process Management:** Node.js native
- **Logging:** JSON structured logs
- **Reverse Proxy:** Nginx

---

## 3. Architecture Design

### 3.1 Layered Architecture

```
┌─────────────────────────────────────┐
│         Client Layer                │
│   (Web/Mobile Applications)         │
└─────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│         API Gateway                 │
│    (Express.js + Middleware)        │
└─────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│         Service Layer               │
│  ┌─────────────────────────────┐   │
│  │  Auth Service               │   │
│  │  Account Service            │   │
│  │  Transaction Service        │   │
│  │  Notification Service       │   │
│  │  Agent Service              │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│         Data Layer                  │
│  ┌──────────────┐  ┌────────────┐  │
│  │  PostgreSQL  │  │   Redis    │  │
│  └──────────────┘  └────────────┘  │
└─────────────────────────────────────┘
```

### 3.2 Service Descriptions

#### Auth Service
- User registration with email validation
- Password hashing using bcrypt (10 salt rounds)
- JWT token generation and validation
- Session management

**Location:** `src/services/auth.service.ts`, `src/routes/auth.routes.ts`

#### Account Service
- Create checking or savings accounts
- List user accounts
- Retrieve account details and balances
- Account ownership verification

**Location:** `src/services/account.service.ts`, `src/routes/account.routes.ts`

#### Transaction Service
- Deposit funds to accounts
- Withdraw funds with balance validation
- Transfer between accounts
- Transaction history retrieval
- Atomic operations using database transactions

**Location:** `src/services/transaction.service.ts`, `src/routes/transaction.routes.ts`

#### Notification Service
- Create system notifications
- Alert users of important events
- Mark notifications as read
- Retrieve notification history

**Location:** `src/services/notification.service.ts`, `src/routes/notification.routes.ts`

#### Agent Service
- Balance monitoring and anomaly detection
- Customer spending analysis
- System health checks
- Automated alerts and recommendations

**Location:** `src/services/agent.service.ts`, `src/routes/agent.routes.ts`

### 3.3 Middleware

#### Authentication Middleware
- JWT token validation
- User identity extraction
- Protected route enforcement

**Location:** `src/middleware/auth.ts`

---

## 4. Data Model

### Database Schema

#### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Accounts Table
```sql
CREATE TABLE accounts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_type VARCHAR(50) NOT NULL DEFAULT 'checking',
  balance DECIMAL(15, 2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Transactions Table
```sql
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  to_account_id INTEGER REFERENCES accounts(id),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  description TEXT
);
```

#### Notifications Table
```sql
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Agent Logs Table
```sql
CREATE TABLE agent_logs (
  id SERIAL PRIMARY KEY,
  agent_type VARCHAR(100) NOT NULL,
  action VARCHAR(255) NOT NULL,
  details JSONB,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Entity Relationships

```
users (1) ──→ (N) accounts
accounts (1) ──→ (N) transactions
users (1) ──→ (N) notifications
```

---

## 5. API Endpoints

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Register new user | No |
| POST | `/auth/login` | Login and get JWT token | No |

#### Request/Response Examples

**POST /auth/register**
```json
Request:
{
  "email": "user@example.com",
  "password": "securePassword123"
}

Response:
{
  "user": {
    "id": 1,
    "email": "user@example.com"
  }
}
```

**POST /auth/login**
```json
Request:
{
  "email": "user@example.com",
  "password": "securePassword123"
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com"
  }
}
```

### Account Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/accounts` | List user's accounts | Yes |
| POST | `/accounts` | Create new account | Yes |
| GET | `/accounts/:accountId` | Get account details | Yes |

#### Request/Response Examples

**POST /accounts**
```json
Request:
{
  "accountType": "checking"
}

Response:
{
  "account": {
    "id": 1,
    "user_id": 1,
    "account_type": "checking",
    "balance": "0.00",
    "created_at": "2025-12-03T10:00:00Z"
  }
}
```

### Transaction Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/transactions/deposit` | Deposit funds | Yes |
| POST | `/transactions/withdraw` | Withdraw funds | Yes |
| POST | `/transactions/transfer` | Transfer between accounts | Yes |
| GET | `/transactions/:accountId` | View transaction history | Yes |

#### Request/Response Examples

**POST /transactions/deposit**
```json
Request:
{
  "accountId": 1,
  "amount": 1000.00,
  "description": "Initial deposit"
}

Response:
{
  "transaction": {
    "id": 1,
    "account_id": 1,
    "type": "deposit",
    "amount": "1000.00",
    "timestamp": "2025-12-03T10:00:00Z"
  }
}
```

**POST /transactions/transfer**
```json
Request:
{
  "fromAccountId": 1,
  "toAccountId": 2,
  "amount": 250.00,
  "description": "Transfer to savings"
}

Response:
{
  "transaction": {
    "id": 2,
    "account_id": 1,
    "type": "transfer",
    "amount": "250.00",
    "to_account_id": 2,
    "timestamp": "2025-12-03T10:05:00Z"
  }
}
```

### Notification Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/notifications` | Get user notifications | Yes |
| PATCH | `/notifications/:id/read` | Mark notification as read | Yes |

### Agent Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/agents/balance-monitor` | Run balance monitoring agent | Yes |
| GET | `/agents/customer-assistant` | Get spending analysis | Yes |
| GET | `/agents/system-health` | Check system health | No |
| GET | `/agents/logs` | View agent activity logs | Yes |

---

## 6. Agentic AI Features

### 6.1 Balance Monitor Agent

**Purpose:** Detect unusual account activity and low balances

**Functionality:**
- Monitors withdrawals over $1000 in the last hour
- Detects accounts with balance below $100
- Sends automatic alerts to affected users
- Logs all detections for audit

**Endpoint:** `POST /agents/balance-monitor`

**Implementation:** `src/services/agent.service.ts:balanceMonitorAgent()`

### 6.2 Customer Assistant Agent

**Purpose:** Provide spending insights and financial recommendations

**Functionality:**
- Analyzes last 30 days of transactions
- Calculates total spent vs deposited
- Provides personalized recommendations
- Generates spending summaries

**Endpoint:** `GET /agents/customer-assistant`

**Response Example:**
```json
{
  "summary": {
    "period": "Last 30 days",
    "totalTransactions": 25,
    "totalSpent": "1500.00",
    "totalDeposited": "3000.00",
    "netChange": "1500.00",
    "averageTransactionAmount": "180.00"
  },
  "recommendation": "Great job saving! You might want to consider investment opportunities."
}
```

**Implementation:** `src/services/agent.service.ts:customerAssistantAgent()`

### 6.3 System Health Agent

**Purpose:** Monitor system performance and detect issues

**Functionality:**
- Database connectivity checks
- Response time measurement
- Error rate monitoring
- Health status reporting

**Endpoint:** `GET /agents/system-health`

**Response Example:**
```json
{
  "status": "healthy",
  "checks": {
    "database": true,
    "responseTime": 45,
    "errorRate": 0
  },
  "timestamp": "2025-12-03T10:00:00Z"
}
```

**Implementation:** `src/services/agent.service.ts:systemHealthAgent()`

### 6.4 Agent Logging

All agent activities are logged to the `agent_logs` table with:
- Agent type
- Action performed
- Detailed JSONB payload
- Timestamp

**Access:** `GET /agents/logs`

---

## 7. Security

### 7.1 Authentication & Authorization

- **JWT Tokens:** 24-hour expiration by default
- **Password Security:** bcrypt hashing with 10 salt rounds
- **Route Protection:** Middleware-based authentication
- **Token Format:** `Authorization: Bearer <token>`

### 7.2 Database Security

- **SQL Injection Prevention:** Parameterized queries throughout
- **Cascade Deletes:** Automatic cleanup of related records
- **Transaction Isolation:** ACID compliance for financial operations

### 7.3 Data Validation

- Email and password validation on registration
- Amount validation (positive numbers only)
- Account ownership verification
- Balance checks before withdrawals

### 7.4 Production Recommendations

- [ ] Use HTTPS/TLS for all communications
- [ ] Store JWT_SECRET in secure vault (not .env)
- [ ] Implement rate limiting
- [ ] Add request validation middleware
- [ ] Enable database connection encryption
- [ ] Implement audit logging
- [ ] Add two-factor authentication
- [ ] Use secrets management (AWS Secrets Manager, HashiCorp Vault)

---

## 8. Deployment

### 8.1 Docker Deployment

The application includes complete Docker configuration:

**Services:**
- `postgres` - PostgreSQL 15 database
- `redis` - Redis 7 cache (optional)
- `api` - Node.js application

**Start Command:**
```bash
docker-compose up -d
```

**Environment Variables:**
All configurable through docker-compose.yml or .env file

### 8.2 Production Deployment Options

#### Option 1: Container Platform
- Docker Swarm
- Kubernetes
- AWS ECS/EKS
- Google Cloud Run
- Azure Container Apps

#### Option 2: Traditional Hosting
- VM-based deployment
- PM2 for process management
- Nginx as reverse proxy
- PostgreSQL managed instance

### 8.3 Database Migration

Run migrations before starting the application:
```bash
npm run migrate
```

Or automatically via Docker:
```yaml
command: sh -c "npm run migrate && npm start"
```

---

## 9. Development Setup

### 9.1 Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Docker & Docker Compose (optional)
- npm or yarn

### 9.2 Local Setup

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd bankapp
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

4. **Start PostgreSQL**
   ```bash
   docker-compose up postgres -d
   ```

5. **Run Migrations**
   ```bash
   npm run migrate
   ```

6. **Start Development Server**
   ```bash
   npm run dev
   ```

7. **Access API**
   ```
   http://localhost:3000
   ```

### 9.3 Development Scripts

- `npm run dev` - Start development server with ts-node
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Run production build
- `npm run migrate` - Run database migrations

### 9.4 Testing the API

Use curl, Postman, or any HTTP client:

```bash
# Register a user
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Create account (use token from login)
curl -X POST http://localhost:3000/accounts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{"accountType":"checking"}'
```

---

## 10. Frontend Application

### 10.1 User Interface

The React front-end provides a modern, responsive web interface for the banking application.

**Access URL:** `http://localhost` (when running with Docker) or `http://localhost:3000` (development mode)

### 10.2 Pages and Components

#### Authentication Pages
- **Login Page** (`/login`)
  - Email and password authentication
  - JWT token-based session management
  - Smooth animations and modern design
  - Direct navigation to registration

- **Register Page** (`/register`)
  - New user account creation
  - Password confirmation validation
  - Automatic login after registration

#### Dashboard (`/dashboard`)
The main application interface includes:

1. **Balance Overview Card**
   - Total balance across all accounts
   - Gradient design with animation
   - Real-time balance updates

2. **Statistics Section**
   - Total number of accounts
   - Transaction count
   - Unread notifications count

3. **Account Management**
   - Create new checking/savings accounts
   - View all accounts with balances
   - Interactive account cards with hover effects
   - Quick actions: Deposit, Withdraw, Transfer

4. **Transaction History**
   - Recent transactions display
   - Color-coded by transaction type
   - Date and amount information
   - Transaction descriptions

5. **AI-Powered Insights**
   - Spending analysis for last 30 days
   - Personalized financial recommendations
   - System health monitoring
   - Real-time metrics display

6. **Notifications Center**
   - Transaction alerts
   - System notifications
   - Read/unread status indicators

### 10.3 UI Design Features

- **Modern Gradient Theme**
  - Purple to blue gradient backgrounds
  - Smooth color transitions
  - Professional banking aesthetic

- **Responsive Design**
  - Mobile-friendly layouts
  - CSS Grid and Flexbox
  - Adaptive breakpoints

- **Interactive Elements**
  - Hover animations
  - Button transforms
  - Modal overlays
  - Smooth transitions

- **User Experience**
  - Loading states
  - Error messaging
  - Form validation
  - Success feedback

### 10.4 Component Architecture

```
App (Router)
├── Login
├── Register
└── Dashboard
    ├── AccountCard (multiple)
    ├── TransactionModal
    ├── AIInsights
    └── Notifications
```

### 10.5 State Management

- Local component state with React hooks
- LocalStorage for authentication persistence
- JWT token stored in localStorage
- User data cached locally

### 10.6 API Integration

All API calls use Axios with Bearer token authentication:
- Auth endpoints for login/register
- Account management endpoints
- Transaction processing
- AI agent insights
- Notification retrieval

### 10.7 Frontend Development

**Development Mode:**
```bash
cd client
npm install
npm start
```

**Production Build:**
```bash
cd client
npm run build
```

The build creates an optimized production bundle in `client/build/`.

---

## 11. Project Structure

```
bankapp/
├── client/                     # React front-end application
│   ├── public/
│   │   └── index.html          # HTML template
│   ├── src/
│   │   ├── components/
│   │   │   ├── Login.js        # Login page
│   │   │   ├── Register.js     # Registration page
│   │   │   ├── Dashboard.js    # Main dashboard
│   │   │   ├── AccountCard.js  # Account display component
│   │   │   ├── TransactionModal.js  # Transaction form modal
│   │   │   ├── AIInsights.js   # AI insights display
│   │   │   ├── Auth.css        # Authentication styling
│   │   │   ├── Dashboard.css   # Dashboard styling
│   │   │   ├── AccountCard.css # Account card styling
│   │   │   ├── TransactionModal.css  # Modal styling
│   │   │   └── AIInsights.css  # AI insights styling
│   │   ├── App.js              # Main app component
│   │   ├── App.css             # App styling
│   │   ├── index.js            # React entry point
│   │   └── index.css           # Global styles
│   ├── Dockerfile              # Client Docker config
│   ├── nginx.conf              # Nginx configuration
│   └── package.json            # Client dependencies
├── src/                        # Backend source code
│   ├── database/
│   │   ├── db.ts              # PostgreSQL connection pool
│   │   └── migrate.ts          # Database migrations
│   ├── middleware/
│   │   └── auth.ts             # JWT authentication middleware
│   ├── routes/
│   │   ├── auth.routes.ts      # Authentication endpoints
│   │   ├── account.routes.ts   # Account management endpoints
│   │   ├── transaction.routes.ts # Transaction endpoints
│   │   ├── notification.routes.ts # Notification endpoints
│   │   └── agent.routes.ts     # AI agent endpoints
│   ├── services/
│   │   ├── auth.service.ts     # Authentication logic
│   │   ├── account.service.ts  # Account management logic
│   │   ├── transaction.service.ts # Transaction logic
│   │   ├── notification.service.ts # Notification logic
│   │   └── agent.service.ts    # AI agent logic
│   ├── utils/
│   │   └── logger.ts           # JSON logging utility
│   └── server.ts               # Main application entry point
├── .dockerignore
├── .env.example
├── .gitignore
├── Dockerfile                  # Backend Docker config
├── docker-compose.yml          # Multi-container setup
├── package.json                # Backend dependencies
├── tsconfig.json
├── README.md
└── architecture.md
```

---

## 11. Non-Functional Requirements

### Performance
- **Target Response Time:** < 300ms for API requests
- **Database Connection Pooling:** Enabled
- **Caching:** Redis available for session management

### Scalability
- **Stateless Services:** Horizontal scaling ready
- **Database:** PostgreSQL supports read replicas
- **Container-based:** Easy scaling with orchestration

### Monitoring
- **Structured Logging:** JSON format for log aggregation
- **Health Endpoint:** `/health` for uptime monitoring
- **Agent Logs:** Track AI agent activities

### Reliability
- **Database Transactions:** ACID compliance
- **Error Handling:** Comprehensive try-catch blocks
- **Graceful Degradation:** Service isolation

---

## 12. Future Enhancements

- [ ] Add unit and integration tests
- [ ] Implement rate limiting
- [ ] Add API documentation (Swagger/OpenAPI)
- [ ] Implement real-time notifications (WebSockets)
- [ ] Add support for multiple currencies
- [ ] Implement scheduled agent runs (cron jobs)
- [ ] Add user profile management
- [ ] Implement account statements (PDF generation)
- [ ] Add biometric authentication
- [ ] Implement fraud detection ML models

---

## 13. Support & Maintenance

### Logging
All logs are output in JSON format to stdout/stderr for easy collection by log aggregation systems (ELK, Splunk, CloudWatch, etc.)

### Monitoring Endpoints
- `GET /health` - Basic health check
- `GET /agents/system-health` - Detailed system metrics

### Database Backups
Ensure regular PostgreSQL backups using:
- pg_dump for logical backups
- WAL archiving for point-in-time recovery
- Automated backup scripts

---

**End of Architecture Documentation**
