# PRD - Ripple: Golf Charity Subscription Platform

## Original Problem Statement
Build a "Golf Charity Subscription Platform" where users subscribe (Monthly $20 / Yearly $200 via Stripe), enter Stableford golf scores, and participate in charity-linked draws. Core features include score management, custom draw engine, charity integration, winner verification, and user/admin dashboards.

## Tech Stack
- **Frontend**: React.js, Tailwind CSS, shadcn/ui
- **Backend**: FastAPI, MongoDB (Motor async driver)
- **Auth**: JWT/cookie-based authentication
- **Payments**: Stripe (test mode)
- **Brand**: "Ripple" with concentric circles logo

## What's Been Implemented

### Completed (April 2, 2026)
- [x] FastAPI backend with full CRUD endpoints
- [x] JWT authentication (login, register, protected routes)
- [x] 6 predefined charities seeded in database
- [x] User charity selection (stored in user profile)
- [x] Stableford score submission (1-45 range, rolling 5 scores)
- [x] Stripe checkout integration (Monthly $20, Yearly $200)
- [x] Landing page with hero, pricing, how-it-works sections
- [x] Login/Register pages with Ripple branding
- [x] User Dashboard (subscription status, charity display, scores)
- [x] Admin Dashboard (basic)
- [x] Charities page with 6 charities and selection UI
- [x] GolfYardCanvas (particle animation background)
- [x] GolfPreloader (stickman golf animation)
- [x] ImpactChallenge mini-game
- [x] HoleInOneCelebration animation
- [x] **Light/Dark theme toggle** with localStorage persistence
- [x] **"Lively" branding** across all pages with energy burst logo
- [x] **Impact Challenge game** moved to prominent position (after status cards)
- [x] **Theme-aware colors** - all pages use CSS variables, no hardcoded dark/light colors
- [x] **Charity display fix** - selected charity correctly shows on dashboard

### Bug Fixes Applied
- Fixed ThemeProvider not wrapping app (caused crash: "useTheme must be used within ThemeProvider")
- Fixed GolfYardCanvas darkening light theme (made canvas theme-aware)
- Fixed Navbar path typo ('/ login' → '/login')
- Fixed duplicate closing tags in DashboardPage.js

## Prioritized Backlog

### P0 (Critical)
- [ ] Winner Verification System - UI for proof upload + admin review
- [ ] Stableford Score Logic - Enforce exactly 5 rolling scores, replace oldest

### P1 (Important)
- [ ] Draw Logic & Prize Pool - Monthly cadence, 5/4/3-match logic, jackpot rollover
- [ ] Admin Analytics - Total prize pool, charity contributions, draw stats
- [ ] Stripe Subscription Validation - End-to-end verification of checkout redirect

### P2 (Nice to have)
- [ ] Dashboard refactoring - Break DashboardPage.js into smaller components
- [ ] User profile editing
- [ ] Notification system for draw results

## Key API Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user
- `GET /api/charities` - List all charities
- `POST /api/user/select-charity` - Select a charity
- `POST /api/scores/submit` - Submit a score
- `GET /api/scores/my-scores` - Get user's scores
- `POST /api/subscriptions/create-checkout-session` - Create Stripe checkout
- `POST /api/draws/publish` - Publish draw results (admin)

## DB Schema
- `users`: email, password_hash, name, role, selected_charity_id, charity_contribution_percentage, subscription_status, subscription_tier
- `scores`: user_id, score, date
- `charities`: charity_id, name, description, category, image_url, featured
- `draws`: winning_numbers, status, created_at
