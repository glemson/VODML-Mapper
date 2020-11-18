package net.ivoa.dm.vodml.mapper;

import java.io.ByteArrayInputStream;
import java.io.DataInputStream;
import java.io.IOException;
import java.net.URL;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.Random;
import java.util.UUID;

import javax.servlet.ServletOutputStream;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.fileupload.FileItem;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.bson.BSON;
import org.bson.BsonString;
import org.bson.Document;
import org.bson.conversions.Bson;
import org.bson.types.ObjectId;

import org.ivoa.vodml.RemoteVODMLRegistry;
import org.ivoa.vodml.VODMLRegistry;
import org.ivoa.vodml.VODML_JAXBHelper;
import org.ivoa.vodml.jaxb.Model;
import org.ivoa.vodml.jaxb.Models.Modellocation;
import org.json.JSONArray;
import org.json.JSONObject;

import com.mongodb.BasicDBObject;
import com.mongodb.Block;
import com.mongodb.DBCursor;
import com.mongodb.DBObject;
import com.mongodb.Mongo;
import com.mongodb.MongoClient;
import com.mongodb.MongoClientURI;
import com.mongodb.MongoCredential;
import com.mongodb.ServerAddress;
import com.mongodb.WriteConcern;
import com.mongodb.WriteResult;
import com.mongodb.client.FindIterable;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.gridfs.GridFSBucket;
import com.mongodb.client.gridfs.GridFSBuckets;
import com.mongodb.client.gridfs.GridFSDownloadStream;
import com.mongodb.client.gridfs.model.GridFSFile;
import com.mongodb.client.gridfs.model.GridFSUploadOptions;
import static com.mongodb.client.model.Filters.*;
import com.mongodb.client.model.Projections;
import com.mongodb.client.result.DeleteResult;
import com.mongodb.gridfs.GridFS;
import com.mongodb.gridfs.GridFSDBFile;
import com.mongodb.gridfs.GridFSInputFile;
import com.mongodb.util.JSON;

public class MongoDBHelper363 implements VODMLRegistry{
	private static final Logger logger = LogManager.getLogger(MongoDBHelper363.class);

	private static MongoDBHelper363 instance;
	protected static synchronized MongoDBHelper363 getInstance(String host, int port) throws Exception
	{
		if(instance == null)
			instance = new MongoDBHelper363(host, port);
		else if(!instance.host.equals(host) || instance.port != port)
			throw new Exception("A MongoDBHelper was already initialized with different parameters");
		return instance;
	}
	protected static synchronized MongoDBHelper363 getInstance(String host, int port, String user, String pwd, String database) throws Exception
	{
		if(instance == null)
			instance = new MongoDBHelper363(host, port, user, pwd, database);
		else if(!instance.host.equals(host) || instance.port != port)
			throw new Exception("A MongoDBHelper was already initialized with different parameters");
		return instance;
	}
	private String host, user, pwd;
	private int port;
	private MongoClient mongo;
	private MongoDatabase mongoDB;
	private Random random = new Random();
	/** fallback remote registry in case a model does not exist in DB */ 
	private RemoteVODMLRegistry urlReg; 
	/** name of collection with IVOA models */
	public static final String IVOA_MODELS_COLLECTION = "ivoa_models"; // TODO tbd if should be made configurable
	public static final String USERS_COLLECTION = "users"; // TODO tbd if should be made configurable
	
	private MongoDBHelper363(String host, int port) throws Exception {
		this.host = host;
		this.port = port;
		this.mongo = new MongoClient(host, port);
		this.mongoDB = this.mongo.getDatabase("vodmlmapper");
		this.urlReg = new RemoteVODMLRegistry();
	}
	
	private MongoDBHelper363(String host, int port, String user, String pwd, String database) throws Exception {
		this.host = host;
		this.port = port;
		this.user = user;
		this.pwd = pwd;
		String uri = String.format("mongodb://%s:%s@%s:%d/%s", user,pwd,host,port,database);
		MongoClientURI muri = new MongoClientURI(uri);
		this.mongo = new MongoClient(muri);		
		this.mongoDB = this.mongo.getDatabase(database);
		this.urlReg = new RemoteVODMLRegistry();
	}

