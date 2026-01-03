package net.ivoa.dm.vodml.mapper;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.PrintWriter;
import java.net.URL;
import java.util.Hashtable;

import jakarta.servlet.ServletConfig;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.xml.bind.JAXB;

import org.bson.Document;
import org.ivoa.vodml.RemoteVODMLRegistry;
import org.ivoa.vodml.VODMLManager;
import org.ivoa.vodml.VODMLRegistry;
import org.ivoa.vodml.jaxb.Models;
import org.ivoa.vodml.jaxb.Models.Modellocation;
import org.ivoa.vodml.mapper.jaxb.TAPSCHEMA;
import org.ivoa.vodml.mapper.jaxb.TAPTABLE;
import org.ivoa.votable.jaxb.VOTABLE;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import com.mongodb.Block;
import org.apache.logging.log4j.Logger;
import org.apache.commons.io.IOUtils;
import org.apache.logging.log4j.LogManager;

public class VODMLMapperServlet extends HttpServlet {
	/**
	 * 
	 */
	private static final long serialVersionUID = 1822129616521007363L;
	private static final Logger logger = LogManager.getLogger(VODMLMapperServlet.class);

	private MongoDBHelper363 mongoHelper;
	private VODMLRegistry vodmlRegistry;

	public static final String ACTION = "action";
	public static final String LIST_IVOA_MODELS = "listIVOAModels";
	public static final String LOAD_VODML = "loadVO-DML";
	public static final String FIND_MAPPING = "FIND_MAPPING";
	public static final String QUERY_MAPPINGS = "QUERY_MAPPINGS";
	public static final String LOAD_VOSI_TABLESET = "loadTableSet";
	public static final String TAP_schemas = "TAP_schemas";
	public static final String TAP_tables = "TAP_tables";
	public static final String TAP_columns = "TAP_columns";
	public static final String LOAD_VIZIER = "loadVizieR"; // from URL
	public static final String LOAD_SCS = "loadSCS"; // from URL
	public static final String PING = "ping"; // from URL
	
	@Override
	public void init(ServletConfig config) {
		String mongoHost = "not-set";
		int mongoPort = -1;
		String mongoUser = "unknown";
		String mongoDatabase = "not-set"; 
		try {
			mongoHost = config.getServletContext().getInitParameter("mongodb-host");
			mongoPort = Integer.parseInt(config.getServletContext().getInitParameter("mongodb-port"));
			mongoUser = config.getServletContext().getInitParameter("mongodb-user");
			String mongoPwd = config.getServletContext().getInitParameter("mongodb-pwd");
			mongoDatabase = config.getServletContext().getInitParameter("mongodb-database");
			
			// 
			logger.info(String.format("Connecting to MongoDB '%s' at '%s:%d' as user '%s'",mongoDatabase, mongoHost,mongoPort, mongoUser));

			mongoHelper = MongoDBHelper363.getInstance(mongoHost, mongoPort, mongoUser, mongoPwd, mongoDatabase);
			vodmlRegistry = new RemoteVODMLRegistry();
		} catch (Exception e) {
			logger.error(String.format("Error connecting to MongoDB '%s' at '%s:%d' as user '%s'",mongoDatabase,mongoHost,mongoPort, mongoUser));
			e.printStackTrace();
			mongoHelper = null;
		}
	}

	@Override
	protected void doGet(HttpServletRequest req, HttpServletResponse resp)
			throws ServletException, IOException {
		// TODO Auto-generated method stub
		try {
			String action = req.getParameter(ACTION);
            
			// TESTING
			String user = req.getRemoteUser();
            if(user == null)
    	        logger.info(String.format("Anonymous user is attempting action '%s'", action));
            else
            	logger.info(String.format("User '%s' is attempting action '%s'", user,action));

	        
	        if (PING.equals(action))
				ping(req, resp);
			else if (LOAD_VODML.equals(action))
				loadVODML(req, resp);
			else if (LOAD_VOSI_TABLESET.equals(action))
				loadVODML(req, resp);
			else if (TAP_schemas.equals(action))
				getTAP_schemas(req, resp);
			else if (TAP_tables.equals(action))
				getTAP_tables(req, resp);
			else if (TAP_columns.equals(action))
				getTAP_Columns(req, resp);
			else if(LOAD_VIZIER.equals(action))
				loadVizieR(req, resp);
			else if(LOAD_SCS.equals(action))
				loadSCS(req, resp);
			else if (QUERY_MAPPINGS.equals(action))
				queryPublicMappings(req, resp);
			else if (FIND_MAPPING.equals(action)) 
				findPublicMapping(req, resp);
			else if (LIST_IVOA_MODELS.equals(action)) 
			 	listIVOAModels(req, resp);
		    else
		    	handleBAD_REQUEST(req, resp);
		} catch (Throwable t) {
			handleError(t, req, resp);
		}
	}

	@Override
	protected void doPost(HttpServletRequest req, HttpServletResponse resp)
			throws ServletException, IOException {
		// TODO Auto-generated method stub

		StringBuffer jb = new StringBuffer();
		String line = null;
		try {
			BufferedReader reader = req.getReader();
			while ((line = reader.readLine()) != null)
				jb.append(line);
			String sjb = jb.toString();
			JSONObject jsonObject = new JSONObject(sjb);

			String action = jsonObject.getString("action");
			if("map2votable".equals(action))
			{
				//
			}
			else
				throw new JSONException("unknown post action "+action);
		} catch (JSONException e) {
			// crash and burn
			String error = "<error>"+e.getMessage()+"</error>";
			PrintWriter w = resp.getWriter();
			w.print(error);
		}

	}

