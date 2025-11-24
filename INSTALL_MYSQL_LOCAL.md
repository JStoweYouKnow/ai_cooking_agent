# Installing MySQL Locally (macOS)

## Option 1: Using Homebrew (Recommended)

### Step 1: Install Homebrew (if you don't have it)

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### Step 2: Install MySQL

```bash
brew install mysql
```

### Step 3: Start MySQL Service

```bash
brew services start mysql
```

### Step 4: Verify Installation

```bash
mysql --version
```

You should see something like: `mysql Ver 8.0.x`

## Option 2: Using MySQL Installer (Official)

1. **Download MySQL**: https://dev.mysql.com/downloads/mysql/
   - Choose "macOS" → "DMG Archive"
   - Download the appropriate version (ARM64 for M1/M2 Macs, x86_64 for Intel)

2. **Install**:
   - Open the downloaded `.dmg` file
   - Run the installer
   - Follow the installation wizard
   - **Remember the root password** you set during installation!

3. **Start MySQL**:
   - Go to System Preferences → MySQL
   - Click "Start MySQL Server"

## Connect to Railway Database

Once MySQL is installed, connect to your Railway database:

```bash
mysql -h YOUR_RAILWAY_HOST \
      -P YOUR_RAILWAY_PORT \
      -u YOUR_RAILWAY_USER \
      -p YOUR_RAILWAY_DATABASE
```

**Replace:**
- `YOUR_RAILWAY_HOST` - from Railway's Connect button
- `YOUR_RAILWAY_PORT` - usually 3306
- `YOUR_RAILWAY_USER` - from Railway's Connect button  
- `YOUR_RAILWAY_DATABASE` - from Railway's Connect button

**Example:**
```bash
mysql -h mysql.railway.internal \
      -P 3306 \
      -u root \
      -p myapp
```

You'll be prompted for the password (get it from Railway's Connect button).

## Run Migrations

Once connected, paste these SQL statements:

```sql
-- Migration 0005: Add user preferences
ALTER TABLE `users` ADD `dietaryPreferences` text;
ALTER TABLE `users` ADD `allergies` text;

-- Migration 0006: Add user goals  
ALTER TABLE `users` ADD `goals` text;

-- Migration 0007: Add calories and budget
ALTER TABLE `recipes` ADD `caloriesPerServing` int;
ALTER TABLE `users` ADD `calorieBudget` int;

-- Verify
DESCRIBE users;
DESCRIBE recipes;
```

Type `exit;` when done to disconnect.

## Troubleshooting

### "Command not found: mysql"
- Make sure MySQL is installed and in your PATH
- Try: `which mysql` to find the location
- Add to PATH if needed: `export PATH="/usr/local/mysql/bin:$PATH"`

### "Can't connect to MySQL server"
- Check Railway connection details are correct
- Verify Railway database is running
- Check firewall/network settings

### "Access denied"
- Double-check username and password from Railway
- Make sure you're using the correct database name