	/**
	 * User collection is username
	 * 
	 * @param req
	 * @return
	 */
	public MongoCollection<Document> getUserCollectionName(HttpServletRequest req) {
		return getUserDocumentCollection(req.getRemoteUser());
	}
	public MongoCollection<Document> getUserDocumentCollection(String name) {
		return mongoDB.getCollection(name);
	}
	public MongoCollection<Document> getUsersCollection() {
		MongoCollection<Document> col = mongoDB.getCollection(MongoDBHelper363.USERS_COLLECTION);
		if( col == null) {
			mongoDB.createCollection(MongoDBHelper363.USERS_COLLECTION);
		}
		return mongoDB.getCollection(MongoDBHelper363.USERS_COLLECTION);
	}

	public MongoCollection<Document> getIVOAModelsCollection(){
		MongoCollection<Document> col = mongoDB.getCollection(IVOA_MODELS_COLLECTION);
		return col;
	}
	public MongoCollection<Document> getIVOAModelFiles(){
		MongoCollection<Document> col = mongoDB.getCollection(IVOA_MODELS_COLLECTION);
		return col;
	}
	/**
	 * Load a model  in MongoDB with gven name and one or more urls that all should represent the same model.
	 * This allows one to recognize different locations and infer they're the same model.
	 * Particularly e.g. for https://... and http://.. with same suffix.
	 * 
	 * @param name
	 * @param urls
	 * @param docURL
	 * @return
	 * @throws Exception
	 */
	public Model addModel(String name,String[] urls,String docURL) throws Exception {
		// TODO Auto-generated method stub
		Model m = VODML_JAXBHelper.jaxb.parseVODML(new URL(urls[0]).openStream());

		Document obj = new Document();
		obj.put("name",name);
		MongoCollection<Document> col = getIVOAModelsCollection();
		GridFSBucket fs = getModelFiles();
		Document o = col.findOneAndDelete(obj);
		if(o != null){
			fs.delete(new BsonString(name));
		}
		obj.put("vodml-url",urls);
		if(docURL != null)
			obj.put("documentation-url",docURL);
		col.insertOne(obj);
		String smodel = VODML_JAXBHelper.jaxb.marshall(m);
		ObjectId f = fs.uploadFromStream(name,new ByteArrayInputStream(smodel.getBytes()));  // TODO should S
		
		return m;
	}

	/**
	 * User states collection is username.states
	 * 
	 * @param req
	 * @return
	 */
	public MongoCollection<Document> getUserMappings(HttpServletRequest req) {
		return getUserMappings(req.getRemoteUser() );
	}
	public MongoCollection<Document> getUserMappings(String username) {
		return mongoDB.getCollection(username + ".states");
	}
	
	public MongoCollection<Document> getPublicMappings() {
		return mongoDB.getCollection("public.mappings");
	}
	public Document getMapping(HttpServletRequest req, String user){
		String id = req.getParameter("_id");
		MongoCollection<Document> c = getPublicMappings();
		Document d = getMapping(c,id);
		
		if(d == null && user != null)
		{
			c = getUserMappings(user);
			d = getMapping(c, id);
		}
		return d;
	}
	private Document getMapping(MongoCollection<Document> collection, String _id){
		if(collection == null)
			return null;
		BasicDBObject query = new BasicDBObject();
		query.put("_id", new ObjectId(_id));

		Document map = collection.find(query).first();
		return map;
	}
	public Document getPublicMapping(HttpServletRequest req){
		MongoCollection<Document> c;
		c = getPublicMappings();
		String id = req.getParameter("_id");
		BasicDBObject query = new BasicDBObject();
		query.put("_id", new ObjectId(id));

		Document map = c.find(query).first();
		return map;
	}
	public FindIterable<Document> queryPublicMappings(String _models, String _types, String _vodmlrefs, String[] fields){
		
		Bson query = exists("models"); // default initializer

		if(_models != null && _models.trim().length() > 0){
			String[] models = _models.split("[ ]+");
			query=and(query,in("models.name",models));
		}
		if(_types != null && _types.trim().length() > 0){
			String[] types = _types.split("[ ]+");
			query=and(query,in("mapper.objects.vodmlref",types));
		}

		if(_vodmlrefs != null && _vodmlrefs.trim().length() > 0) {
			String[] vodmlrefs = _vodmlrefs.split("[ ]+");
			query=and(query, or(in("mapper.maps.from.role.vodmlref",vodmlrefs),in("mapper.objects.vodmlref",vodmlrefs)));
		}

		MongoCollection<Document> c = getPublicMappings();
		return c.find(query).projection(Projections.include(fields));
	}

