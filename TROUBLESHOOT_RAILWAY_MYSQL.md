# Troubleshooting Railway MySQL Connection

## Common Errors and Solutions

### Error: "Unknown MySQL server host"
**Cause:** Wrong hostname or hostname not accessible from your local machine

**Solutions:**
1. Make sure you're using the **Public Network** connection details (not Private Network)
2. Check if Railway requires you to enable "Public Networking" first
3. Verify the hostname is correct (no typos)

### Error: "Access denied for user"
**Cause:** Wrong username or password

**Solutions:**
1. Double-check username and password from Railway
2. Make sure you're using the correct database name
3. Some Railway setups use `root` as username, others use a custom username

### Error: "Can't connect to MySQL server"
**Cause:** Port blocked, firewall, or wrong port number

**Solutions:**
1. Verify the port number (usually 3306)
2. Check if your firewall is blocking the connection
3. Try using `-P` flag explicitly: `mysql -h host -P 3306 ...`

### Error: "Connection timed out"
**Cause:** Network issue or Railway database not accessible publicly

**Solutions:**
1. Make sure Railway database has "Public Networking" enabled
2. Check Railway dashboard to see if database is running
3. Try pinging the hostname first

## Step-by-Step Debugging

### 1. Test Basic Connectivity

First, let's see if you can reach the host:

```bash
# Replace with your Railway hostname
ping YOUR_RAILWAY_HOST
```

Or test the port:

```bash
# Replace with your Railway host and port
nc -zv YOUR_RAILWAY_HOST YOUR_PORT
```

### 2. Test MySQL Connection (Verbose)

Add verbose flags to see what's happening:

```bash
mysql -h YOUR_HOST \
      -P YOUR_PORT \
      -u YOUR_USER \
      -p \
      --verbose \
      YOUR_DATABASE
```

### 3. Check Connection String Format

If Railway gives you a full connection string like:
```
mysql://user:password@host:port/database
```

You can test it directly:
```bash
mysql "mysql://user:password@host:port/database"
```

## What to Share for Help

If you're still stuck, share (with password redacted):

1. **The exact error message** from terminal
2. **The command you ran** (with password redacted)
3. **What Railway shows** in the Public Network tab (host, port, username, database name - password redacted)

## Alternative: Use Railway's Built-in Terminal

If local connection doesn't work, you can:

1. Go to Railway dashboard
2. Click on your **application service** (not MySQL)
3. Look for "Shell" or "Terminal" tab
4. Connect to MySQL from there using:
   ```bash
   mysql -h mysql.railway.internal -u root -p
   ```
   (This uses Railway's private network)

