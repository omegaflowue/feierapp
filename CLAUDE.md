# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Feierplanungsapp is a web application for event planning and party organization with a Vue.js frontend and Yii2 PHP backend. The app allows event planners to create events, send invitations, manage guest responses, and coordinate food/drink contributions.

## Architecture

### Backend (Yii2 Framework)
- **Framework**: Yii2 PHP framework with RESTful API architecture
- **Database**: MySQL with schema defined in `database/schema.sql`
- **Entry Point**: `backend/web/index.php`
- **Configuration**: `backend/config/web.php` contains main app configuration
- **Models**: Located in `backend/models/` (Event, Guest, Contribution, Invitation)
- **Controllers**: RESTful controllers in `backend/controllers/` extending ActiveController
- **API Base Path**: Production: `/backend/web`, Development: `http://localhost:8081`

Key Backend Features:
- Event management with unique codes for sharing
- Guest management with unique tokens for personalized access
- Contribution tracking (food, drinks, other items)
- CORS configured for frontend communication
- JSON API responses by default

### Frontend (Vue.js 3)
- **Framework**: Vue 3 with Vue Router and Bootstrap Vue Next
- **Build Tool**: Vue CLI
- **Styling**: Bootstrap 5 with FontAwesome icons
- **HTTP Client**: Axios with configured interceptors
- **Development Server**: Port 8080
- **Entry Point**: `frontend/src/main.js`

Key Frontend Features:
- Event creation and management dashboard
- Guest invitation interface with personalized tokens
- Responsive design with Bootstrap components
- API service layer in `frontend/src/services/api.js`

### Database Schema
Core entities with relationships:
- `events` → `guests` (1:many via event_id)
- `guests` → `contributions` (1:many via guest_id)
- `events` → `invitations` (1:many via event_id)
- Unique codes/tokens for secure access without authentication

## Development Commands

### Backend (Yii2)
```bash
cd backend
# Install dependencies
php composer.phar install

# Development server (if using built-in PHP server)
php -S localhost:8081 -t web/

# Database setup - run schema manually in MySQL
mysql -u username -p database_name < ../database/schema.sql
```

### Frontend (Vue.js)
```bash
cd frontend
# Install dependencies
npm install

# Development server
npm run serve

# Build for production
npm run build

# Lint code
npm run lint

# Run E2E tests
npm run test:e2e
```

### Mock Backend (Node.js)
```bash
cd mock-backend
# Install dependencies
npm install

# Start mock server
npm start
# or for development
npm run dev
```

## Testing

### End-to-End Testing
- **Framework**: Cypress
- **Location**: `frontend/cypress/`
- **Run Tests**: `npm run test:e2e` or `npm run cypress:run`
- **Interactive Mode**: `npm run cypress:open`

### Backend Testing
- **Framework**: Codeception (configured in composer.json)
- Yii2 debug and Gii modules enabled in development

## Configuration Notes

### CORS Configuration
- Backend CORS configured in EventController for `http://localhost:8080`
- `.htaccess` file in `backend/web/` handles CORS headers
- API accepts JSON requests with CSRF validation disabled

### Environment-Specific Settings
- Frontend API base URL switches based on NODE_ENV
- Yii2 debug/Gii modules only loaded in YII_ENV_DEV
- Database configuration in `backend/config/db.php`

### Security Considerations
- Unique codes for events (32 chars) and guest tokens (64 chars)
- No user authentication system - access via unique tokens only
- CSRF validation disabled for API endpoints
- File-based session storage disabled for API

## Key Files to Understand

### Backend
- `backend/config/web.php:51-73` - URL routing rules for REST API
- `backend/controllers/EventController.php:57-82` - Event view with statistics
- `backend/models/Event.php` - Event model with validation rules

### Frontend  
- `frontend/src/router/index.js` - Vue Router configuration
- `frontend/src/services/api.js` - API service layer with axios
- `frontend/vue.config.js` - Build configuration with ESLint disabled

### Database
- `database/schema.sql` - Complete database schema with indexes