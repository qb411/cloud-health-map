# Cloud Health Map - Session Notes

## Session 1 - September 6, 2025

### Session Overview
- **Duration**: ~30 minutes
- **Focus**: Project analysis and specification creation
- **Participants**: User + AI Assistant

### Accomplishments
1. **Repository Analysis**
   - Cloned existing cloud-health-map repository from GitHub
   - Analyzed current implementation (React + Vite + TypeScript)
   - Identified existing features: AWS RSS feed parsing, interactive map, Supabase integration

2. **Use Case Definition**
   - **Use Case 1**: Public AWS Health Monitor for GitHub Pages hosting
     - Free static hosting
     - Public AWS Status RSS feed
     - 5-10 minute refresh intervals
     - No authentication required
   
   - **Use Case 2**: Personal Health Dashboard integration
     - AWS account-specific health data
     - Personal Health Dashboard API
     - Real-time updates via EventBridge
     - IAM-based authentication

3. **Documentation Created**
   - PROJECT_SPECIFICATION.md with complete project overview
   - session-notes.md for tracking progress between sessions

### Current State
- **Repository**: Successfully cloned and analyzed
- **Dependencies**: Node.js not installed (blocked build process)
- **Architecture**: Identified dual-mode approach needed
- **Next Phase**: Core refactoring to remove Supabase dependencies

### Technical Findings
- Current implementation uses Supabase for real-time updates
- RSS feed URL: `https://status.aws.amazon.com/rss/all.rss`
- Refresh intervals: 15 minutes (normal), 5 minutes (errors)
- Map library: Leaflet.js with region markers
- UI framework: shadcn/ui + Tailwind CSS

### Decisions Made
1. **Dual-mode architecture** with shared frontend components
2. **Phase-based development** approach (4 phases total)
3. **GitHub Pages** for public mode deployment
4. **AWS Lambda + EventBridge** for personal mode

### Issues Identified
- Supabase dependency blocks static hosting for Use Case 1
- Need mode detection system for configuration
- CORS potential issues with RSS feed fetching
- Node.js environment setup required for development

### Next Session Goals
1. Set up Node.js development environment
2. Begin Phase 1 refactoring:
   - Remove Supabase dependencies
   - Implement mode detection
   - Create configuration system
3. Test RSS feed fetching without backend
4. Prepare for GitHub Pages deployment

### Questions for Next Session
- Should we use a CORS proxy for RSS feeds?
- Preferred method for mode detection (env vars, config file)?
- Any specific AWS regions to prioritize for testing?

---

## Session 2 - September 6, 2025 (Continued)

### Session Overview
- **Duration**: ~45 minutes
- **Focus**: Repository restructuring and V2 static implementation
- **Participants**: User + AI Assistant

### Accomplishments
1. **Repository Restructuring** ✅
   - Created `versions/` directory structure
   - Moved original code to `v1-original-supabase/` (archived)
   - Created `v2-static-github/` for active development
   - Set up `v3-aws-personal/` placeholder for future

2. **V2 Static Implementation** ✅
   - Removed Supabase dependencies from package.json
   - Refactored `aws-health.ts` with localStorage persistence
   - Added CORS proxy fallback for RSS feeds
   - Updated `Index.tsx` to remove Supabase subscriptions
   - Implemented manual refresh functionality
   - Added last update timestamp display

3. **Documentation Created** ✅
   - Updated main README with version comparison
   - Created version-specific READMEs
   - Added GitHub Pages deployment guide
   - Documented architecture changes

### Technical Changes Made
- **Data Persistence**: Switched from Supabase to localStorage
- **CORS Handling**: Added `api.allorigins.win` proxy fallback
- **Refresh Strategy**: Changed to 10min normal, 5min during issues
- **Manual Controls**: Added refresh button and last update display
- **Storage Management**: Automatic cleanup of items older than 7 days

### Current State
- **V1**: Archived original Supabase implementation in `versions/v1-original-supabase/`
- **V2**: Fully functional static version in `versions/v2-static-github/` ready for GitHub Pages
- **V3**: Placeholder directory created for future AWS Personal Health Dashboard

### Files Modified in V2
- `package.json` - Removed `@supabase/supabase-js` dependency
- `src/lib/aws-health.ts` - Complete refactor with localStorage and CORS proxy
- `src/pages/Index.tsx` - Removed Supabase subscriptions, added manual refresh
- Deleted `src/integrations/supabase/` directory entirely

