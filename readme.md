# GitHub Issue Automation System

A comprehensive **AI-powered GitHub issue management platform** that combines intelligent automation with modern issue tracking capabilities. This system automatically processes GitHub issues using AI and provides a beautiful dashboard for repository management.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18+-61DAFB.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6.svg)

## 🎯 Overview

The GitHub Issue Automation System is a **dual-purpose platform** that:

1. **🤖 Automates Issue Processing**: Uses AI (Portia SDK with Google Gemini/Mistral) to automatically analyze and label GitHub issues
2. **📊 Provides Modern Dashboard**: Offers a sleek interface for tracking issues across multiple repositories
3. **🔗 Manages Webhooks**: Automatically sets up GitHub webhooks for real-time issue monitoring
4. **👤 Handles Authentication**: Seamless GitHub OAuth integration for repository access

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   GitHub API    │◄──►│   Backend API   │◄──►│  React Frontend │
│                 │    │   (FastAPI)     │    │   (Dashboard)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Webhooks      │    │   Portia AI     │    │   Supabase DB   │
│   (Issues)      │    │   (Automation)  │    │   (Storage)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## ✨ Key Features

### 🤖 **AI-Powered Automation**

- **Automatic Issue Labeling**: AI analyzes issue content and applies appropriate labels
- **Real-time Processing**: Processes issues as they're created via GitHub webhooks
- **Status Tracking**: Monitor automation progress (pending → running → completed/failed)
- **Retry Mechanism**: Retry failed automation tasks with one click

### 📊 **Modern Dashboard**

- **Multi-Repository Management**: Track issues across multiple GitHub repositories
- **Advanced Filtering**: Sort and filter by status, assignee, labels, dates
- **Real-time Updates**: Live issue synchronization with GitHub
- **Responsive Design**: Works perfectly on desktop and mobile devices

### 🔐 **Authentication & Security**

- **GitHub OAuth 2.0**: Secure authentication with GitHub
- **Repository Access Control**: Granular permissions per repository
- **Token Management**: Secure storage and validation of access tokens
- **Webhook Security**: Cryptographically secure webhook verification

### 🔗 **Webhook Management**

- **Automatic Setup**: One-click webhook configuration for repositories
- **Manual Instructions**: Comprehensive guide for manual webhook setup
- **Status Monitoring**: Real-time webhook health checking
- **Event Processing**: Handles issues, comments, and label events

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm/yarn
- **Python** 3.9+ with pip/uv
- **Supabase Account** (optional, fallback to in-memory storage)
- **GitHub OAuth App** for authentication

### 1. Clone and Setup

```bash
git clone <repository-url>
cd issue-automation

# Install dependencies
cd client && npm install
cd ../backend && pip install -r requirements.txt
```

### 2. Configure Environment Variables

**Frontend** (`client/.env.local`):

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Backend** (`backend/.env`):

```env
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:8000
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_REDIRECT_URI=http://localhost:8000/auth/github/callback
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Set Up Database (Optional)

If using Supabase, run the SQL schema:

```sql
-- Run backend/supabase_schema.sql in your Supabase SQL editor
```

### 4. Start Development Servers

```bash
# Terminal 1 - Backend
cd backend
python main.py

