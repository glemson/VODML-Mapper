package net.ivoa.dm.vodml.mapper;

import org.bson.Document;

import com.mongodb.MongoClient;
import com.mongodb.MongoClientURI;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;

public class MongoMain {

	public static void main(String[] args) throws Exception{
		String host=args[0];
		int port = Integer.parseInt(args[1]);
		String user ="vodmlmapper";
		String pwd = "3f84yeqwilneik3wcenqwa";
		String uri = String.format("mongodb://%s:%s@%s:%d/vodmlmapper", user,pwd,host,port);
		MongoClientURI muri = new MongoClientURI(uri);
		MongoClient client = new MongoClient(muri);		
//		for(String s : client.listDatabaseNames()) {
//			System.out.println(s);
//		}
		MongoDatabase db = client.getDatabase("vodmlmapper");
		for(String s : db.listCollectionNames()) {
			System.out.println(s);
		}
		MongoCollection<Document> coll = db.getCollection("public.mappings");
		System.out.printf("Found %d documents\n",coll.count());
		client.close();
		
	}
}