### Key Implementation Details
- **localStorage Keys**: `aws-health-items`, `aws-health-timestamp`
- **CORS Proxy**: `https://api.allorigins.win/get?url=` as fallback
- **Data Retention**: 7 days for localStorage items
- **Refresh Intervals**: 10min normal, 5min during issues
- **Error Handling**: Graceful fallback to cached data on fetch failures

### Issues Resolved
- Supabase backend dependency removed
- Static hosting compatibility achieved
- CORS issues mitigated with proxy fallback
- Data persistence maintained with localStorage

## NEXT SESSION PLANNED STEPS

### Immediate Testing (Phase 1 - 30 minutes)
1. **Test V2 Build Process**
   ```bash
   cd versions/v2-static-github
   npm install
   npm run build
   ```
   - Verify no build errors
   - Check bundle size and optimization
   - Test preview locally with `npm run preview`

2. **Test RSS Feed Fetching**
   - Start dev server: `npm run dev`
   - Open browser console and monitor network requests
   - Verify direct RSS fetch works or falls back to CORS proxy
   - Test manual refresh functionality
   - Verify localStorage persistence across page reloads

3. **Test localStorage Functionality**
   - Check browser DevTools → Application → Local Storage
   - Verify items are stored with correct keys
   - Test 7-day cleanup logic
   - Verify data persists across browser sessions

### GitHub Pages Deployment (Phase 2 - 20 minutes)
4. **Deploy to GitHub Pages**
   ```bash
   cd versions/v2-static-github
   npm run deploy
   ```
   - Verify gh-pages branch is created
   - Enable GitHub Pages in repository settings
   - Test live deployment at `https://[username].github.io/cloud-health-map`

5. **Production Testing**
   - Test RSS feed fetching in production environment
   - Verify CORS proxy works if needed
   - Test on different devices/browsers
   - Monitor for any console errors

### Optimization & Polish (Phase 3 - 30 minutes)
6. **UI/UX Improvements**
   - Add loading states for manual refresh
   - Improve error messaging for network failures
   - Add offline indicator when using cached data
   - Consider adding refresh countdown timer

7. **Performance Optimization**
   - Implement service worker for offline functionality (optional)
   - Add compression for localStorage data if needed
   - Optimize bundle size further
   - Add analytics/monitoring (optional)

### Future Planning (Phase 4 - 15 minutes)
8. **V3 Planning**
   - Research AWS Personal Health Dashboard API requirements
   - Plan AWS infrastructure architecture
   - Document authentication flow requirements

### Backup/Recovery Context
- **Original Implementation**: Fully preserved in `versions/v1-original-supabase/`
- **Working Directory**: `versions/v2-static-github/` contains the static implementation
- **Key Dependencies**: All Supabase deps removed, core React/Vite/Leaflet preserved
- **Configuration**: Router basename set to `/cloud-health-map` for GitHub Pages

### Critical Files for Next Session
- `versions/v2-static-github/src/lib/aws-health.ts` - Core data fetching logic
- `versions/v2-static-github/src/pages/Index.tsx` - Main component with state management
- `versions/v2-static-github/package.json` - Dependencies and scripts
- `docs/deployment-guides/github-pages.md` - Deployment instructions

### Questions for Next Session
- Should we add a service worker for offline functionality?
- Any additional error handling needed for the CORS proxy?
- Performance optimizations for the localStorage approach?
- UI improvements for better user experience?

---

## Session 3 - September 6, 2025 (Continued)

### Session Overview
- **Duration**: ~45 minutes
- **Focus**: UI improvements and development workflow optimization
- **Participants**: User + AI Assistant

### Accomplishments
1. **Development Environment Setup** ✅
   - Installed Node.js via NVM in isolated environment
   - Set up Vite development server for V2 static version
   - Established reliable testing workflow

2. **Git Repository Management** ✅
   - Configured git credentials (qb411, sean.falconer@gmail.com)
   - Successfully committed and pushed 3-version restructure to main branch
   - Created `feature/ui-improvements` branch for ongoing UI work

3. **UI Improvements - Popup Design** ✅
   - Updated popup styling from orange to clean white background
   - Added AWS-branded orange header with "AWS Region" text
   - Implemented status indicators with colored dots
   - Replaced problematic flag emojis with reliable flagcdn.com images
   - Clean, professional popup design with proper spacing