# Terminal 2 - Frontend
cd client
npm run dev
```

### 5. Access the Application

- **Frontend Dashboard**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## 🔄 Workflow

### 1. **User Onboarding**

```
User Registration → GitHub OAuth → Repository Selection → Webhook Setup
```

### 2. **Issue Automation Flow**

```
GitHub Issue Created → Webhook Triggered → AI Analysis → Label Application → Status Update
```

### 3. **Dashboard Management**

```
Login → Browse Repositories → Add/Remove Repos → Monitor Issues → Track Automation
```

### 4. **Manual Operations**

```
Repository Management → Webhook Configuration → Issue Filtering → Status Monitoring
```

## 🛠️ Technology Stack

### **Frontend**

- **React 18** with TypeScript
- **Vite** for build tooling
- **Redux Toolkit** for state management
- **Tailwind CSS** + **shadcn/ui** for styling
- **Axios** for HTTP requests
- **React Router** for navigation

### **Backend**

- **FastAPI** with Python 3.9+
- **Portia SDK** for AI automation
- **Supabase** for database (optional)
- **GitHub API** integration
- **OAuth 2.0** authentication
- **Webhook** processing

### **AI & Automation**

- **Google Gemini** AI models
- **Mistral** AI models (alternative)
- **Portia SDK** for task orchestration
- **Real-time** status tracking

### **Database & Storage**

- **Supabase** (PostgreSQL)
- **Row Level Security** (RLS)
- **In-memory fallback** for development

## 📁 Project Structure

```
issue-automation/
├── client/                          # React Frontend
│   ├── src/
│   │   ├── components/             # Reusable UI components
│   │   │   ├── GitHubAuth.tsx      # GitHub authentication
│   │   │   ├── WebhookSetup.tsx    # Webhook management
│   │   │   ├── IssueCard.tsx       # Issue display
│   │   │   └── ui/                 # shadcn/ui components
│   │   ├── pages/                  # Page components
│   │   │   ├── DashboardPage.tsx   # Main dashboard
│   │   │   └── IssuesPage.tsx      # Issues view
│   │   ├── store/                  # Redux store
│   │   │   ├── slices/             # Redux slices
│   │   │   └── index.ts            # Store configuration
│   │   ├── lib/                    # Utilities
│   │   │   ├── api.ts              # Axios configuration
│   │   │   └── supabase.ts         # Supabase client
│   │   └── types/                  # TypeScript types
│   ├── public/                     # Static assets
│   └── package.json                # Dependencies
│
├── backend/                        # FastAPI Backend
│   ├── main.py                     # Main application
│   ├── supabase_client.py          # Database operations
│   ├── supabase_schema.sql         # Database schema
│   ├── requirements.txt            # Python dependencies
│   └── .env.example                # Environment template
│
└── README.md                       # This file
```

## 🔧 API Endpoints

### **Authentication**

- `GET /auth/github/url` - Get GitHub OAuth URL
- `GET /auth/github/callback` - Handle OAuth callback
- `POST /auth/github/callback` - Exchange code for token
- `GET /auth/github/status/{user_id}` - Check auth status

### **Repository Management**

- `GET /repositories/{user_id}` - List user repositories
- `POST /repositories` - Add repository
- `DELETE /repositories/{repo_id}` - Remove repository
- `GET /github/repositories/{user_id}` - Browse GitHub repos

### **Webhook Management**

- `POST /github/webhook/{user_id}` - Setup webhook
- `GET /github/webhook/status/{user_id}` - Check webhook status
- `POST /repository/access/verify` - Verify repository access

### **Automation**

- `GET /automation/status/{user_id}` - Get automation statuses
- `POST /automation/retry` - Retry failed automation
- `POST /github/webhook` - Webhook event handler

## 🎨 UI Components

### **Core Components**

- **GitHubAuth**: Handles GitHub OAuth flow
- **RepositoryBrowser**: Browse and select GitHub repositories
- **WebhookSetup**: Automated and manual webhook configuration
- **IssueCard**: Display issue information with automation status
- **AutomationStatusBadge**: Visual status indicators

### **Pages**

- **Dashboard**: Main repository management interface
- **IssuesPage**: Comprehensive issue tracking and filtering

## 🔮 Future Features & Enhancements

### 🤖 **AI & Automation Enhancements**

- [ ] **Custom AI Models**: Support for OpenAI GPT, Claude, and custom models
- [ ] **Smart Issue Routing**: Automatic assignment based on issue content
- [ ] **Duplicate Detection**: AI-powered duplicate issue identification
- [ ] **Priority Scoring**: Automatic priority assignment based on urgency
- [ ] **Multi-language Support**: Process issues in different languages
- [ ] **Custom Labeling Rules**: User-defined labeling strategies
- [ ] **Issue Templates**: AI-generated issue templates for common problems

### 📊 **Analytics & Insights**

- [ ] **Issue Analytics Dashboard**: Comprehensive metrics and trends
- [ ] **Performance Metrics**: Automation success rates and timing
- [ ] **Repository Health Scores**: Overall repository activity insights
- [ ] **Team Productivity**: Developer and team performance metrics
- [ ] **Custom Reports**: Exportable reports for stakeholders
- [ ] **Time Tracking**: Automatic time estimation for issues
- [ ] **Burndown Charts**: Sprint and milestone progress tracking

### 🔗 **Integrations**

- [ ] **Slack Integration**: Issue notifications and commands
- [ ] **Discord Bot**: Community server integration
- [ ] **JIRA Sync**: Two-way synchronization with JIRA
- [ ] **Linear Integration**: Modern project management tool sync
- [ ] **Notion Database**: Export issues to Notion databases
- [ ] **Email Notifications**: Customizable email alerts
- [ ] **Microsoft Teams**: Enterprise collaboration integration

### 🛠️ **Developer Experience**

- [ ] **GitHub App**: Official GitHub App for easier installation
- [ ] **VS Code Extension**: IDE integration for issue management
- [ ] **CLI Tool**: Command-line interface for power users
- [ ] **API Rate Limiting**: Smart rate limiting and caching
- [ ] **Bulk Operations**: Mass issue processing capabilities
- [ ] **Custom Workflows**: User-defined automation workflows
- [ ] **Plugin System**: Extensible architecture for custom features

### 🎨 **UI/UX Improvements**

- [ ] **Dark/Light Theme**: User preference themes
- [ ] **Mobile App**: Native iOS and Android applications
- [ ] **Real-time Collaboration**: Live issue updates and comments
- [ ] **Keyboard Shortcuts**: Power user keyboard navigation
- [ ] **Drag & Drop**: Intuitive issue organization
- [ ] **Customizable Dashboard**: User-configurable widgets
- [ ] **Advanced Search**: Full-text search with filters

### 🔐 **Security & Enterprise**

- [ ] **SSO Integration**: SAML and OAuth providers
- [ ] **Role-Based Access Control**: Granular permissions
- [ ] **Audit Logging**: Comprehensive activity tracking
- [ ] **Data Encryption**: End-to-end data protection
- [ ] **Compliance Dashboard**: SOC2, GDPR compliance tools
- [ ] **Enterprise Deployment**: On-premise installation options
- [ ] **API Keys Management**: Secure API access for integrations

### 🚀 **Performance & Scalability**

- [ ] **Microservices Architecture**: Scalable service decomposition
- [ ] **Caching Layer**: Redis integration for performance
- [ ] **Database Optimization**: Query optimization and indexing
- [ ] **CDN Integration**: Global content delivery
- [ ] **Load Balancing**: High availability deployment
- [ ] **Auto-scaling**: Dynamic resource allocation
- [ ] **Monitoring & Alerting**: Comprehensive system monitoring

### 🌍 **Platform Features**

- [ ] **Multi-tenant Support**: Organization-level isolation
- [ ] **Billing & Subscriptions**: Tiered pricing model
- [ ] **Marketplace**: Third-party integrations and plugins
- [ ] **API Documentation**: Interactive API explorer
- [ ] **Webhooks API**: Custom webhook endpoints for users
- [ ] **Backup & Recovery**: Automated data backup systems
- [ ] **Import/Export**: Data portability tools

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines

- Follow **TypeScript** best practices
- Use **ESLint** and **Prettier** for code formatting
- Write **unit tests** for new features
- Update **documentation** for API changes
- Follow **conventional commit** messages

## 📜 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the `/docs` folder for detailed guides
- **Issues**: Report bugs via GitHub Issues
- **Discussions**: Join community discussions
- **Email**: Contact the development team

## 🙏 Acknowledgments

- **Portia SDK** for AI automation capabilities
- **Supabase** for backend infrastructure
- **GitHub API** for seamless integration
- **shadcn/ui** for beautiful UI components
- **FastAPI** for robust backend framework

---

**Built with ❤️ by the Issue Automation Team**

_Making GitHub issue management intelligent and effortless._
