# Quick Start Guide

## Using the New Database Component

### 1. Install
```bash
cd containers/app-mysql  # or app-postgres, app-oracle
composer install
composer dump-autoload
```

### 2. Configure Environment
Each container already has `.env` configured for its database type:
- **app-mysql**: `DB_TYPE=mysql`
- **app-postgres**: `DB_TYPE=postgres`
- **app-oracle**: `DB_TYPE=oracle`

### 3. Test Connection
```bash
docker-compose exec php php test-connection.php
```

### 4. Use in Code

**Simple Queries**:
```php
<?php
use Schwi\Database\DatabaseConnection;

// Fetch a single scalar value
$count = DatabaseConnection::getOne("SELECT COUNT(*) FROM users");

// Fetch a single row
$user = DatabaseConnection::getRow("SELECT * FROM users WHERE id = ?", [1]);

// Fetch all rows
$users = DatabaseConnection::getAll("SELECT * FROM users");
```

**Insert/Update/Delete**:
```php
<?php
use Schwi\Database\DatabaseConnection;

// Insert
DatabaseConnection::execute(
    "INSERT INTO users (name, email) VALUES (?, ?)",
    ['John Doe', 'john@example.com']
);

// Update
DatabaseConnection::execute(
    "UPDATE users SET email = ? WHERE id = ?",
    ['john.new@example.com', 1]
);

// Delete
DatabaseConnection::execute(
    "DELETE FROM users WHERE id = ?",
    [1]
);
```

**Transactions**:
```php
<?php
use Schwi\Database\DatabaseConnection;

try {
    DatabaseConnection::beginTransaction();
    
    DatabaseConnection::executeWithoutCommit(
        "INSERT INTO users (name, email) VALUES (?, ?)",
        ['Jane', 'jane@example.com']
    );
    
    DatabaseConnection::executeWithoutCommit(
        "UPDATE users SET role = ? WHERE id = ?",
        ['admin', 1]
    );
    
    DatabaseConnection::commit();
    echo "Transaction successful";
} catch (Exception $e) {
    DatabaseConnection::rollback();
    echo "Transaction failed: " . $e->getMessage();
}
```

**Repository Pattern**:
```php
<?php
use Schwi\Database\DatabaseConnection;

class UserRepository {
    public function findAll() {
        return DatabaseConnection::getAll("SELECT * FROM users");
    }
    
    public function findById($id) {
        return DatabaseConnection::getRow(
            "SELECT * FROM users WHERE id = ?",
            [$id]
        );
    }
    
    public function create($name, $email) {
        return DatabaseConnection::execute(
            "INSERT INTO users (name, email) VALUES (?, ?)",
            [$name, $email]
        );
    }
}

// Usage
$repo = new UserRepository();
$users = $repo->findAll();
$user = $repo->findById(1);
$repo->create('New User', 'new@example.com');
```

## Available Methods

| Method | Purpose |
|--------|---------|
| `getOne($sql, $params)` | Fetch single scalar value |
| `getRow($sql, $params)` | Fetch single row as array |
| `getAll($sql, $params)` | Fetch all rows as array |
| `execute($sql, $params)` | Execute INSERT/UPDATE/DELETE |
| `executeWithoutCommit($sql, $params)` | Execute without auto-commit |
| `beginTransaction()` | Start transaction |
| `commit()` | Commit transaction |
| `rollback()` | Rollback transaction |
| `getLastInsertId()` | Get last insert ID |
| `isConnected()` | Check if connected |
| `close()` | Close connection |

## What Changed from Old System

### Old (Database\Factory pattern)
```php
use Database\Factory\DatabaseFactory;

$db = DatabaseFactory::getInstance();
$stmt = $db->fetchAll("SELECT * FROM users");
$rows = $stmt->fetchAll();
```

### New (DatabaseConnection static)
```php
use Schwi\Database\DatabaseConnection;

$rows = DatabaseConnection::getAll("SELECT * FROM users");
```

**That's it! Much simpler.**

## Key Advantages

✅ **Simpler API** - No factory or driver instantiation  
✅ **Same code works everywhere** - MySQL, PostgreSQL, Oracle  
✅ **Built-in transactions** - Easy transaction management  
✅ **Better security** - Always uses prepared statements  
✅ **Less code** - Fewer lines to write and maintain  

## Support

- Full API Reference: `database-component/README.md`
- Integration Guide: `database-component/INTEGRATION.md`
- Code Examples: `database-component/examples/usage.php`
- Comparison Guide: `database-component/CONNECTION_COMPARISON.md`

## Common Tasks

### Count records
```php
$count = DatabaseConnection::getOne("SELECT COUNT(*) FROM users");
```

### Get user by ID
```php
$user = DatabaseConnection::getRow(
    "SELECT * FROM users WHERE id = ?",
    [1]
);
```

### Get all active users
```php
$users = DatabaseConnection::getAll(
    "SELECT * FROM users WHERE status = ? ORDER BY name",
    ['active']
);
```

### Insert record
```php
DatabaseConnection::execute(
    "INSERT INTO users (name, email, created_at) VALUES (?, ?, NOW())",
    ['John', 'john@example.com']
);
```

### Update record
```php
DatabaseConnection::execute(
    "UPDATE users SET name = ?, email = ? WHERE id = ?",
    ['John Doe', 'john@example.com', 1]
);
```

### Delete record
```php
DatabaseConnection::execute(
    "DELETE FROM users WHERE id = ?",
    [1]
);
```

### Transfer funds (transaction example)
```php
try {
    DatabaseConnection::beginTransaction();
    
    DatabaseConnection::executeWithoutCommit(
        "UPDATE accounts SET balance = balance - ? WHERE user_id = ?",
        [100, 1]
    );
    
    DatabaseConnection::executeWithoutCommit(
        "UPDATE accounts SET balance = balance + ? WHERE user_id = ?",
        [100, 2]
    );
    
    DatabaseConnection::commit();
    echo "Transfer successful";
} catch (Exception $e) {
    DatabaseConnection::rollback();
    echo "Transfer failed";
}
```

---

**Ready to use!** Start with a simple query and build from there.