### Technical Changes Made
- **Popup Styling**: White background, AWS orange header, modern shadows
- **Flag Display**: Switched from emojis to flagcdn.com service (16x12px images)
- **Status Indicators**: Added colored dots next to status text
- **Typography**: Improved spacing and hierarchy in popups

### Development Workflow Established

#### **STANDARD PROCESS FOR TESTING CODE UPDATES**

**Step 1: Kill All Vite Servers**
```bash
pkill -f node && sleep 2
```

**Step 2: Start Fresh Server on Port 8080**
```bash
export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" && cd /mnt/c/CODE/cloud-health-map/versions/v2-static-github && nohup npm run dev -- --force --port 8080 > vite.log 2>&1 &
```

**Step 3: Verify Server Status**
```bash
cd /mnt/c/CODE/cloud-health-map/versions/v2-static-github && sleep 3 && tail -5 vite.log
```

**Step 4: Test Changes**
- Access: http://localhost:8080/cloud-health-map/
- Hard refresh browser (Ctrl+F5) to clear cache
- Test functionality

**Why This Process is Needed:**
- WSL file system can have caching issues with Vite hot reload
- Multiple server instances can run on different ports
- Force flag clears Vite cache
- Consistent port 8080 usage for testing

### Current State
- **Main Branch**: Contains complete 3-version restructure
- **Feature Branch**: `feature/ui-improvements` with updated popup design
- **Dev Server**: Running on http://localhost:8080/cloud-health-map/
- **UI Status**: Clean white popups with AWS branding and flag images

### Issues Resolved
- Vite server caching and hot reload problems
- Multiple server instances on different ports
- Flag emoji display inconsistencies across browsers
- Popup styling and branding improvements

### Next Session Goals
1. **Test Current UI Changes**
   - Verify flag images display correctly
   - Test popup functionality across different regions
   - Confirm status indicators work properly

2. **Additional UI Improvements** (if needed)
   - Loading states for manual refresh
   - Error handling improvements
   - Mobile responsiveness testing

3. **Deployment Testing**
   - Build and test static deployment
   - GitHub Pages deployment verification

### Questions for Next Session
- Should we add a service worker for offline functionality?
- Any additional error handling needed for the CORS proxy?
- Performance optimizations for the localStorage approach?
- Additional UI improvements needed?

### SESSION COMPLETION SUMMARY

## ✅ COMPLETED THIS SESSION

**Repository Restructure:**
- Created 3-version architecture (`v1-original-supabase`, `v2-static-github`, `v3-aws-personal`)
- Archived original Supabase implementation in `versions/v1-original-supabase/`
- Created fully functional static version in `versions/v2-static-github/`

**V2 Static Implementation:**
- Removed all Supabase dependencies from package.json
- Implemented localStorage persistence with 7-day retention
- Added CORS proxy fallback (`api.allorigins.win`) for RSS feeds
- Updated refresh intervals (10min normal, 5min during issues)
- Added manual refresh button with timestamp display
- Deleted `src/integrations/supabase/` directory entirely

**Documentation:**
- Updated main README with version comparison table
- Created version-specific READMEs for v1 and v2
- Added GitHub Pages deployment guide
- Documented all technical changes and architecture decisions

## 🎯 READY FOR NEXT SESSION

**The project is now in a state where you can:**

1. **Immediately test** the V2 static version locally with `npm run dev`
2. **Deploy to GitHub Pages** with `npm run deploy` command
3. **Continue development** with clear next steps outlined in planned phases

**All context needed to resume is captured in:**
- `session-notes.md` - Complete progress and detailed next steps
- `versions/v2-static-github/` - Working static implementation ready for testing
- `docs/deployment-guides/github-pages.md` - Step-by-step deployment instructions
- Main `README.md` - Updated project overview with version comparison

**Key Files Modified:**
- `versions/v2-static-github/package.json` - Supabase dependency removed
- `versions/v2-static-github/src/lib/aws-health.ts` - Complete localStorage refactor
- `versions/v2-static-github/src/pages/Index.tsx` - Supabase subscriptions removed

**Next session can immediately pick up with Phase 1 testing, then proceed through deployment and optimization phases as outlined above.**

---

## Session 4 - September 6, 2025 (Evening)

### Session Overview
- **Duration**: ~30 minutes
- **Focus**: Popup layout improvements and localStorage architecture issue discovery
- **Participants**: User + AI Assistant