	/**
	 * User states collection is username.states
	 * 
	 * @param req
	 * @return
	 */
	public GridFSBucket getUserFiles(HttpServletRequest req) {
		return GridFSBuckets.create(mongoDB, req.getRemoteUser() + ".fs");
	}
	public GridFSBucket getModelFiles() {
		return GridFSBuckets.create(mongoDB, IVOA_MODELS_COLLECTION + ".fs");
	}

	private String currentTime() {
		SimpleDateFormat f = new SimpleDateFormat("yyyyMMdd-HHmmss.sss");
		return f.format(new Date());
	}

	private String randomLabel() {
		return new UUID(random.nextLong(), random.nextLong()).toString();
	}

	/**
	 * Return JSONObject with result (ok or error) and label fo new state or
	 * error message
	 */
	public JSONObject saveUserMapping(HttpServletRequest req, JSONObject json) {

		MongoCollection<Document> col = getUserMappings(req);

		JSONObject state = json.getJSONObject("state");

		Document dbObject = Document.parse(state.toString());
		// add
		String insertTime = currentTime();
		dbObject.put("insertTime", insertTime);

		String ann = json.optString("annotation");
		if (ann != null && ann.trim().length() > 0)
			dbObject.put("annotation", ann);

		String label = json.optString("label");
		if (label == null || label.trim().length() == 0)
			label = randomLabel();
		dbObject.put("label", label);

		logger.info(String.format("Trying to save state with label '%s' for user '%s'",label,req.getRemoteUser()));
		String id = json.optString("_id");
		
		if (id != null && id.trim().length() > 0) {
			BasicDBObject query = new BasicDBObject();
			query.put("_id", new ObjectId(id));

			Document r = col.findOneAndDelete(query);
		} 
		col.insertOne(dbObject);
		String newstate = dbObject.toJson();
		JSONObject jstate = new JSONObject(newstate);

		JSONObject result = new JSONObject();
		result.put("result", "ok");
		result.put("label", label);
		result.put("insertTime", insertTime);
		result.put("state",jstate);
		return result;
	}

	/**
	 * Publish a mapping identified by its _id by moving it from the user's
	 * collection of mappings to the public collection.
	 */
	public JSONObject publishUserMapping(HttpServletRequest req,
			JSONObject state) {
		JSONObject result = new JSONObject();
		JSONObject insert = new JSONObject();
		result.put("insert", insert);
		try {
			String id = state.getString("_id");
			String keep = state.getString("keep");
			MongoCollection<Document> userCol = getUserMappings(req);
			BasicDBObject query = new BasicDBObject();
			query.put("_id", new ObjectId(id));
			Document map = userCol.find(query).first();
			MongoCollection<Document> pubCol = getPublicMappings();

			map.put("owner", req.getRemoteUser());
			map.put("publicationTime", currentTime());
			pubCol.insertOne(map);
			insert.put("result", "ok");
			
			if ("false".equals(keep)) {
				JSONObject remove = new JSONObject();
				result.put("remove", remove);
				DeleteResult dr = userCol.deleteOne(query);
				if (dr.getDeletedCount() == 1)
					remove.put("result", "ok");
				else {
					remove.put("result", "error");
					remove.put("error", "unable to delete user mapping");
				}
			} else {
				result.put("remove", "no");
			}
			result.put("result", "ok");
		} catch (Exception e) {
			result.put("result", "error");
			result.put("error", "INTERNAL ERROR: " + e.getMessage());
		}
		return result;
	}

	/**
	 * Remove a mapping identified by its _id from the user's collection of
	 * mappings.
	 */
	public JSONObject removeUserMapping(HttpServletRequest req, JSONObject state) {
		JSONObject result = new JSONObject();
		try {
			String id = state.getString("_id");
			MongoCollection<Document> col = getUserMappings(req);
			BasicDBObject query = new BasicDBObject();
			query.put("_id", new ObjectId(id));

			Document r = col.findOneAndDelete(query);
			if (r != null)
				result.put("result", "ok");
			else {
				result.put("result", "error");
				result.put("error", "No document found for _id="+id);
			}
		} catch (Exception e) {
			result.put("result", "error");
			result.put("error", "INTERNAL ERROR: " + e.getMessage());
		}
		return result;
	}

