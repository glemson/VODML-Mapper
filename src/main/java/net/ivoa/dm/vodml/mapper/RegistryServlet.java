package net.ivoa.dm.vodml.mapper;

import java.io.*;
import java.net.URL;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import javax.imageio.ImageIO;
import jakarta.servlet.ServletConfig;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletOutputStream;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.xml.bind.JAXB;

import org.apache.commons.fileupload2.core.DiskFileItemFactory;
import org.apache.commons.fileupload2.core.FileItem;
import org.apache.commons.fileupload2.core.FileUploadException;
import org.apache.commons.fileupload2.jakarta.servlet6.JakartaServletFileUpload;
import org.apache.commons.io.IOUtils;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.ivoa.votable.jaxb.VOTABLE;

// MongoDB imports only needed for listUserMappings method that uses MongoDB-specific operations
import org.bson.Document;
import com.mongodb.BasicDBObject;
import com.mongodb.Block;
import com.mongodb.client.MongoCollection;

public class RegistryServlet extends HttpServlet {

	// private static final long serialVersionUID = 1L;
	private static final Logger logger = LogManager.getLogger(RegistryServlet.class);


	private static final String ROOT_PATH = "registry";
	public DatabaseHelper getMongoHelper() {
		return databaseHelper;
	}


	private static final String PRIVATE_PATH = ROOT_PATH+"_private";
	private static final String PUBLIC_PATH = ROOT_PATH;

	public static final String UPLOAD_PREFIX = "UPLOAD:";

	private DatabaseHelper databaseHelper;
	public static final String LOAD_VOTABLE = "loadVOTable"; // from URL

	// State management actions
	public static final String SAVE_STATE = "SAVESTATE";
	public static final String LIST_STATES = "LISTSTATES";
	public static final String QUERY_MAPPINGS = "QUERY_MAPPINGS";
	public static final String REMOVE_STATE = "REMOVESTATE";
	public static final String DEREGISTERPUBLICMAPPING = "DEREGISTERPUBLICMAPPING";
	public static final String PUBLISH_MAPPING = "PUBLISH_MAPPING";
	public static final String FIND_MAPPING = "FIND_MAPPING";

	@Override
	public void init(ServletConfig config) {
		try {
			String host = config.getServletContext().getInitParameter("host");
			int port = Integer.parseInt(config.getServletContext().getInitParameter("port"));
			String user = config.getServletContext().getInitParameter("user");
			String pwd = config.getServletContext().getInitParameter("mongodpwd");
			String database = config.getServletContext().getInitParameter("database");
			databaseHelper = SQLServerDBHelper.getInstance(host, port, user, pwd, database);
		} catch (Exception e) {
			e.printStackTrace();
			databaseHelper = null;
		}
	}

	/**
	 * @see HttpServlet#doGet(HttpServletRequest request, HttpServletResponse
	 *      response)
	 * 
	 */
	@Override
	protected void doGet(HttpServletRequest request,
			HttpServletResponse response) throws ServletException, IOException {
		String action = request.getParameter("action");
		String user = request.getRemoteUser();
        if(user == null)
	        logger.info(String.format("Anonymous user is attempting action '%s'", action));
        else
        	logger.info(String.format("User '%s' is attempting action '%s'", user,action));
        
		if (request.getParameter(LIST_STATES) != null) {
			listUserMappings(request, response);
		} else if (QUERY_MAPPINGS.equals(action)) {
			queryPublicMappings(request, response);
		} else if (FIND_MAPPING.equals(action)) {
			findMapping(request, response);
		} else if (LOAD_VOTABLE.equals(action)) {
			try {
				loadVOTable(request, response);
			} catch (Exception e) {
				throw new ServletException(e);
			}
		} else {
	        logger.error(String.format("Error requesting unknown action '%s'", action));
			PrintWriter w = response.getWriter();
			w.write("{\"error\":\"do a post or give proper action parameter\"}");
		}
	}