### Accomplishments
1. **Popup Layout Fixed** ✅
   - Implemented Option 3 (Status Badge) from popup-test.html
   - Resolved spacing issues with inline CSS styles
   - Achieved centered, professional badge appearance
   - Fixed 20px spacing problem between popup elements

2. **Critical Architecture Issue Identified** ⚠️
   - Discovered localStorage won't work for multi-user public website
   - Each browser has separate localStorage = inconsistent data across users
   - Need unified data source for all website visitors

3. **EC2 Solution Architecture Planned** 📋
   - Proposed t3.nano/t3a.nano EC2 instance for RSS scraping
   - GitHub Pages remains main hosting (static frontend)
   - EC2 serves only JSON API endpoints
   - Solves CORS issues and provides unified data

### Technical Changes Made
- **RegionMap.tsx**: Updated popup HTML structure
  - Replaced dot + text layout with colored status badge
  - Used inline CSS styles to override Tailwind spacing conflicts
  - Precise margin control: h3 (0px), p (2px top), badge (4px top, centered)
  - Badge colors: green (operational), amber (issue), red (outage)

### Issues Identified
1. **localStorage Multi-User Problem**
   - User A visits at 2:00 PM → gets fresh data
   - User B visits at 2:05 PM → gets different localStorage state
   - Results in inconsistent status information across users

2. **CORS Limitations**
   - Direct RSS fetching from browser has CORS restrictions
   - S3 static hosting has additional CORS limitations
   - Need server-side solution for reliable RSS access

### Architecture Decision: EC2 + GitHub Pages Hybrid

**Proposed Architecture:**
```
Users → GitHub Pages (Static Frontend)
           ↓ (API calls only)
        EC2 t3a.nano (Data API)
           ↓ (RSS scraping)
        AWS Status RSS Feed
```

**EC2 Role:**
- Background RSS scraping every 5-10 minutes
- SQLite database for data persistence
- Simple Express.js API server
- CORS-enabled JSON endpoints
- Cost: ~$3.50/month

**GitHub Pages Role:**
- Main website hosting (free)
- All static assets (HTML/CSS/JS)
- User-facing interface
- SEO and discoverability

**Benefits:**
- Unified data across all users
- Reliable RSS scraping without CORS issues
- Minimal EC2 load (t3.nano sufficient)
- GitHub Pages handles all traffic/bandwidth
- Predictable costs vs Lambda cold starts

### Current State
- **V2 Static**: Popup layout perfected, but localStorage architecture needs replacement
- **Development Server**: Running on http://localhost:8080/cloud-health-map/
- **Popup Design**: Option 3 badge layout successfully implemented
- **Next Phase**: Replace localStorage with EC2 API integration

### Technical Implementation Details

**Popup Layout Solution:**
```html
<h3 style="margin: 0;">Region Name</h3>
<p style="margin: 2px 0 0 0;">Region Code</p>
<span style="display: block; width: fit-content; margin: 4px auto 0 auto;">
  Status Badge
</span>
```

**Key Learning:** Tailwind CSS margin classes conflicted with Leaflet popup styling. Inline CSS provided precise control.

### Next Session Goals
1. **Design EC2 API Structure**
   - Define JSON response format
   - Plan RSS scraping intervals
   - Design SQLite schema

2. **Update Frontend for API Integration**
   - Replace localStorage calls with fetch() to EC2
   - Handle API loading states
   - Implement error fallbacks

3. **EC2 Setup Planning**
   - Choose t3.nano vs t3a.nano
   - Plan Express.js server structure
   - Design deployment process

### Questions for Next Session
- Should we use PM2 for process management on EC2?
- SQLite vs in-memory storage for RSS data?
- How to handle EC2 downtime gracefully in frontend?
- Domain setup for EC2 API endpoint?

### Files Modified This Session
- `versions/v2-static-github/src/components/RegionMap.tsx` - Popup layout and spacing fixes

### Context for Future Sessions
- **popup-test.html** contains 5 layout options tested (Option 3 chosen)
- **localStorage issue** discovered: not suitable for multi-user public sites
- **EC2 solution** preferred over Lambda for reliability
- **CORS problems** with direct RSS fetching from browser
- **GitHub Pages + EC2 hybrid** architecture decided

---

## Session Template

### Session [N] - [Date]

### Session Overview
- **Duration**: 
- **Focus**: 
- **Participants**: 

### Accomplishments
- 

### Current State
- 

### Technical Changes
- 

### Issues Identified
- 

### Decisions Made
- 

### Next Session Goals
- 

### Questions for Next Session
- 
