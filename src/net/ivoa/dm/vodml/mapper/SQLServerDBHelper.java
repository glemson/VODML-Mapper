package net.ivoa.dm.vodml.mapper;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Random;
import java.util.UUID;

import jakarta.servlet.http.HttpServletRequest;

import org.apache.commons.fileupload2.core.FileItem;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import org.ivoa.vodml.RemoteVODMLRegistry;
import org.ivoa.vodml.VODML_JAXBHelper;
import org.ivoa.vodml.jaxb.Model;
import org.ivoa.vodml.jaxb.Models.Modellocation;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * SQL Server implementation of the database helper for VODML-Mapper.
 * Provides equivalent functionality to MongoDBHelper363 using SQL Server's
 * JSON and XML capabilities.
 *
 * Required SQL Server features:
 * - JSON support (SQL Server 2016+)
 * - XML data type
 * - VARBINARY(MAX) for file storage
 *
 * See accompanying schema.sql for database setup.
 */
public class SQLServerDBHelper implements DatabaseHelper {
    private static final Logger logger = LogManager.getLogger(SQLServerDBHelper.class);

    private static SQLServerDBHelper instance;

    protected static synchronized SQLServerDBHelper getInstance(String host, int port, String database, String user, String pwd) throws Exception {
        if (instance == null) {
            instance = new SQLServerDBHelper(host, port, database, user, pwd);
        } else if (!instance.host.equals(host) || instance.port != port || !instance.database.equals(database)) {
            throw new Exception("A SQLServerDBHelper was already initialized with different parameters");
        }
        return instance;
    }

    private String host;
    private int port;
    private String database;
    private String user;
    private String pwd;
    private String connectionString;
    private Random random = new Random();

    /** Fallback remote registry in case a model does not exist in DB */
    private RemoteVODMLRegistry urlReg;

    /** Table names */
    public static final String IVOA_MODELS_TABLE = "ivoa_models";
    public static final String IVOA_MODEL_FILES_TABLE = "ivoa_model_files";
    public static final String PUBLIC_MAPPINGS_TABLE = "public_mappings";
    public static final String USER_MAPPINGS_TABLE = "user_mappings";
    public static final String USER_FILES_TABLE = "user_files";
    public static final String USERS_TABLE = "users";

    private SQLServerDBHelper(String host, int port, String database, String user, String pwd) throws Exception {
        this.host = host;
        this.port = port;
        this.database = database;
        this.user = user;
        this.pwd = pwd;

        // Build SQL Server connection string
        this.connectionString = String.format(
            "jdbc:sqlserver://%s:%d;databaseName=%s;user=%s;password=%s;encrypt=true;trustServerCertificate=true",
            host, port, database, user, pwd
        );

        // Load SQL Server JDBC driver
        try {
            Class.forName("com.microsoft.sqlserver.jdbc.SQLServerDriver");
        } catch (ClassNotFoundException e) {
            throw new Exception("SQL Server JDBC driver not found", e);
        }

        // Test connection
        try (Connection conn = getConnection()) {
            logger.info("Successfully connected to SQL Server database: " + database);
        }

        this.urlReg = new RemoteVODMLRegistry();
    }

    /**
     * Get a new database connection.
     * Caller is responsible for closing the connection.
     */
    private Connection getConnection() throws SQLException {
        return DriverManager.getConnection(connectionString);
    }

    /**
     * Get username from request.
     */
    private String getUsername(HttpServletRequest req) {
        String username = req.getRemoteUser();
        return username != null ? username : "anonymous";
    }

    // ========================================================================
    // IVOA MODELS - Store and retrieve VO-DML models (XML)
    // ========================================================================