	/**
	 * 
	 */
	private String getRequestUser(HttpServletRequest request) {
		String user=request.getRemoteUser();
		return user != null?user.trim():null;
	}
	
	
	/**
	 * @see HttpServlet#doPost(HttpServletRequest request, HttpServletResponse
	 *      response)
	 * 
	 */
	@SuppressWarnings("unchecked")
	@Override
	protected void doPost(HttpServletRequest request,
			HttpServletResponse response) throws ServletException, IOException {

		if (!JakartaServletFileUpload.isMultipartContent(request)) {
			// assume JSON string passed in
			StringBuffer jb = new StringBuffer();
			String line = null;
			try {
				BufferedReader reader = request.getReader();
				while ((line = reader.readLine()) != null)
					jb.append(line);
				String sjb = jb.toString();
				JSONObject jsonObject = new JSONObject(sjb);

				String action = jsonObject.getString("action");
				if (SAVE_STATE.equals(action)) {
					saveState(jsonObject, request, response);
				} else if (REMOVE_STATE.equals(action))
					removeState(jsonObject, request, response);
				else if (DEREGISTERPUBLICMAPPING.equals(action))
					deregisterPublicMapping(jsonObject, request, response);
				else if (PUBLISH_MAPPING.equals(action))
					publishMapping(jsonObject, request, response);
			} catch (JSONException e) {
				// crash and burn
				JSONObject error = new JSONObject();
				error.append("error",e.getMessage());
				PrintWriter w = response.getWriter();
				w.print(error.toString());
			}
		} else { // TODO put in separate method
			File userpath = UploadHelper.getUserSpecificPath(request);

			JakartaServletFileUpload uploadHandler = new JakartaServletFileUpload(DiskFileItemFactory.builder().get());
			PrintWriter writer = response.getWriter();
			response.setContentType("application/json");

			JSONObject json = new JSONObject();
			JSONArray jsona = new JSONArray();
			try {
				List<FileItem> items = uploadHandler.parseRequest(request);
				for (FileItem item : items) {
					if (!item.isFormField()) {
						databaseHelper.putFile(request, item);
						// putFile(request, item);

						JSONObject jsono = new JSONObject();
						jsono.put("name", item.getName());
						jsono.put("size", item.getSize());
						jsono.put("url",
								ROOT_PATH + "?getfile=" + item.getName());
						// jsono.put("thumbnail_url", UPLOAD_PATH+"?getthumb=" +
						// item.getName());
						jsono.put("delete_url", ROOT_PATH + "?delfile="
								+ item.getName());
						jsono.put("delete_type", "GET");
						jsona.put(jsono);
					}
				}
				json.put("files", jsona);
			} catch (FileUploadException e) {
				throw new RuntimeException(e);
			} catch (Exception e) {
				throw new RuntimeException(e);
			} finally {
				writer.write(json.toString());
				writer.close();
			}
		}

	}

//	private void putFile(HttpServletRequest request, FileItem item)
//			throws Exception {
//		File file = UploadHelper.getUserFile(item.getName(), request);
//		if (file == null)
//			return;
//		item.write(file);
//	}

	private void listFiles(HttpServletRequest req, HttpServletResponse resp)
			throws IOException {

		JSONObject json = new JSONObject();
		JSONArray jsona = databaseHelper.getFiles(req);
		for (int i = 0; i < jsona.length(); i++) {
			JSONObject jsono = jsona.getJSONObject(i);
			jsono.put("url", ROOT_PATH + "?getfile=" + jsono.get("name"));
			jsono.put("delete_url",
					ROOT_PATH + "?delfile=" + jsono.get("name"));
			jsono.put("delete_type", "GET");
		}
		json.put("files", jsona);
		PrintWriter writer = resp.getWriter();
		resp.setContentType("application/json");
		writer.write(json.toString());
		writer.close();
	}

	private JSONArray getFiles(HttpServletRequest request) {
		File[] files = UploadHelper.getUserSpecificPath(request).listFiles(
				new FilenameFilter() {
					@Override
					public boolean accept(File dir, String name) {
						// TODO Auto-generated method stub
						return !"__STATE__".equals(name);
					}
				});
		JSONArray jsona = new JSONArray();
		for (File file : files) {
			JSONObject jsono = new JSONObject();
			jsono.put("name", file.getName());
			jsono.put("size", file.length());
			jsona.put(jsono);
		}
		return jsona;
	}

	private boolean deleteFile(HttpServletRequest request, String name)
			throws IOException {
		File file = UploadHelper.getUserFile(name, request);
		if (file != null && file.exists()) {
			return file.delete();
		}
		return false;
	}

	private void getFile(HttpServletRequest request,
			HttpServletResponse response, String name) throws IOException {
		File file = UploadHelper.getUserFile(name, request);
		if (file != null && file.exists()) {
			int bytes = 0;
			ServletOutputStream op = response.getOutputStream();

			response.setContentType(getMimeType(file));
			response.setContentLength((int) file.length());
			response.setHeader("Content-Disposition", "inline; filename=\""
					+ file.getName() + "\"");

			byte[] bbuf = new byte[1024];
			DataInputStream in = new DataInputStream(new FileInputStream(file));

			while ((in != null) && ((bytes = in.read(bbuf)) != -1)) {
				op.write(bbuf, 0, bytes);
			}

			in.close();
			op.flush();
			op.close();
		}
	}

