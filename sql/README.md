# SQL Server Configuration for VODML-Mapper

This directory contains SQL Server schema and configuration for using SQL Server as an alternative to MongoDB for the VODML-Mapper application.

## Overview

The `SQLServerDBHelper` class provides equivalent functionality to `MongoDBHelper363` but uses SQL Server instead of MongoDB. It leverages SQL Server's JSON and XML capabilities to store:

- **JSON states** - Frontend canvas mapping states
- **XML models** - VO-DML model definitions
- **Binary files** - User-uploaded VOTables and other files

## Requirements

- **SQL Server 2016 or later** (required for JSON support)
- **Microsoft JDBC Driver for SQL Server** (mssql-jdbc)
- SQL Server database with appropriate permissions

## Setup Instructions

### 1. Install SQL Server JDBC Driver

Add the Microsoft JDBC driver to your project dependencies:

**Maven:**
```xml
<dependency>
    <groupId>com.microsoft.sqlserver</groupId>
    <artifactId>mssql-jdbc</artifactId>
    <version>12.4.0.jre11</version>
</dependency>
```

**Manual:**
Download from: https://docs.microsoft.com/en-us/sql/connect/jdbc/download-microsoft-jdbc-driver-for-sql-server

Place the JAR file in `WebContent/WEB-INF/lib/`

### 2. Create Database

Connect to SQL Server and create the database:

```sql
CREATE DATABASE vodmlmapper;
GO
```

### 3. Run Schema Script

Execute the schema creation script:

```sql
USE vodmlmapper;
GO

-- Run the contents of sqlserver_schema.sql
```

Or using sqlcmd:

```bash
sqlcmd -S localhost -U sa -P YourPassword -i sqlserver_schema.sql
```

### 4. Configure Application

Update `WebContent/WEB-INF/web.xml` to use SQL Server instead of MongoDB:

```xml
<context-param>
    <description>Database type: mongodb or sqlserver</description>
    <param-name>database-type</param-name>
    <param-value>sqlserver</param-value>
</context-param>

<context-param>
    <description>SQL Server host</description>
    <param-name>sqlserver-host</param-name>
    <param-value>localhost</param-value>
</context-param>

<context-param>
    <description>SQL Server port</description>
    <param-name>sqlserver-port</param-name>
    <param-value>1433</param-value>
</context-param>

<context-param>
    <description>SQL Server database name</description>
    <param-name>sqlserver-database</param-name>
    <param-value>vodmlmapper</param-value>
</context-param>

<context-param>
    <description>SQL Server user</description>
    <param-name>sqlserver-user</param-name>
    <param-value>vodml_app_user</param-value>
</context-param>

<context-param>
    <description>SQL Server password</description>
    <param-name>sqlserver-pwd</param-name>
    <param-value>YourSecurePassword</param-value>
</context-param>
```

### 5. Update Servlet Code

Modify `VODMLMapperServlet.java` to use SQLServerDBHelper:

```java
// In init() method or similar:
String dbType = getServletContext().getInitParameter("database-type");

if ("sqlserver".equals(dbType)) {
    String host = getServletContext().getInitParameter("sqlserver-host");
    int port = Integer.parseInt(getServletContext().getInitParameter("sqlserver-port"));
    String database = getServletContext().getInitParameter("sqlserver-database");
    String user = getServletContext().getInitParameter("sqlserver-user");
    String pwd = getServletContext().getInitParameter("sqlserver-pwd");

    dbHelper = SQLServerDBHelper.getInstance(host, port, database, user, pwd);
} else {
    // Use MongoDB
    String host = getServletContext().getInitParameter("mongodb-host");
    int port = Integer.parseInt(getServletContext().getInitParameter("mongodb-port"));
    String user = getServletContext().getInitParameter("mongodb-user");
    String pwd = getServletContext().getInitParameter("mongodb-pwd");
    String database = getServletContext().getInitParameter("mongodb-database");

    dbHelper = MongoDBHelper363.getInstance(host, port, user, pwd, database);
}
```

## Database Schema

### Tables

1. **ivoa_models** - Model metadata (name, URLs, documentation link)
2. **ivoa_model_files** - Model XML content (stored as XML type)
3. **users** - User information
4. **user_mappings** - Private mapping states (JSON)
5. **public_mappings** - Published mapping states (JSON)
6. **user_files** - Binary file storage (VARBINARY)

### Key Features

**JSON Storage:**
- Mapping states stored as NVARCHAR(MAX) with JSON validation
- `ISJSON()` constraint ensures valid JSON
- Queried using string pattern matching (LIKE) or OPENJSON functions

**XML Storage:**
- VO-DML models stored as native XML type
- Enables XQuery operations if needed
- Automatic validation against XML standards

**Binary Storage:**
- Files stored as VARBINARY(MAX)
- No size limit (up to 2GB per file)
- Alternative: Use FILESTREAM for larger files

### Helper Views

- **v_all_mappings** - Combined view of public and private mappings
- **v_user_files_summary** - File listings with size calculations

### Stored Procedures

- **sp_get_user_stats** - Get statistics for a user (mapping count, storage usage)
- **sp_cleanup_old_mappings** - Delete old private mappings (maintenance)

## API Compatibility

The `SQLServerDBHelper` class implements the same interface as `MongoDBHelper363`:

