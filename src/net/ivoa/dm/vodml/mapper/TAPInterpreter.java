package net.ivoa.dm.vodml.mapper;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.PrintWriter;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;
import java.net.URLEncoder;
import java.util.ArrayList;

import jakarta.xml.bind.JAXB;

import org.apache.http.HttpEntity;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.utils.URIBuilder;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.ivoa.vodml.mapper.jaxb.Column;
import org.ivoa.vodml.mapper.jaxb.Schema;
import org.ivoa.vodml.mapper.jaxb.TAPSCHEMA;
import org.ivoa.vodml.mapper.jaxb.TAPTABLE;
import org.ivoa.vodml.mapper.jaxb.Table;

import uk.ac.starlink.table.StarTable;
import uk.ac.starlink.table.StarTableFactory;
import uk.ac.starlink.votable.VOTableBuilder;

public class TAPInterpreter {

	abstract class TAPHandler {
		String endpoint;
		abstract void handle(InputStream in) throws Exception;
		abstract String getSQL();		
		TAPHandler(String ep){
			this.endpoint = ep;
		}
		String getEndpoint() {
			return endpoint;
		}
	}
	class RegTapHandler extends TAPHandler {

		private ArrayList<String> tapEndpoints = new ArrayList<String>();
		RegTapHandler(String ep) {
			super(ep);
		}

		@Override
		void handle(InputStream in) throws Exception {
			StarTable votable = new StarTableFactory().makeStarTable(in, new VOTableBuilder());
			for(int i = 0; i < votable.getRowCount(); i++)
			{
				Object[] row = votable.getRow(i);
				int ix = 0;
				String ep = (String)row[ix++];
				this.tapEndpoints.add(ep);
			}
		}

		@Override
		String getSQL() {
			return "SELECT access_url, ivoid FROM rr.capability NATURAL JOIN rr.interface WHERE standard_id like 'ivo://ivoa.net/std/tap' AND intf_type='vs:paramhttp'";
		}
		
	}
	class TableHandler extends TAPHandler{
		TAPSCHEMA tap;
		String currentSchema;
		TableHandler(String ep, String currentSchema) {
			super(ep);
			tap = new TAPSCHEMA();
			tap.setEndpoint(endpoint);		
			this.currentSchema = currentSchema;
		}

		@Override
		void handle(InputStream in) throws Exception {
			StarTable votable = new StarTableFactory().makeStarTable(in, new VOTableBuilder());
			
			Schema currentSchema = null;
			for(int i = 0; i < Math.min(100,votable.getRowCount()); i++)
			{
				Object[] row = votable.getRow(i);
				int ix = 0;
				String schema_name = (String)row[ix++];
				if(currentSchema == null || !schema_name.equals(currentSchema.getSchemaName()))
				{
					currentSchema = new Schema();
					currentSchema.setSchemaName(schema_name);
					tap.getSchema().add(currentSchema);
				}
				Table t = new Table();
				t.setTableName((String)row[ix++]);
				t.setDescription((String)row[ix++]);
				currentSchema.getTable().add(t);
			}

		}

		@Override
		String getSQL() {
			String and = ((currentSchema != null && currentSchema.trim().length() > 0)? String.format(" and schema_name='%s' ",currentSchema):"");
			String sql="select schema_name, table_name, description from TAP_SCHEMA.tables where schema_name != 'TAP_SCHEMA' "
			+ and +  " order by schema_name, table_name";
			return sql;
		}
		
	}
	class SchemasHandler extends TAPHandler{
		TAPSCHEMA tap;
		SchemasHandler(String endpoint) {
			super(endpoint);
			tap = new TAPSCHEMA();
			tap.setEndpoint(endpoint);
		}
		public void handle(InputStream in) throws Exception{
			StarTable votable = new StarTableFactory().makeStarTable(in, new VOTableBuilder());
			for(int i = 0; i < votable.getRowCount(); i++)
			{
				Object[] row = votable.getRow(i);
				int ix = 0;
				Schema currentSchema = new Schema();
				currentSchema.setSchemaName((String)row[ix++]);
				currentSchema.setDescription((String)row[ix++]);
				currentSchema.setNumTables(-1); // not queried, not set
				tap.getSchema().add(currentSchema);
			}
		}
		@Override
		String getSQL() {
			return "select s.schema_name,s.description from TAP_SCHEMA.schemas as s where s.schema_name != 'TAP_SCHEMA' order by schema_name";
		}
		public TAPSCHEMA getTap() {
			return tap;
		}
		
	}
	class ColumnsHandler extends TAPHandler {
		TAPTABLE tap;
		String table_name;
		ColumnsHandler(String endpoint, String table_name) {
			super(endpoint);
			tap = new TAPTABLE();
			tap.setEndpoint(endpoint);
			tap.setTableName(table_name);
			
		}
		@Override
		public void handle(InputStream in) throws Exception{
			StarTable votable = new StarTableFactory().makeStarTable(in, new VOTableBuilder());
			for(int i = 0; i < votable.getRowCount(); i++)
			{
				Object[] row = votable.getRow(i);
				Column col = new Column();
				int ix = 0;
				col.setColumnName((String)row[ix++]);
				col.setDatatype((String)row[ix++]);
				col.setDescription((String)row[ix++]);
				col.setUcd((String)row[ix++]);
				col.setUnit((String)row[ix++]);
				String size = (row[ix] != null?row[ix++].toString().trim():null);
				col.setSize(null);
				if(size != null && size.length() > 0)
					col.setSize(size);
				else if("char".equals(col.getDatatype()))
					col.setSize("*");
				tap.getColumn().add(col);
			}
		}
		@Override
		String getSQL() {
			String sql =String.format("select column_name,datatype,description,ucd,unit,\"size\" from TAP_SCHEMA.columns where table_name = '%s'",tap.getTableName());
//			sql=sql.replaceAll("\\+", "\\%2B");
			return sql;
		}
	}
	
	
	
	
	