	public boolean removeModel(String name) {
		try {
			MongoCollection<Document> col = getIVOAModelsCollection();
			BasicDBObject query = new BasicDBObject();
			query.put("name",name);
			Document result = col.findOneAndDelete(query);
			
		} catch (Exception e) {
			return false;
		}
		return true;
	}

	
	public JSONObject deregisterPublicMapping(HttpServletRequest req, JSONObject state) {
		JSONObject result = new JSONObject();
		try {
			String id = state.getString("_id");
			MongoCollection<Document> col = getPublicMappings();
			BasicDBObject query = new BasicDBObject();
			query.put("_id", new ObjectId(id));
			query.put("owner", req.getRemoteUser());
			Document map = col.findOneAndDelete(query);
			if(map != null) {
				result.put("result", "ok");
			}else {
				result.put("result","error");
				result.put("error","Can not find public map owned by user with specified _id");
			}
		} catch (Exception e) {
			result.put("result", "error");
			result.put("error", e.getMessage());
		}
		return result;
	}
	
	public void putFile(HttpServletRequest request, FileItem fi)
			throws IOException {
		GridFSBucket fs = getUserFiles(request);
		GridFSUploadOptions options = new GridFSUploadOptions()
                .chunkSizeBytes(358400)
                .metadata(new Document("name", fi.getName()).append("contentType", fi.getContentType()));
		ObjectId f = fs.uploadFromStream(fi.getName(),fi.getInputStream(),options);
	}

	/**
	 * Code to add file to MongoDB from remote URL.
	 * @param name
	 * @param file
	 * @return
	 */
	public boolean putFile(String collectionName, String name, URL url, String contentType ) throws IOException
	{
		GridFSBucket fs = GridFSBuckets.create(mongoDB, collectionName+".fs");
		GridFSUploadOptions options = new GridFSUploadOptions()
                  .chunkSizeBytes(358400)
                  .metadata(new Document("name", name).append("url", url.toString()).append("contentType", contentType));
		ObjectId fileId = fs.uploadFromStream(name, url.openStream(), options);
		return true;
	}
	
	public boolean deleteFile(HttpServletRequest request, String name)
			throws IOException {
		GridFSBucket fs = getUserFiles(request);
		fs.delete(new BsonString(name));
		return true;
	}

	public JSONArray getFiles(HttpServletRequest request) {
		GridFSBucket fs = getUserFiles(request);
		final JSONArray jsona = new JSONArray();
		fs.find().forEach(new Block<GridFSFile>() {
			@Override
		    public void apply(final GridFSFile file) {
			String name = file.getFilename();
			JSONObject jsono = new JSONObject();
			jsono.put("name", name);
			jsono.put("_id", file.getId());
			jsono.put("size", file.getLength());
			jsono.put("delete_type", "GET");
			jsona.put(jsono);
		}});
		return jsona;
	}

	public MongoClient getMongo() {
		return mongo;
	}

	public MongoDatabase getMongoDB() {
		return mongoDB;
	}

	@Override
	public Modellocation openModel(String name, String url) throws Exception {
		// TODO Auto-generated method stub
		MongoCollection<Document> models = getIVOAModelsCollection();
		Document model =  models.find(new BasicDBObject("name",name)).first();
		Modellocation ml = null; 
		if(model == null) {
			ml = urlReg.openModel(name, url);
			// TODO save in registry!
		}
		if(model != null) {
			GridFSBucket fs = GridFSBuckets.create(mongoDB, IVOA_MODELS_COLLECTION + ".fs");
			GridFSDownloadStream file = fs.openDownloadStream((String)model.get("name"));
			if(file != null) {
				Model m = VODML_JAXBHelper.jaxb.parseVODML(file);
				if(m != null) {
					ml = new Modellocation();
					ml.setName(name);
					ml.setLocation(url);
					ml.setModel(m);
				}
				// TBD if something is wrong here the state of the MOngoDB is bad and should be fixed
			}
		} 
		
		return ml;
	}

	@Override
	public JSONObject defaultModels() throws Exception {
		// TODO Auto-generated method stub
		return urlReg.defaultModels();
	}
}