| Method | Description | Notes |
|--------|-------------|-------|
| `addModel()` | Store VO-DML model | Stores in SQL tables instead of GridFS |
| `removeModel()` | Delete model | Cascading delete removes files |
| `openModel()` | Retrieve model | Parses XML from database |
| `saveUserMapping()` | Save canvas state | JSON stored as NVARCHAR(MAX) |
| `getMapping()` | Retrieve mapping | Checks both public and private |
| `queryPublicMappings()` | Search mappings | Uses SQL LIKE for JSON queries |
| `publishUserMapping()` | Publish to public | Transactional copy operation |
| `removeUserMapping()` | Delete private mapping | |
| `deregisterPublicMapping()` | Remove public mapping | Owner verification |
| `putFile()` | Store binary file | Uses VARBINARY(MAX) |
| `deleteFile()` | Remove file | |
| `getFiles()` | List user files | |

## Performance Considerations

### JSON Queries

The current implementation uses `LIKE` for JSON field matching:

```sql
WHERE state LIKE '%"name":"model_name"%'
```

For better performance with large datasets, consider:

1. **JSON Indexes** - Create computed columns with JSON_VALUE() and index them
2. **Full-Text Search** - Enable full-text indexing on JSON columns
3. **JSON Path Indexes** - SQL Server 2022+ supports JSON path indexing

Example of adding indexed computed column:

```sql
ALTER TABLE public_mappings
ADD model_names AS JSON_VALUE(state, '$.models[0].name');

CREATE INDEX idx_mappings_model_names ON public_mappings(model_names);
```

### Connection Pooling

For production, use connection pooling:

```java
// Example with HikariCP
HikariConfig config = new HikariConfig();
config.setJdbcUrl(connectionString);
config.setMaximumPoolSize(10);
HikariDataSource ds = new HikariDataSource(config);
```

## Migration from MongoDB

To migrate existing MongoDB data to SQL Server:

1. Export MongoDB collections to JSON:
   ```bash
   mongoexport --db=vodmlmapper --collection=public.mappings --out=mappings.json
   ```

2. Create migration script (example):
   ```sql
   -- Insert mappings from exported JSON
   INSERT INTO public_mappings (id, state, annotation, label, insert_time, owner, publication_time)
   SELECT
       NEWID(),
       -- Parse and transform JSON as needed
       ...
   FROM OPENJSON(@json_data);
   ```

3. For GridFS files, extract and insert as VARBINARY

## Testing

### Test Connection

```sql
-- Check tables exist
SELECT * FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_TYPE = 'BASE TABLE';

-- Test user statistics
EXEC sp_get_user_stats @username = 'testuser';
```

### Test Data

```sql
-- Insert test user
INSERT INTO users (username, email) VALUES ('testuser', 'test@example.com');

-- Insert test mapping
INSERT INTO user_mappings (id, username, state, label, insert_time)
VALUES (
    NEWID(),
    'testuser',
    '{"models": [], "mapper": {}}',
    'test-mapping',
    FORMAT(GETDATE(), 'yyyyMMdd-HHmmss.fff')
);
```

## Troubleshooting

### Connection Errors

**Error:** "The driver could not establish a secure connection"

**Solution:** Add `trustServerCertificate=true` to connection string or configure SSL properly

### JSON Validation Errors

**Error:** "Check constraint violation on state column"

**Solution:** Ensure JSON is valid before insert. Use `ISJSON()` to validate:

```sql
SELECT ISJSON('{"key": "value"}');  -- Returns 1 if valid
```

### Performance Issues

- Enable query execution plans to identify slow queries
- Consider indexing frequently queried JSON paths
- Use SQL Server Profiler to monitor queries

## Security

### Recommendations

1. **Use parameterized queries** - Already implemented in SQLServerDBHelper
2. **Encrypt sensitive data** - Enable Transparent Data Encryption (TDE)
3. **Restrict permissions** - Grant only necessary privileges to app user
4. **Use strong passwords** - For SQL Server authentication
5. **Enable SSL/TLS** - For client-server communication

### Example Security Setup

```sql
-- Create application user with minimal permissions
CREATE LOGIN vodml_app WITH PASSWORD = 'StrongP@ssw0rd!';
CREATE USER vodml_app FOR LOGIN vodml_app;

-- Grant only required permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON SCHEMA::dbo TO vodml_app;
DENY DROP ON SCHEMA::dbo TO vodml_app;
```

## Backup and Maintenance

### Regular Backups

```sql
-- Full backup
BACKUP DATABASE vodmlmapper
TO DISK = 'C:\Backups\vodmlmapper_full.bak'
WITH FORMAT, NAME = 'Full Backup';

-- Differential backup
BACKUP DATABASE vodmlmapper
TO DISK = 'C:\Backups\vodmlmapper_diff.bak'
WITH DIFFERENTIAL, NAME = 'Differential Backup';
```

### Cleanup Old Data

```sql
-- Remove old private mappings (older than 1 year)
EXEC sp_cleanup_old_mappings @days_old = 365;
```

## Additional Resources

- [SQL Server JSON Documentation](https://docs.microsoft.com/en-us/sql/relational-databases/json/json-data-sql-server)
- [SQL Server XML Documentation](https://docs.microsoft.com/en-us/sql/relational-databases/xml/xml-data-sql-server)
- [JDBC Driver Documentation](https://docs.microsoft.com/en-us/sql/connect/jdbc/microsoft-jdbc-driver-for-sql-server)