	private String getMimeType(File file) {
		String mimetype = "";
		if (file.exists()) {
			try {
				// Use Java NIO Files.probeContentType() - built-in since Java 7
				mimetype = java.nio.file.Files.probeContentType(file.toPath());

				// Fallback for common types if probeContentType returns null
				if (mimetype == null || mimetype.isEmpty()) {
					mimetype = getMimeTypeFromExtension(file.getName());
				}
			} catch (java.io.IOException e) {
				// If probeContentType fails, use fallback based on extension
				mimetype = getMimeTypeFromExtension(file.getName());
			}
		}
		System.out.println("mimetype: " + mimetype);
		return mimetype;
	}

	private String getMimeTypeFromExtension(String filename) {
		String suffix = getSuffix(filename).toLowerCase();
		switch (suffix) {
			case "png":
				return "image/png";
			case "jpg":
			case "jpeg":
				return "image/jpeg";
			case "gif":
				return "image/gif";
			case "xml":
				return "application/xml";
			case "json":
				return "application/json";
			case "txt":
				return "text/plain";
			case "html":
			case "htm":
				return "text/html";
			default:
				return "application/octet-stream";
		}
	}

	private String getSuffix(String filename) {
		String suffix = "";
		int pos = filename.lastIndexOf('.');
		if (pos > 0 && pos < filename.length() - 1) {
			suffix = filename.substring(pos + 1);
		}
		System.out.println("suffix: " + suffix);
		return suffix;
	}

	private void removeState(JSONObject state, HttpServletRequest req,
			HttpServletResponse resp) throws IOException {
		JSONObject result = databaseHelper.removeUserMapping(req, state);
		resp.getWriter().write(result.toString());
	}
	private void deregisterPublicMapping(JSONObject state, HttpServletRequest req,
			HttpServletResponse resp) throws IOException {
		JSONObject result = databaseHelper.deregisterPublicMapping(req, state);
		resp.getWriter().write(result.toString());
	}
	private void publishMapping(JSONObject state, HttpServletRequest req,
			HttpServletResponse resp) throws IOException {
		JSONObject result = databaseHelper.publishUserMapping(req, state);
		resp.getWriter().write(result.toString());
	}

	private void saveState(JSONObject json, HttpServletRequest req,
			HttpServletResponse resp) throws IOException {
		try {
			JSONObject result = databaseHelper.saveUserMapping(req, json);
			resp.getWriter().write(result.toString());
		} catch (IOException t) {
			logger.error("Error saving mapping:"+t.getMessage());
			throw t;
		}
	}

	/**
	 * Return a all mappings for a given user.
	 * 
	 * @param req
	 * @param resp
	 * @throws IOException
	 */
	private void listUserMappings(HttpServletRequest req, HttpServletResponse resp)
			throws IOException {
    String user = req.getRemoteUser();
    JSONObject json = databaseHelper.listUserMappings(user);
    json.write(resp.getWriter());
	}
	/**
	 * Return a state
	 * 
	 * @param req
	 * @param resp
	 * @throws IOException
	 */
	private void queryPublicMappings(HttpServletRequest req, HttpServletResponse resp)
			throws IOException {
		String _models = req.getParameter("models");
		String _types = req.getParameter("types");
		String _vodmlrefs = req.getParameter("vodmlrefs");
		String[] _projection = new String[]{"_id","owner","publicationTime","label","annotation"};
		final JSONArray ja = new JSONArray();
		List<JSONObject> results = databaseHelper.queryPublicMappings(_models, _types, _vodmlrefs, _projection);
		for (JSONObject mapping : results) {
			ja.put(mapping);
		}
		PrintWriter pw = resp.getWriter();
		pw.print(ja.toString());
	}
	
	
	private void findMapping(HttpServletRequest req, HttpServletResponse resp)
			throws IOException {
		JSONObject map = databaseHelper.getMapping(req,getRequestUser(req));

		PrintWriter w = resp.getWriter();
		if(map != null)
		{
			w.print("{\"result\":\"ok\",\"map\":");
			w.print(map.toString(2));
			w.print("}");
		}
		else
			w.print("{\"result\":\"error\",\"message\":\"No map found for id\"}");
	}


	private void loadVOTable(HttpServletRequest req, HttpServletResponse resp)
			throws Exception {
		OutputStream out = resp.getOutputStream();
		String url = req.getParameter("url");
//		VOTABLE votable;
//		votable = VOTABLE_JAXBHelper.jaxb.parseVOTABLE(new URL(url), false);
//		JAXB.marshal(votable, out);
		URL _url = new URL(url);
		InputStream in = _url.openStream();
		IOUtils.copy(in, out);
		in.close();
	}

}
