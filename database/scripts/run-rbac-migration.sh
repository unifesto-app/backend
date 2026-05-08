#!/bin/bash

# RBAC Enhancement Migration Runner
# This script applies the RBAC enhancements migration to the database

set -e  # Exit on error

echo "========================================="
echo "RBAC Enhancement Migration"
echo "========================================="
echo ""

# Check if .env file exists
if [ ! -f "../../.env" ] && [ ! -f "../.env.local" ]; then
    echo "❌ Error: No .env file found"
    echo "Please create a .env file with your Supabase connection details"
    exit 1
fi

# Load environment variables
if [ -f "../../.env" ]; then
    source ../../.env
elif [ -f "../.env.local" ]; then
    source ../.env.local
fi

# Check if required variables are set
if [ -z "$DATABASE_URL" ] && [ -z "$SUPABASE_DB_URL" ]; then
    echo "❌ Error: DATABASE_URL or SUPABASE_DB_URL not set"
    echo "Please set your database connection string in .env"
    exit 1
fi

# Use DATABASE_URL or SUPABASE_DB_URL
DB_URL="${DATABASE_URL:-$SUPABASE_DB_URL}"

echo "📋 Migration file: 009_rbac_enhancements.sql"
echo "🗄️  Database: ${DB_URL%%@*}@***"  # Hide password in output
echo ""

# Confirm before running
read -p "Do you want to run this migration? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "❌ Migration cancelled"
    exit 0
fi

echo ""
echo "🚀 Running migration..."
echo ""

# Run the migration
psql "$DB_URL" -f ../migrations/009_rbac_enhancements.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "========================================="
    echo "✅ Migration completed successfully!"
    echo "========================================="
    echo ""
    echo "Changes applied:"
    echo "  ✓ Organization depth tracking"
    echo "  ✓ Super admin tracking"
    echo "  ✓ Event approval workflow"
    echo "  ✓ Content removal system"
    echo "  ✓ Enhanced permissions"
    echo "  ✓ Updated RLS policies"
    echo ""
else
    echo ""
    echo "========================================="
    echo "❌ Migration failed!"
    echo "========================================="
    echo ""
    echo "Please check the error messages above"
    exit 1
fi