	private void loadVODML(HttpServletRequest req, HttpServletResponse resp)
			throws IOException {
		OutputStream out = resp.getOutputStream();
		String name = req.getParameter("name");
		String url = req.getParameter("url");
		VODMLManager vodml = new VODMLManager(vodmlRegistry,name, url);
		Models models = new Models();
		Hashtable<String, Modellocation> modelDict = new Hashtable<String, Modellocation>();
		for(Modellocation ml : vodml)
		{
			models.getModellocation().add(ml);
			modelDict.put(ml.getLocation(), ml);
		}
		String vodmlurl = req.getParameter("vodmlurl");
		if (vodmlurl != null) {
			vodml = new VODMLManager(vodmlRegistry, "vo-dml", vodmlurl);
			for (Modellocation ml : vodml) {
				String modelURL = ml.getLocation();
				if (modelDict.get(modelURL) != null)
					continue;
				models.getModellocation().add(ml);
			}
		}
		JAXB.marshal(models, out);
	}

	private void listIVOAModels(HttpServletRequest req, HttpServletResponse resp)
			throws Exception {
		JSONObject models = vodmlRegistry.defaultModels();
//		models.write(resp.getWriter());
		PrintWriter w = resp.getWriter();
		String json = models.toString();
		w.write(json);
	}
	private void getTAP_schemas(HttpServletRequest req, HttpServletResponse resp)
			throws Exception {
		OutputStream out = resp.getOutputStream();
		String url = req.getParameter("tap_endpoint");
		TAPSCHEMA sch = new TAPInterpreter().getTAP_schemas(url);
		JAXB.marshal(sch, out);
	}
	private void getTAP_tables(HttpServletRequest req, HttpServletResponse resp)
			throws Exception {
		OutputStream out = resp.getOutputStream();
		String url = req.getParameter("tap_endpoint");
		String schema_name = req.getParameter("schema_name");
		TAPSCHEMA sch = new TAPInterpreter().getTAP_tables(url, schema_name);
		JAXB.marshal(sch, out);
	}

	private void getTAP_Columns(HttpServletRequest req,
			HttpServletResponse resp) throws Exception {
		OutputStream out = resp.getOutputStream();
		String url = req.getParameter("tap_endpoint");
		String tbl = req.getParameter("table_name");
		TAPTABLE tap = new TAPInterpreter().getTAP_columns(url, tbl);
		JAXB.marshal(tap, out);
	}

	private void handleBAD_REQUEST(HttpServletRequest req,
			HttpServletResponse resp) throws IOException {
		// TODO write error message to response, in XML
		resp.sendError(HttpServletResponse.SC_BAD_REQUEST);
	}

	private void handleError(Throwable t, HttpServletRequest req,
			HttpServletResponse resp) throws IOException {
		// TODO write error message to response, in XML
		logger.error(t.getMessage());

		resp.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
				t.getMessage());
	}

	private void loadVizieR(HttpServletRequest req, HttpServletResponse resp)
			throws Exception {
		OutputStream out = resp.getOutputStream();
		String catalogue = req.getParameter("catalogue");
		String url = "http://vizier.u-strasbg.fr/viz-bin/votable?-meta.all&-source="+catalogue;
//		VOTABLE votable = VOTABLE_JAXBHelper.jaxb.parseVOTABLE(new URL(url),
//				false);
//		JAXB.marshal(votable, out);
		URL _url = new URL(url);
		InputStream in = _url.openStream();
		IOUtils.copy(in, out);
		in.close();
	}
	private void loadSCS(HttpServletRequest req, HttpServletResponse resp)
			throws Exception {
		OutputStream out = resp.getOutputStream();
		String scs = req.getParameter("scs");
		String url = scs+"RA=0&DEC=0&SR=0";
		VOTABLE votable = VOTABLE_JAXBHelper.jaxb.parseVOTABLE(new URL(url),false);
		JAXB.marshal(votable, out);
	}
	private void ping(HttpServletRequest req, HttpServletResponse resp)
			throws Exception {
		PrintWriter w = resp.getWriter();
		w.write("<ping>Succes</ping>");
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
		    mongoHelper.queryPublicMappings(_models, _types, _vodmlrefs, _projection).forEach(new Block<Document>() {

				@Override
				public void apply(Document doc) {
					ja.put(new JSONObject(doc.toJson()));
				}
				
			});;
			PrintWriter pw = resp.getWriter();
			pw.print(ja.toString());
	}

	private void findPublicMapping(HttpServletRequest req, HttpServletResponse resp)
			throws IOException {
		Document map = mongoHelper.getPublicMapping(req);

		PrintWriter w = resp.getWriter();
		if(map != null)
		{
			w.print("{\"result\":\"ok\",\"map\":");
			w.print(map.toString());
			w.print("}");
		}
		else
			w.print("{\"result\":\"error\",\"message\":\"No map found for id\"}");
	}

}

