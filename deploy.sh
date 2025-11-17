#!/bin/bash

# ==============================================================================
# SomoAI Backend Deployment Script
# ==============================================================================
#
# This script automates deployment to Railway (or compatible platforms)
#
# Usage:
#   ./deploy.sh          # Deploy to production
#   ./deploy.sh --help   # Show help
#
# ==============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print with color
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# ==============================================================================
# Pre-flight checks
# ==============================================================================

print_info "Starting SomoAI Backend deployment..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    print_warning "Railway CLI not found. Installing..."
    npm install -g @railway/cli
    print_success "Railway CLI installed"
fi

# Check if logged in to Railway
if ! railway whoami &> /dev/null; then
    print_info "Not logged in to Railway. Please log in:"
    railway login
fi

# ==============================================================================
# Environment setup
# ==============================================================================

print_info "Setting production environment variables..."

# Set Django settings module
railway variables set DJANGO_SETTINGS_MODULE=somoai_backend.settings_production

print_success "Environment variables configured"

# ==============================================================================
# Pre-deployment checks
# ==============================================================================

print_info "Running pre-deployment checks..."

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    print_warning "You have uncommitted changes:"
    git status --short
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_error "Deployment cancelled"
        exit 1
    fi
fi

# Run tests (if they exist)
if [ -f "manage.py" ]; then
    print_info "Running tests..."
    if python manage.py test --noinput &> /dev/null; then
        print_success "Tests passed"
    else
        print_warning "Tests failed or not configured"
        read -p "Continue deployment? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_error "Deployment cancelled"
            exit 1
        fi
    fi
fi

# ==============================================================================
# Deployment
# ==============================================================================

print_info "Deploying to Railway..."

# Deploy (Railway will run build and release commands from Procfile)
railway up

if [ $? -eq 0 ]; then
    print_success "Deployment initiated successfully!"
else
    print_error "Deployment failed!"
    exit 1
fi

# ==============================================================================
# Post-deployment tasks
# ==============================================================================

print_info "Running post-deployment tasks..."

# Run migrations
print_info "Running database migrations..."
railway run python manage.py migrate --noinput

# Collect static files
print_info "Collecting static files..."
railway run python manage.py collectstatic --noinput

# ==============================================================================
# Verification
# ==============================================================================

print_info "Verifying deployment..."

# Get the deployment URL
DEPLOYMENT_URL=$(railway domain 2>/dev/null | grep -v "Not found" | head -1)

if [ -n "$DEPLOYMENT_URL" ]; then
    print_success "Deployment URL: https://$DEPLOYMENT_URL"

    # Test health endpoint
    print_info "Testing health endpoint..."
    sleep 5  # Wait for deployment to stabilize

    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://$DEPLOYMENT_URL/health/" || echo "000")

    if [ "$HTTP_CODE" = "200" ]; then
        print_success "Health check passed!"
    else
        print_warning "Health check returned HTTP $HTTP_CODE"
        print_warning "The deployment may still be initializing. Check Railway logs."
    fi
else
    print_warning "Could not retrieve deployment URL"
fi

# ==============================================================================
# Summary
# ==============================================================================

echo ""
echo "=========================================="
echo -e "${GREEN}🚀 Deployment Complete!${NC}"
echo "=========================================="
echo ""
print_info "Next steps:"
echo "  1. Check Railway logs: railway logs"
echo "  2. Monitor health: curl https://$DEPLOYMENT_URL/health/"
echo "  3. Update mobile app API_BASE_URL to: https://$DEPLOYMENT_URL/api"
echo "  4. Set up custom domain (optional)"
echo "  5. Configure Africa's Talking webhook URLs"
echo ""

# Optional: Create superuser
read -p "Create Django superuser? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    railway run python manage.py createsuperuser
fi

print_success "All done! 🎉"
