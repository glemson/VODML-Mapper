-- ============================================================================
-- SQL Server Database Schema for VODML-Mapper
-- ============================================================================
-- This script creates the database schema for SQLServerDBHelper.
-- Requires SQL Server 2016+ for JSON support.
--
-- Usage:
--   1. Create a database: CREATE DATABASE vodmlmapper;
--   2. Switch to database: USE vodmlmapper;
--   3. Run this script to create tables
-- ============================================================================

USE vodmlmapper;
GO

-- ============================================================================
-- IVOA MODELS
-- Stores metadata about VO-DML models
-- ============================================================================

IF OBJECT_ID('ivoa_models', 'U') IS NOT NULL
    DROP TABLE ivoa_models;
GO

CREATE TABLE ivoa_models (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL UNIQUE,
    vodml_urls NVARCHAR(MAX) NULL,  -- Pipe-delimited list of URLs
    documentation_url NVARCHAR(1000) NULL,
    created_time DATETIME2 DEFAULT GETDATE()
);
GO

CREATE INDEX idx_ivoa_models_name ON ivoa_models(name);
GO

-- ============================================================================
-- IVOA MODEL FILES
-- Stores XML content of VO-DML models
-- ============================================================================

IF OBJECT_ID('ivoa_model_files', 'U') IS NOT NULL
    DROP TABLE ivoa_model_files;
GO

CREATE TABLE ivoa_model_files (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL UNIQUE,
    content XML NOT NULL,
    content_type NVARCHAR(100) DEFAULT 'application/xml',
    created_time DATETIME2 DEFAULT GETDATE(),

    CONSTRAINT fk_model_files_name FOREIGN KEY (name)
        REFERENCES ivoa_models(name) ON DELETE CASCADE
);
GO

CREATE INDEX idx_model_files_name ON ivoa_model_files(name);
GO

-- ============================================================================
-- USERS
-- Stores user information
-- ============================================================================

IF OBJECT_ID('users', 'U') IS NOT NULL
    DROP TABLE users;
GO

CREATE TABLE users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    username NVARCHAR(255) NOT NULL UNIQUE,
    email NVARCHAR(255) NULL,
    created_time DATETIME2 DEFAULT GETDATE(),
    last_login DATETIME2 NULL
);
GO

CREATE INDEX idx_users_username ON users(username);
GO

-- ============================================================================
-- USER MAPPINGS
-- Stores private mapping states (JSON canvas states)
-- ============================================================================

IF OBJECT_ID('user_mappings', 'U') IS NOT NULL
    DROP TABLE user_mappings;
GO

CREATE TABLE user_mappings (
    id NVARCHAR(36) PRIMARY KEY,  -- UUID
    username NVARCHAR(255) NOT NULL,
    state NVARCHAR(MAX) NOT NULL,  -- JSON state
    annotation NVARCHAR(MAX) NULL,
    label NVARCHAR(500) NULL,
    insert_time NVARCHAR(50) NOT NULL,
    created_time DATETIME2 DEFAULT GETDATE(),

    -- Add check constraint to ensure valid JSON
    CONSTRAINT chk_user_mappings_state_json CHECK (ISJSON(state) = 1)
);
GO

CREATE INDEX idx_user_mappings_username ON user_mappings(username);
CREATE INDEX idx_user_mappings_label ON user_mappings(label);
CREATE INDEX idx_user_mappings_insert_time ON user_mappings(insert_time);
GO

-- ============================================================================
-- PUBLIC MAPPINGS
-- Stores published/public mapping states
-- ============================================================================

IF OBJECT_ID('public_mappings', 'U') IS NOT NULL
    DROP TABLE public_mappings;
GO

CREATE TABLE public_mappings (
    id NVARCHAR(36) PRIMARY KEY,  -- UUID
    state NVARCHAR(MAX) NOT NULL,  -- JSON state
    annotation NVARCHAR(MAX) NULL,
    label NVARCHAR(500) NULL,
    insert_time NVARCHAR(50) NOT NULL,
    owner NVARCHAR(255) NOT NULL,
    publication_time NVARCHAR(50) NOT NULL,
    created_time DATETIME2 DEFAULT GETDATE(),

    -- Add check constraint to ensure valid JSON
    CONSTRAINT chk_public_mappings_state_json CHECK (ISJSON(state) = 1)
);
GO

CREATE INDEX idx_public_mappings_owner ON public_mappings(owner);
CREATE INDEX idx_public_mappings_label ON public_mappings(label);
CREATE INDEX idx_public_mappings_publication_time ON public_mappings(publication_time);

-- For JSON queries - may improve performance
-- Note: Full-text indexing on JSON requires extracting specific paths
CREATE INDEX idx_public_mappings_state ON public_mappings(state);
GO

-- ============================================================================
-- USER FILES
-- Stores binary files uploaded by users (VOTables, etc.)
-- ============================================================================

IF OBJECT_ID('user_files', 'U') IS NOT NULL
    DROP TABLE user_files;
GO

CREATE TABLE user_files (
    id NVARCHAR(36) PRIMARY KEY,  -- UUID
    username NVARCHAR(255) NOT NULL,
    filename NVARCHAR(500) NOT NULL,
    content VARBINARY(MAX) NOT NULL,
    content_type NVARCHAR(100) NULL,
    url NVARCHAR(1000) NULL,  -- Original URL if fetched remotely
    upload_time NVARCHAR(50) NOT NULL,
    created_time DATETIME2 DEFAULT GETDATE()
);
GO

