package net.ivoa.dm.vodml.mapper;

import java.io.IOException;
import java.net.URL;
import java.util.List;

import jakarta.servlet.http.HttpServletRequest;

import org.apache.commons.fileupload2.core.FileItem;
import org.ivoa.vodml.VODMLRegistry;
import org.ivoa.vodml.jaxb.Model;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Common interface for database operations in VODML-Mapper.
 * This interface abstracts the underlying database implementation (MongoDB, SQL Server, etc.)
 * allowing implementations to be swapped without changing dependent code.
 *
 * Extends VODMLRegistry for model registry operations.
 */
public interface DatabaseHelper extends VODMLRegistry {

    // ========================================================================
    // Model Management
    // ========================================================================

    /**
     * Add a VO-DML model to the registry.
     *
     * @param name Model name/identifier
     * @param urls URLs where the model can be accessed
     * @param docURL URL to model documentation
     * @return The added Model object
     * @throws Exception if model cannot be added
     */
    Model addModel(String name, String[] urls, String docURL) throws Exception;

    /**
     * Remove a model from the registry.
     *
     * @param name Model name/identifier to remove
     * @return true if model was removed, false otherwise
     */
    boolean removeModel(String name);

    // ========================================================================
    // User Mapping Operations
    // ========================================================================

    /**
     * Save or update a user's mapping.
     *
     * @param req HTTP request containing user context
     * @param json Mapping data as JSON object
     * @return Result of the save operation
     */
    JSONObject saveUserMapping(HttpServletRequest req, JSONObject json);

    /**
     * Get a specific mapping for a user.
     *
     * @param req HTTP request containing mapping ID parameter
     * @param username Username who owns the mapping
     * @return Mapping as JSONObject, or null if not found
     */
    JSONObject getMapping(HttpServletRequest req, String username);

    /**
     * Get a public mapping by ID.
     *
     * @param req HTTP request containing mapping ID parameter
     * @return Public mapping as JSONObject, or null if not found
     */
    JSONObject getPublicMapping(HttpServletRequest req);

    /**
     * Query public mappings by criteria.
     *
     * @param models Comma-separated list of model names to filter by (can be null)
     * @param types Comma-separated list of types to filter by (can be null)
     * @param vodmlrefs Comma-separated list of VODML references to filter by (can be null)
     * @param fields Field names to include in results (projection)
     * @return List of matching mappings as JSONObjects
     */
    List<JSONObject> queryPublicMappings(String models, String types, String vodmlrefs, String[] fields);

    /**
     * Publish a user's private mapping to the public registry.
     *
     * @param req HTTP request containing user context
     * @param params Parameters including mapping ID, label, annotation
     * @return Result of the publish operation
     */
    JSONObject publishUserMapping(HttpServletRequest req, JSONObject params);

    /**
     * Remove a user's private mapping.
     *
     * @param req HTTP request containing user context
     * @param params Parameters including mapping ID
     * @return Result of the removal operation
     */
    JSONObject removeUserMapping(HttpServletRequest req, JSONObject params);

    /**
     * Deregister (unpublish) a public mapping.
     *
     * @param req HTTP request containing user context
     * @param params Parameters including mapping ID
     * @return Result of the deregistration operation
     */
    JSONObject deregisterPublicMapping(HttpServletRequest req, JSONObject params);

    // ========================================================================
    // File Storage Operations
    // ========================================================================

    /**
     * Store an uploaded file for a user.
     *
     * @param request HTTP request containing user context
     * @param fi FileItem from multipart upload
     * @throws IOException if file cannot be stored
     */
    void putFile(HttpServletRequest request, FileItem fi) throws IOException;

    /**
     * Store a file from a URL.
     *
     * @param collectionOrTable Collection/table name for file storage
     * @param name File name
     * @param url URL to fetch file content from
     * @param contentType MIME type of the file
     * @return true if file was stored successfully
     * @throws IOException if file cannot be fetched or stored
     */
    boolean putFile(String collectionOrTable, String name, URL url, String contentType) throws IOException;

    /**
     * Delete a user's file.
     *
     * @param request HTTP request containing user context
     * @param name File name to delete
     * @return true if file was deleted
     * @throws IOException if file cannot be deleted
     */
    boolean deleteFile(HttpServletRequest request, String name) throws IOException;

    /**
     * List all files for a user.
     *
     * @param request HTTP request containing user context
     * @return JSONArray of file metadata (name, size, etc.)
     */
    JSONArray getFiles(HttpServletRequest request);
}