    /**
     * Add a VO-DML model to the database with given name and URLs.
     * Stores model metadata in ivoa_models table and XML content in ivoa_model_files table.
     *
     * @param name Model name
     * @param urls Array of URLs (all representing the same model)
     * @param docURL Documentation URL
     * @return Parsed Model object
     */
    @Override
    public Model addModel(String name, String[] urls, String docURL) throws Exception {
        // Parse the model from the first URL
        Model m = VODML_JAXBHelper.jaxb.parseVODML(new URL(urls[0]).openStream());
        String modelXML = VODML_JAXBHelper.jaxb.marshall(m);

        try (Connection conn = getConnection()) {
            conn.setAutoCommit(false);

            try {
                // Delete existing model if present
                removeModel(name);

                // Insert model metadata
                String sql = "INSERT INTO " + IVOA_MODELS_TABLE +
                           " (name, vodml_urls, documentation_url) VALUES (?, ?, ?)";
                try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                    stmt.setString(1, name);
                    stmt.setString(2, String.join("|", urls)); // Store as pipe-delimited
                    stmt.setString(3, docURL);
                    stmt.executeUpdate();
                }

                // Insert model XML content
                sql = "INSERT INTO " + IVOA_MODEL_FILES_TABLE +
                     " (name, content, content_type) VALUES (?, CAST(? AS XML), ?)";
                try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                    stmt.setString(1, name);
                    stmt.setString(2, modelXML);
                    stmt.setString(3, "application/xml");
                    stmt.executeUpdate();
                }

                conn.commit();
                logger.info("Successfully added model: " + name);
                return m;

            } catch (Exception e) {
                conn.rollback();
                throw e;
            }
        }
    }

    /**
     * Remove a model from the database.
     */
    @Override
    public boolean removeModel(String name) {
        try (Connection conn = getConnection()) {
            conn.setAutoCommit(false);

            try {
                // Delete from both tables
                String sql = "DELETE FROM " + IVOA_MODEL_FILES_TABLE + " WHERE name = ?";
                try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                    stmt.setString(1, name);
                    stmt.executeUpdate();
                }

                sql = "DELETE FROM " + IVOA_MODELS_TABLE + " WHERE name = ?";
                try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                    stmt.setString(1, name);
                    stmt.executeUpdate();
                }

                conn.commit();
                logger.info("Successfully removed model: " + name);
                return true;

            } catch (Exception e) {
                conn.rollback();
                logger.error("Error removing model: " + name, e);
                return false;
            }
        } catch (SQLException e) {
            logger.error("Database connection error", e);
            return false;
        }
    }

    /**
     * Open/retrieve a model from the database.
     * Falls back to remote registry if not found locally.
     */
    @Override
    public Modellocation openModel(String name, String url) throws Exception {
        try (Connection conn = getConnection()) {
            String sql = "SELECT content FROM " + IVOA_MODEL_FILES_TABLE + " WHERE name = ?";

            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                stmt.setString(1, name);

                try (ResultSet rs = stmt.executeQuery()) {
                    if (rs.next()) {
                        String modelXML = rs.getString("content");
                        Model m = VODML_JAXBHelper.jaxb.parseVODML(
                            new ByteArrayInputStream(modelXML.getBytes("UTF-8"))
                        );

                        Modellocation ml = new Modellocation();
                        ml.setName(name);
                        ml.setLocation(url);
                        ml.setModel(m);
                        return ml;
                    }
                }
            }
        }

        // Model not found in database, use remote registry
        logger.info("Model not found in database, using remote registry: " + name);
        return urlReg.openModel(name, url);
    }

    // ========================================================================
    // USER MAPPINGS - Store and retrieve mapping states (JSON)
    // ========================================================================

    /**
     * Save a user mapping (canvas state) to the database.
     *
     * @param req HTTP request
     * @param json JSON object containing state, annotation, label, and optional _id
     * @return JSON result with status
     */
    @Override
    public JSONObject saveUserMapping(HttpServletRequest req, JSONObject json) {
        String username = getUsername(req);
        JSONObject state = json.getJSONObject("state");
        String stateJSON = state.toString();

        String insertTime = currentTime();
        String annotation = json.optString("annotation");
        String label = json.optString("label");
        if (label == null || label.trim().length() == 0) {
            label = randomLabel();
        }

        String id = json.optString("_id");

        logger.info(String.format("Saving state with label '%s' for user '%s'", label, username));

        try (Connection conn = getConnection()) {
            String sql;
            PreparedStatement stmt;

            if (id != null && id.trim().length() > 0) {
                // Update existing mapping
                sql = "UPDATE " + USER_MAPPINGS_TABLE +
                     " SET state = ?, annotation = ?, label = ?, insert_time = ?" +
                     " WHERE id = ? AND username = ?";
                stmt = conn.prepareStatement(sql);
                stmt.setString(1, stateJSON);
                stmt.setString(2, annotation);
                stmt.setString(3, label);
                stmt.setString(4, insertTime);
                stmt.setString(5, id);
                stmt.setString(6, username);

                int rows = stmt.executeUpdate();
                if (rows == 0) {
                    // ID not found, insert new instead
                    id = null;
                }
            }

            if (id == null || id.trim().length() == 0) {
                // Insert new mapping
                id = UUID.randomUUID().toString();
                sql = "INSERT INTO " + USER_MAPPINGS_TABLE +
                     " (id, username, state, annotation, label, insert_time)" +
                     " VALUES (?, ?, ?, ?, ?, ?)";
                stmt = conn.prepareStatement(sql);
                stmt.setString(1, id);
                stmt.setString(2, username);
                stmt.setString(3, stateJSON);
                stmt.setString(4, annotation);
                stmt.setString(5, label);
                stmt.setString(6, insertTime);
                stmt.executeUpdate();
            }

            JSONObject result = new JSONObject();
            result.put("result", "ok");
            result.put("label", label);
            result.put("insertTime", insertTime);
            result.put("_id", id);

            // Add state with _id
            JSONObject jstate = new JSONObject(stateJSON);
            jstate.put("_id", id);
            result.put("state", jstate);

            return result;

        } catch (Exception e) {
            logger.error("Error saving user mapping", e);
            JSONObject result = new JSONObject();
            result.put("result", "error");
            result.put("error", e.getMessage());
            return result;
        }
    }

    /**
     * Get a mapping by ID (checks both public and user collections).
     */
    @Override
    public JSONObject getMapping(HttpServletRequest req, String username) {
        String id = req.getParameter("_id");

        try (Connection conn = getConnection()) {
            // Try public mappings first
            String sql = "SELECT state, annotation, label, insert_time, owner, publication_time" +
                        " FROM " + PUBLIC_MAPPINGS_TABLE + " WHERE id = ?";

            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                stmt.setString(1, id);

                try (ResultSet rs = stmt.executeQuery()) {
                    if (rs.next()) {
                        return resultSetToMapping(rs, id, true);
                    }
                }
            }

            // Try user mappings if username provided
            if (username != null) {
                sql = "SELECT state, annotation, label, insert_time" +
                     " FROM " + USER_MAPPINGS_TABLE + " WHERE id = ? AND username = ?";

                try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                    stmt.setString(1, id);
                    stmt.setString(2, username);

                    try (ResultSet rs = stmt.executeQuery()) {
                        if (rs.next()) {
                            return resultSetToMapping(rs, id, false);
                        }
                    }
                }
            }

            return null;

        } catch (Exception e) {
            logger.error("Error getting mapping", e);
            return null;
        }
    }

    /**
     * Get a public mapping by ID.
     */
    @Override
    public JSONObject getPublicMapping(HttpServletRequest req) {
        String id = req.getParameter("_id");

        try (Connection conn = getConnection()) {
            String sql = "SELECT state, annotation, label, insert_time, owner, publication_time" +
                        " FROM " + PUBLIC_MAPPINGS_TABLE + " WHERE id = ?";

            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                stmt.setString(1, id);

                try (ResultSet rs = stmt.executeQuery()) {
                    if (rs.next()) {
                        return resultSetToMapping(rs, id, true);
                    }
                }
            }

            return null;

        } catch (Exception e) {
            logger.error("Error getting public mapping", e);
            return null;
        }
    }

    /**
     * Query public mappings with filters.
     * Uses SQL Server JSON functions to query within JSON state.
     *
     * @param _models Space-separated model names
     * @param _types Space-separated type vodmlrefs
     * @param _vodmlrefs Space-separated vodmlrefs
     * @param fields Fields to include in results
     * @return List of matching mappings as JSONObjects
     */
    @Override
    public List<JSONObject> queryPublicMappings(String _models, String _types, String _vodmlrefs, String[] fields) {
        List<JSONObject> results = new ArrayList<>();

        StringBuilder sql = new StringBuilder();
        sql.append("SELECT id, state, annotation, label, insert_time, owner, publication_time");
        sql.append(" FROM ").append(PUBLIC_MAPPINGS_TABLE);
        sql.append(" WHERE 1=1");

        List<String> params = new ArrayList<>();

        // Filter by models - check if models.name contains any of the specified models
        if (_models != null && _models.trim().length() > 0) {
            String[] models = _models.trim().split("\\s+");
            sql.append(" AND (");
            for (int i = 0; i < models.length; i++) {
                if (i > 0) sql.append(" OR ");
                sql.append("state LIKE ?");
                params.add("%\"name\":\"" + models[i] + "\"%");
            }
            sql.append(")");
        }

        // Filter by types - check mapper.objects.vodmlref
        if (_types != null && _types.trim().length() > 0) {
            String[] types = _types.trim().split("\\s+");
            sql.append(" AND (");
            for (int i = 0; i < types.length; i++) {
                if (i > 0) sql.append(" OR ");
                sql.append("state LIKE ?");
                params.add("%\"vodmlref\":\"" + types[i] + "\"%");
            }
            sql.append(")");
        }

        // Filter by vodmlrefs - check both mapper.maps.from.role.vodmlref and mapper.objects.vodmlref
        if (_vodmlrefs != null && _vodmlrefs.trim().length() > 0) {
            String[] vodmlrefs = _vodmlrefs.trim().split("\\s+");
            sql.append(" AND (");
            for (int i = 0; i < vodmlrefs.length; i++) {
                if (i > 0) sql.append(" OR ");
                sql.append("(state LIKE ? OR state LIKE ?)");
                params.add("%\"vodmlref\":\"" + vodmlrefs[i] + "\"%");
                params.add("%\"role\":%\"vodmlref\":\"" + vodmlrefs[i] + "\"%");
            }
            sql.append(")");
        }

        try (Connection conn = getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql.toString())) {

            // Set parameters
            for (int i = 0; i < params.size(); i++) {
                stmt.setString(i + 1, params.get(i));
            }

            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    JSONObject mapping = resultSetToMapping(rs, rs.getString("id"), true);

                    // Filter fields if specified
                    if (fields != null && fields.length > 0) {
                        JSONObject filtered = new JSONObject();
                        for (String field : fields) {
                            if (mapping.has(field)) {
                                filtered.put(field, mapping.get(field));
                            }
                        }
                        results.add(filtered);
                    } else {
                        results.add(mapping);
                    }
                }
            }

        } catch (Exception e) {
            logger.error("Error querying public mappings", e);
        }

        return results;
    }

    /**
     * Publish a user mapping to the public collection.
     */
    @Override
    public JSONObject publishUserMapping(HttpServletRequest req, JSONObject params) {
        JSONObject result = new JSONObject();
        String username = getUsername(req);

        try {
            String id = params.getString("_id");
            String keep = params.getString("keep");

            try (Connection conn = getConnection()) {
                conn.setAutoCommit(false);

                try {
                    // Get the user mapping
                    String sql = "SELECT state, annotation, label FROM " + USER_MAPPINGS_TABLE +
                               " WHERE id = ? AND username = ?";

                    String state = null;
                    String annotation = null;
                    String label = null;

                    try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                        stmt.setString(1, id);
                        stmt.setString(2, username);

                        try (ResultSet rs = stmt.executeQuery()) {
                            if (rs.next()) {
                                state = rs.getString("state");
                                annotation = rs.getString("annotation");
                                label = rs.getString("label");
                            } else {
                                result.put("result", "error");
                                result.put("error", "Mapping not found");
                                return result;
                            }
                        }
                    }

                    // Insert into public mappings
                    String publicationTime = currentTime();
                    String newId = UUID.randomUUID().toString();

                    sql = "INSERT INTO " + PUBLIC_MAPPINGS_TABLE +
                         " (id, state, annotation, label, insert_time, owner, publication_time)" +
                         " VALUES (?, ?, ?, ?, ?, ?, ?)";

                    try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                        stmt.setString(1, newId);
                        stmt.setString(2, state);
                        stmt.setString(3, annotation);
                        stmt.setString(4, label);
                        stmt.setString(5, currentTime());
                        stmt.setString(6, username);
                        stmt.setString(7, publicationTime);
                        stmt.executeUpdate();
                    }

                    JSONObject insert = new JSONObject();
                    insert.put("result", "ok");
                    insert.put("_id", newId);
                    result.put("insert", insert);

                    // Remove from user mappings if requested
                    if ("false".equals(keep)) {
                        sql = "DELETE FROM " + USER_MAPPINGS_TABLE + " WHERE id = ? AND username = ?";

                        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                            stmt.setString(1, id);
                            stmt.setString(2, username);
                            int rows = stmt.executeUpdate();

                            JSONObject remove = new JSONObject();
                            if (rows > 0) {
                                remove.put("result", "ok");
                            } else {
                                remove.put("result", "error");
                                remove.put("error", "Unable to delete user mapping");
                            }
                            result.put("remove", remove);
                        }
                    } else {
                        result.put("remove", "no");
                    }

                    conn.commit();
                    result.put("result", "ok");

                } catch (Exception e) {
                    conn.rollback();
                    throw e;
                }
            }

        } catch (Exception e) {
            logger.error("Error publishing user mapping", e);
            result.put("result", "error");
            result.put("error", "INTERNAL ERROR: " + e.getMessage());
        }

        return result;
    }

    /**
     * Remove a user mapping.
     */
    @Override
    public JSONObject removeUserMapping(HttpServletRequest req, JSONObject params) {
        JSONObject result = new JSONObject();
        String username = getUsername(req);

        try {
            String id = params.getString("_id");

            try (Connection conn = getConnection()) {
                String sql = "DELETE FROM " + USER_MAPPINGS_TABLE + " WHERE id = ? AND username = ?";

                try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                    stmt.setString(1, id);
                    stmt.setString(2, username);

                    int rows = stmt.executeUpdate();

                    if (rows > 0) {
                        result.put("result", "ok");
                    } else {
                        result.put("result", "error");
                        result.put("error", "No document found for _id=" + id);
                    }
                }
            }

        } catch (Exception e) {
            logger.error("Error removing user mapping", e);
            result.put("result", "error");
            result.put("error", "INTERNAL ERROR: " + e.getMessage());
        }

        return result;
    }

    /**
     * Deregister (remove) a public mapping owned by the current user.
     */
    @Override
    public JSONObject deregisterPublicMapping(HttpServletRequest req, JSONObject params) {
        JSONObject result = new JSONObject();
        String username = getUsername(req);

        try {
            String id = params.getString("_id");

            try (Connection conn = getConnection()) {
                String sql = "DELETE FROM " + PUBLIC_MAPPINGS_TABLE + " WHERE id = ? AND owner = ?";

                try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                    stmt.setString(1, id);
                    stmt.setString(2, username);

                    int rows = stmt.executeUpdate();

                    if (rows > 0) {
                        result.put("result", "ok");
                    } else {
                        result.put("result", "error");
                        result.put("error", "Cannot find public map owned by user with specified _id");
                    }
                }
            }

        } catch (Exception e) {
            logger.error("Error deregistering public mapping", e);
            result.put("result", "error");
            result.put("error", e.getMessage());
        }

        return result;
    }

    // ========================================================================
    // FILE STORAGE - Store and retrieve binary files
    // ========================================================================

    /**
     * Store an uploaded file.
     */
    @Override
    public void putFile(HttpServletRequest request, FileItem fi) throws IOException {
        String username = getUsername(request);

        try (Connection conn = getConnection()) {
            String sql = "INSERT INTO " + USER_FILES_TABLE +
                       " (id, username, filename, content, content_type, upload_time)" +
                       " VALUES (?, ?, ?, ?, ?, ?)";

            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                String id = UUID.randomUUID().toString();
                stmt.setString(1, id);
                stmt.setString(2, username);
                stmt.setString(3, fi.getName());
                stmt.setBytes(4, fi.get());
                stmt.setString(5, fi.getContentType());
                stmt.setString(6, currentTime());
                stmt.executeUpdate();

                logger.info("Stored file: " + fi.getName() + " for user: " + username);
            }

        } catch (SQLException e) {
            throw new IOException("Error storing file", e);
        }
    }

    /**
     * Store a file from a remote URL.
     */
    @Override
    public boolean putFile(String tableName, String name, URL url, String contentType) throws IOException {
        try (InputStream in = url.openStream()) {
            ByteArrayOutputStream buffer = new ByteArrayOutputStream();
            byte[] data = new byte[8192];
            int nRead;
            while ((nRead = in.read(data, 0, data.length)) != -1) {
                buffer.write(data, 0, nRead);
            }
            buffer.flush();

            try (Connection conn = getConnection()) {
                String sql = "INSERT INTO " + USER_FILES_TABLE +
                           " (id, username, filename, content, content_type, url, upload_time)" +
                           " VALUES (?, ?, ?, ?, ?, ?, ?)";

                try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                    stmt.setString(1, UUID.randomUUID().toString());
                    stmt.setString(2, "system");
                    stmt.setString(3, name);
                    stmt.setBytes(4, buffer.toByteArray());
                    stmt.setString(5, contentType);
                    stmt.setString(6, url.toString());
                    stmt.setString(7, currentTime());
                    stmt.executeUpdate();

                    logger.info("Stored file from URL: " + url);
                    return true;
                }
            }

        } catch (Exception e) {
            throw new IOException("Error storing file from URL", e);
        }
    }

    /**
     * Delete a file.
     */
    @Override
    public boolean deleteFile(HttpServletRequest request, String name) throws IOException {
        String username = getUsername(request);

        try (Connection conn = getConnection()) {
            String sql = "DELETE FROM " + USER_FILES_TABLE + " WHERE filename = ? AND username = ?";

            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                stmt.setString(1, name);
                stmt.setString(2, username);

                int rows = stmt.executeUpdate();
                return rows > 0;
            }

        } catch (SQLException e) {
            throw new IOException("Error deleting file", e);
        }
    }

    /**
     * List all files for a user.
     */
    @Override
    public JSONArray getFiles(HttpServletRequest request) {
        String username = getUsername(request);
        JSONArray files = new JSONArray();

        try (Connection conn = getConnection()) {
            String sql = "SELECT id, filename, content_type, DATALENGTH(content) as size, upload_time" +
                       " FROM " + USER_FILES_TABLE + " WHERE username = ?";

            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                stmt.setString(1, username);

                try (ResultSet rs = stmt.executeQuery()) {
                    while (rs.next()) {
                        JSONObject file = new JSONObject();
                        file.put("_id", rs.getString("id"));
                        file.put("name", rs.getString("filename"));
                        file.put("size", rs.getLong("size"));
                        file.put("delete_type", "GET");
                        files.put(file);
                    }
                }
            }

        } catch (Exception e) {
            logger.error("Error getting files", e);
        }

        return files;
    }

    // ========================================================================
    // VODMLRegistry INTERFACE
    // ========================================================================

    @Override
    public JSONObject defaultModels() throws Exception {
        return urlReg.defaultModels();
    }

    // ========================================================================
    // UTILITY METHODS
    // ========================================================================

    /**
     * Get current timestamp.
     */
    private String currentTime() {
        SimpleDateFormat f = new SimpleDateFormat("yyyyMMdd-HHmmss.SSS");
        return f.format(new Date());
    }

    /**
     * Generate random label.
     */
    private String randomLabel() {
        return new UUID(random.nextLong(), random.nextLong()).toString();
    }

    /**
     * Convert ResultSet to JSONObject for mapping data.
     */
    private JSONObject resultSetToMapping(ResultSet rs, String id, boolean isPublic) throws SQLException {
        String stateJSON = rs.getString("state");
        JSONObject mapping = new JSONObject(stateJSON);

        mapping.put("_id", id);
        mapping.put("annotation", rs.getString("annotation"));
        mapping.put("label", rs.getString("label"));
        mapping.put("insertTime", rs.getString("insert_time"));

        if (isPublic) {
            mapping.put("owner", rs.getString("owner"));
            mapping.put("publicationTime", rs.getString("publication_time"));
        }

        return mapping;
    }
}