	public static void main(String[] args) throws Exception
	{
		String endpoint =  "http://galformod.mpa-garching.mpg.de/millenniumtap";
		endpoint = "http://heasarc.gsfc.nasa.gov/xamin/vo/tap";
		endpoint = "http://dc.zah.uni-heidelberg.de/__system__/tap/run/tap";
		
		TAPInterpreter tap = new TAPInterpreter();
		TAPSCHEMA sch = tap.getTAP_tables(endpoint, null);
		JAXB.marshal(sch, System.out);
//		TAPTABLE tbl = tap.getColumns(endpoint, "wise.main");
//		JAXB.marshal(tbl, System.out);
		
	}
	
	public static String inputStream2String(InputStream in) {
	    java.util.Scanner s = new java.util.Scanner(in).useDelimiter("\\A");
	    return  s.hasNext() ? s.next() : "";
	}
	public void queryTAP(TAPHandler handler) throws Exception
	{
		CloseableHttpClient httpclient = HttpClients.createDefault();

		URIBuilder urib = new URIBuilder(handler.getEndpoint()+"/sync");
		URI uri = urib.setParameter("QUERY", handler.getSQL())
				.setParameter("FORMAT","votable")
				.setParameter("REQUEST", "doQuery")
				.setParameter("LANG","ADQL")
				.build();
		try {
			HttpGet get = new HttpGet(uri);
			CloseableHttpResponse resp = httpclient.execute(get);
			try {
				HttpEntity entity = resp.getEntity();
				if(entity != null) {
					InputStream in = entity.getContent();
					String content = inputStream2String(in);
					in = new ByteArrayInputStream(content.getBytes());
					try {
						handler.handle(in);
					} catch(Exception e) {
						throw new Exception(content, e);
					}
					finally {
						in.close();
					}
				} 
			}finally{
				resp.close();
			}
		}finally {
			httpclient.close();
		}
	}
	public TAPSCHEMA getTAP_tables(String endpoint, String schemaName) throws Exception
	{
		TableHandler handler = new TableHandler(endpoint, schemaName);
		queryTAP(handler);
		return handler.tap;
   }
	
