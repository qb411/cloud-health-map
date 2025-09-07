# Cloud Health Map - Project Specification

## Project Overview

A dual-mode AWS health monitoring application that provides real-time visualization of AWS service health across global regions through an interactive map interface.

## Use Cases

### Use Case 1: Public AWS Health Monitor
**Target**: General public, AWS users wanting global service visibility
- **Data Source**: AWS Public Status RSS Feed (`https://status.aws.amazon.com/rss/all.rss`)
- **Hosting**: GitHub Pages (free static hosting)
- **Refresh Rate**: 5-10 minutes
- **Scope**: All AWS regions, public incidents only
- **Authentication**: None required
- **Cost**: $0 (completely free)

### Use Case 2: Personal Health Dashboard
**Target**: AWS account holders wanting account-specific health data
- **Data Source**: AWS Personal Health Dashboard API
- **Hosting**: AWS (Lambda + S3/CloudFront)
- **Refresh Rate**: Real-time via AWS EventBridge
- **Scope**: Account-specific incidents affecting user's resources
- **Authentication**: AWS IAM roles/credentials
- **Cost**: Minimal AWS usage costs

## Technical Architecture

### Shared Components
- React + TypeScript frontend
- Interactive world map (Leaflet.js)
- Tailwind CSS + shadcn/ui components
- Region status visualization
- Status logging and history

### Mode-Specific Components

#### Public Mode (Use Case 1)
- Client-side RSS feed parsing
- Browser-based data fetching
- Static build for GitHub Pages
- No backend dependencies

#### Personal Mode (Use Case 2)
- AWS SDK integration
- Lambda functions for API calls
- EventBridge for real-time updates
- DynamoDB for data caching
- IAM role-based authentication

## Current Status

### Existing Implementation
- ✅ Basic React + Vite + TypeScript setup
- ✅ Interactive map with Leaflet.js
- ✅ AWS RSS feed parsing
- ✅ Region status mapping
- ✅ Auto-refresh functionality
- ⚠️ Currently uses Supabase (needs removal for Use Case 1)
- ⚠️ No Personal Health Dashboard integration yet

### Required Refactoring
1. **Remove Supabase dependencies** for static hosting
2. **Add mode detection** (environment-based configuration)
3. **Create dual data fetching strategies**
4. **Implement AWS Personal Health Dashboard API integration**
5. **Set up deployment configurations** for both modes

## Development Phases

### Phase 1: Core Refactoring
- [ ] Remove Supabase dependencies
- [ ] Implement mode detection system
- [ ] Create configuration management
- [ ] Optimize for GitHub Pages deployment
- [ ] Set up 5-10 minute refresh intervals

### Phase 2: Personal Health Dashboard Integration
- [ ] AWS SDK integration
- [ ] Personal Health Dashboard API implementation
- [ ] Lambda function development
- [ ] EventBridge setup for real-time updates
- [ ] IAM role configuration

### Phase 3: Deployment & Testing
- [ ] GitHub Pages deployment setup
- [ ] AWS infrastructure deployment (CDK/CloudFormation)
- [ ] End-to-end testing for both modes
- [ ] Documentation and user guides

### Phase 4: Enhancements
- [ ] Historical data visualization
- [ ] Alert notifications
- [ ] Resource-level impact details
- [ ] Performance optimizations

## Technology Stack

### Frontend
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS
- shadcn/ui components
- Leaflet.js (mapping)
- React Query (data fetching)

### Backend (Personal Mode Only)
- AWS Lambda
- AWS Personal Health Dashboard API
- AWS EventBridge
- AWS DynamoDB
- AWS IAM

### Deployment
- GitHub Pages (Public Mode)
- AWS CloudFront + S3 (Personal Mode)
- AWS CDK or CloudFormation (Infrastructure as Code)

## Success Criteria

### Use Case 1 Success Metrics
- Deploys successfully to GitHub Pages
- Updates within 5-10 minutes of AWS status changes
- Zero hosting costs
- Works without authentication
- Responsive on mobile/desktop

### Use Case 2 Success Metrics
- Integrates with AWS Personal Health Dashboard
- Shows account-specific incidents only
- Real-time updates via EventBridge
- Secure IAM-based authentication
- Cost under $10/month for typical usage

## Risks & Considerations

### Technical Risks
- CORS issues with RSS feed fetching from browser
- AWS API rate limits
- GitHub Pages limitations for dynamic content

### Mitigation Strategies
- Use CORS proxy for RSS feeds if needed
- Implement proper caching and rate limiting
- Consider serverless functions for API calls

## Timeline Estimate

- **Phase 1**: 1-2 weeks
- **Phase 2**: 2-3 weeks  
- **Phase 3**: 1 week
- **Phase 4**: 1-2 weeks (optional enhancements)

**Total**: 5-8 weeks for complete implementation

## Repository Structure

```
cloud-health-map/
├── src/
│   ├── components/          # Shared UI components
│   ├── modes/              # Mode-specific implementations
│   │   ├── public/         # Public RSS mode
│   │   └── personal/       # Personal Health Dashboard mode
│   ├── lib/                # Shared utilities
│   └── config/             # Configuration management
├── aws-infrastructure/      # CDK/CloudFormation templates
├── docs/                   # Documentation
└── deployment/             # Deployment scripts
```

## Next Steps

1. Create session tracking document
2. Begin Phase 1 refactoring
3. Set up development environment
4. Implement mode detection system