CREATE INDEX idx_user_files_username ON user_files(username);
CREATE INDEX idx_user_files_filename ON user_files(filename);
GO

-- ============================================================================
-- SAMPLE DATA
-- Optional: Insert some default users for testing
-- ============================================================================

-- Uncomment to add test users:
-- INSERT INTO users (username, email) VALUES ('testuser', 'test@example.com');
-- INSERT INTO users (username, email) VALUES ('admin', 'admin@example.com');

-- ============================================================================
-- HELPER VIEWS
-- Optional: Create views for common queries
-- ============================================================================

-- View for mapping summary (both public and private)
IF OBJECT_ID('v_all_mappings', 'V') IS NOT NULL
    DROP VIEW v_all_mappings;
GO

CREATE VIEW v_all_mappings AS
SELECT
    id,
    username,
    label,
    annotation,
    insert_time,
    'private' as mapping_type,
    NULL as owner,
    NULL as publication_time
FROM user_mappings
UNION ALL
SELECT
    id,
    owner as username,
    label,
    annotation,
    insert_time,
    'public' as mapping_type,
    owner,
    publication_time
FROM public_mappings;
GO

-- View for user file summary
IF OBJECT_ID('v_user_files_summary', 'V') IS NOT NULL
    DROP VIEW v_user_files_summary;
GO

CREATE VIEW v_user_files_summary AS
SELECT
    id,
    username,
    filename,
    content_type,
    DATALENGTH(content) as size_bytes,
    DATALENGTH(content) / 1024.0 as size_kb,
    DATALENGTH(content) / 1048576.0 as size_mb,
    upload_time,
    created_time
FROM user_files;
GO

-- ============================================================================
-- STORED PROCEDURES
-- Optional: Helper procedures for common operations
-- ============================================================================

-- Procedure to get user statistics
IF OBJECT_ID('sp_get_user_stats', 'P') IS NOT NULL
    DROP PROCEDURE sp_get_user_stats;
GO

CREATE PROCEDURE sp_get_user_stats
    @username NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        @username as username,
        (SELECT COUNT(*) FROM user_mappings WHERE username = @username) as private_mappings,
        (SELECT COUNT(*) FROM public_mappings WHERE owner = @username) as public_mappings,
        (SELECT COUNT(*) FROM user_files WHERE username = @username) as uploaded_files,
        (SELECT ISNULL(SUM(DATALENGTH(content)), 0) / 1048576.0
         FROM user_files WHERE username = @username) as total_storage_mb;
END;
GO

-- Procedure to clean up old private mappings
IF OBJECT_ID('sp_cleanup_old_mappings', 'P') IS NOT NULL
    DROP PROCEDURE sp_cleanup_old_mappings;
GO

CREATE PROCEDURE sp_cleanup_old_mappings
    @days_old INT = 365
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @cutoff_date DATETIME2 = DATEADD(DAY, -@days_old, GETDATE());

    DELETE FROM user_mappings
    WHERE created_time < @cutoff_date;

    SELECT @@ROWCOUNT as deleted_count;
END;
GO

-- ============================================================================
-- FUNCTIONS
-- Optional: Utility functions
-- ============================================================================

-- Function to extract model names from mapping JSON
IF OBJECT_ID('fn_extract_model_names', 'FN') IS NOT NULL
    DROP FUNCTION fn_extract_model_names;
GO

CREATE FUNCTION fn_extract_model_names(@state NVARCHAR(MAX))
RETURNS NVARCHAR(MAX)
AS
BEGIN
    DECLARE @models NVARCHAR(MAX);

    -- This is a simplified version - actual implementation depends on JSON structure
    -- Example: Extract model names from state JSON
    -- Requires parsing JSON with OPENJSON in SQL Server 2016+

    SET @models = '';

    RETURN @models;
END;
GO

-- ============================================================================
-- PERMISSIONS
-- Grant appropriate permissions to application user
-- Uncomment and modify as needed:
-- ============================================================================

-- CREATE LOGIN vodml_app_user WITH PASSWORD = 'YourSecurePassword123!';
-- CREATE USER vodml_app_user FOR LOGIN vodml_app_user;
--
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ivoa_models TO vodml_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ivoa_model_files TO vodml_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON users TO vodml_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON user_mappings TO vodml_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON public_mappings TO vodml_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON user_files TO vodml_app_user;
-- GRANT EXECUTE ON sp_get_user_stats TO vodml_app_user;
-- GRANT EXECUTE ON sp_cleanup_old_mappings TO vodml_app_user;

-- ============================================================================
-- VERIFICATION
-- Check that all tables were created successfully
-- ============================================================================

SELECT
    TABLE_NAME,
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = t.TABLE_NAME) as column_count
FROM INFORMATION_SCHEMA.TABLES t
WHERE TABLE_TYPE = 'BASE TABLE'
    AND TABLE_NAME IN (
        'ivoa_models',
        'ivoa_model_files',
        'users',
        'user_mappings',
        'public_mappings',
        'user_files'
    )
ORDER BY TABLE_NAME;
GO

PRINT 'Schema creation completed successfully.';
GO