	public ArrayList<String> getRegTAP_TAP_endpoints(String regtap) throws Exception
	{
		RegTapHandler handler = new RegTapHandler(regtap);
		queryTAP(handler);
		return handler.tapEndpoints;
   }
	public TAPTABLE getTAP_columns(String endpoint, String table_name) throws Exception
	{
		ColumnsHandler handler = new ColumnsHandler(endpoint, table_name);
		queryTAP(handler);
		return handler.tap;
   }
	public TAPSCHEMA getTAP_schemas(String endpoint) throws Exception{
		SchemasHandler handler = new SchemasHandler(endpoint);
		queryTAP(handler);
		return handler.tap;
	}
	
	
	public TAPSCHEMA getTAP_schemas_old(String endpoint) throws Exception
		{
	/*
	String sql= "select s.schema_name, s.description, count(*) as numTables from TAP_SCHEMA.schemas as s left outer join TAP_SCHEMA.tables as t on t.schema_name = s.schema_name where s.schema_name != 'TAP_SCHEMA' group by s.schema_name, s.description order by 1"; 
	*/
			
	//		String sql="select schema_name, description from TAP_SCHEMA.schemas where schema_name != 'TAP_SCHEMA' order by schema_name";
			String sql ="select s.schema_name, s.description, count(t.schema_name) as numTables "+
	  				 	"  from TAP_SCHEMA.schemas as s "+
	  				 	"  left outer join TAP_SCHEMA.tables as t "+
	  				 	"    on t.schema_name = s.schema_name "+
	  				 	" where s.schema_name != 'TAP_SCHEMA' "+
	  				 	" group by s.schema_name, s.description order by 1";
	//		sql= "select s.schema_name, s.description, count(*) as numTables from TAP_SCHEMA.schemas as s left outer join TAP_SCHEMA.tables as t on t.schema_name = s.schema_name where s.schema_name != 'TAP_SCHEMA' group by s.schema_name, s.description "; 
			sql = sql.replaceAll(" ", "%20");
			sql = sql.replaceAll("'", "%27");
			String query = "FORMAT=votable&REQUEST=doQuery&LANG=ADQL&VERSION=1.0&QUERY="+sql;
			String s_url=endpoint+"/sync?"+query;
			
			URL url = new URL(s_url);
			InputStream in = url.openStream();
			StarTable votable = new StarTableFactory().makeStarTable(in, new VOTableBuilder());
	
			TAPSCHEMA tap = new TAPSCHEMA();
			tap.setEndpoint(endpoint);
			for(int i = 0; i < votable.getRowCount(); i++)
			{
				Object[] row = votable.getRow(i);
				int ix = 0;
				Schema currentSchema = new Schema();
				currentSchema.setSchemaName((String)row[ix++]);
				currentSchema.setDescription((String)row[ix++]);
				String numTables = String.valueOf(row[ix++]);
				currentSchema.setNumTables(Integer.parseInt(numTables));
				tap.getSchema().add(currentSchema);
			}
		    return tap;
		}

	public TAPSCHEMA getTAP_tables_old(String endpoint, String schemaName) throws Exception
		{
			String and = ((schemaName != null && schemaName.trim().length() > 0)? String.format(" and schema_name='%s' ",schemaName):"");
			String sql="select schema_name, table_name, description from TAP_SCHEMA.tables where schema_name != 'TAP_SCHEMA' "
			+ and +  " order by schema_name, table_name";
			sql = sql.replaceAll(" ", "%20");
			sql = sql.replaceAll("'", "%27");
			String query = "FORMAT=votable&REQUEST=doQuery&LANG=ADQL&QUERY="+sql;
			String s_url=endpoint+"/sync?"+query;
			URL url = new URL(s_url);
			InputStream in = url.openStream();
			StarTable votable = new StarTableFactory().makeStarTable(in, new VOTableBuilder());
	
			TAPSCHEMA tap = new TAPSCHEMA();
			tap.setEndpoint(endpoint);
			Schema currentSchema = null;
			for(int i = 0; i < Math.min(100,votable.getRowCount()); i++)
			{
				Object[] row = votable.getRow(i);
				int ix = 0;
				String schema_name = (String)row[ix++];
				if(currentSchema == null || !schema_name.equals(currentSchema.getSchemaName()))
				{
					currentSchema = new Schema();
					currentSchema.setSchemaName(schema_name);
					tap.getSchema().add(currentSchema);
				}
				Table t = new Table();
				t.setTableName((String)row[ix++]);
				t.setDescription((String)row[ix++]);
				currentSchema.getTable().add(t);
			}
		    return tap;
	   }

	public TAPTABLE getTAP_columns_old(String endpoint, String table_name) throws Exception
		{
			String sql=String.format("select column_name,datatype,description,ucd,unit,\"size\" from TAP_SCHEMA.columns where table_name = '%s'",table_name);
			sql = sql.replaceAll(" ", "%20");
			sql = sql.replaceAll("'", "%27");
			String query = "FORMAT=votable&REQUEST=doQuery&LANG=ADQL&VERSION=1.0&QUERY="+sql;
			String s_url=endpoint+"/sync?"+query;
			URL url = new URL(s_url);
			InputStream in = url.openStream();
			StarTable votable = new StarTableFactory().makeStarTable(in, new VOTableBuilder());
	
			TAPTABLE tap = new TAPTABLE();
			tap.setEndpoint(endpoint);
			tap.setTableName(table_name);
			for(int i = 0; i < votable.getRowCount(); i++)
			{
				Object[] row = votable.getRow(i);
				Column col = new Column();
				int ix = 0;
				col.setColumnName((String)row[ix++]);
				col.setDatatype((String)row[ix++]);
				col.setDescription((String)row[ix++]);
				col.setUcd((String)row[ix++]);
				col.setUnit((String)row[ix++]);
				String size = (row[ix] != null?row[ix++].toString().trim():null);
				col.setSize(null);
				if(size != null && size.length() > 0)
					col.setSize(size);
				else if("char".equals(col.getDatatype()))
					col.setSize("*");
				tap.getColumn().add(col);
			}
		    return tap;
	   }
}
