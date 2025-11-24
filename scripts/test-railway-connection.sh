#!/bin/bash

# Railway MySQL Connection Tester
# Usage: ./scripts/test-railway-connection.sh

echo "🔍 Railway MySQL Connection Tester"
echo "===================================="
echo ""

# Check if MySQL is installed
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL is not installed or not in PATH"
    echo "   Install with: brew install mysql"
    exit 1
fi

echo "✅ MySQL is installed: $(mysql --version)"
echo ""

# Prompt for connection details
read -p "Enter Railway MySQL Host: " RAILWAY_HOST
read -p "Enter Railway MySQL Port (default 3306): " RAILWAY_PORT
RAILWAY_PORT=${RAILWAY_PORT:-3306}
read -p "Enter Railway MySQL Username: " RAILWAY_USER
read -p "Enter Railway MySQL Database: " RAILWAY_DB
read -sp "Enter Railway MySQL Password: " RAILWAY_PASS
echo ""

echo ""
echo "🔌 Testing connection..."
echo ""

# Test connection
mysql -h "$RAILWAY_HOST" \
      -P "$RAILWAY_PORT" \
      -u "$RAILWAY_USER" \
      -p"$RAILWAY_PASS" \
      "$RAILWAY_DB" \
      -e "SELECT 'Connection successful!' AS status, DATABASE() AS current_database, USER() AS current_user;" 2>&1

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Connection successful!"
    echo ""
    echo "You can now run migrations with:"
    echo "mysql -h $RAILWAY_HOST -P $RAILWAY_PORT -u $RAILWAY_USER -p$RAILWAY_PASS $RAILWAY_DB"
else
    echo ""
    echo "❌ Connection failed!"
    echo ""
    echo "Common issues:"
    echo "1. Check if you're using Public Network connection details"
    echo "2. Verify hostname, port, username, password are correct"
    echo "3. Make sure Railway database has Public Networking enabled"
    echo "4. Check Railway dashboard to ensure database is running"
fi

