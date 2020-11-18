package org.ivoa.vodml;

import java.io.InputStream;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Hashtable;

import javax.net.ssl.SSLHandshakeException;

import org.ivoa.vodml.jaxb.Model;
import org.ivoa.vodml.jaxb.Models.Modellocation;
import org.json.JSONObject;

public class RemoteVODMLRegistry implements VODMLRegistry {

	private Hashtable<String, Modellocation> modelsByName = new Hashtable<String, Modellocation>();
	private Hashtable<String, Modellocation> modelsByURL = new Hashtable<String, Modellocation>();
	
	private JSONObject ivoa_models = null;
	private JSONObject other_models = null;
	public RemoteVODMLRegistry() {
		try {
		    Path path = Paths.get(getClass().getClassLoader().getResource("IVOA_Models.json").toURI());       
		    byte[] fileBytes = Files.readAllBytes(path);
		    String data = new String(fileBytes);
		    JSONObject json = new JSONObject(data);
		    this.ivoa_models = (JSONObject)json.get("IVOA_Models");
		    this.other_models = (JSONObject)json.get("Other_Models");
		} catch(Exception e) {
			System.out.println("Unable to load models.json file");
		}
	}
	
	
	/**
	 * Registry is allowed to use either name or url to retrieve a model.
	 */
	@Override
	public Modellocation openModel(String name, String url) throws Exception{
		Modellocation m = (name==null?null:modelsByName.get(name));
		if(m != null)
			return m;
		m = new Modellocation();
		JSONObject json = null;
		if(name != null && ivoa_models.has(name)) {
			json = (JSONObject)ivoa_models.get(name);
			m.setName(name);
		}
		if(json != null) {
			String i_url=json.getString("xml");
			if(i_url != null)
				url = i_url;
			m.setDocumentationURL(json.getString("html"));
		}
		m.setLocation(url);
		InputStream in = null;
		try { // hacky way of dealing with possible https problems.
			in = new URL(url).openStream();
		} catch(SSLHandshakeException sslex) {
			if(url.startsWith("https"))
				url="http"+url.substring(5);
			in = new URL(url).openStream();
		}
		if(in == null)
			return null;
		Model model = VODML_JAXBHelper.jaxb.parseVODML(in);
		m.setModel(model);
		m.setName(model.getName());
		modelsByURL.put(url, m);
		if(name == null || m.getName().equals(name)) {
			m.setName(model.getName());
			modelsByName.put(m.getName(), m);
		}
		else
			throw new Exception(String.format("Model retrieved for URL '%s' has name '%s' rather than requested name '%s'",url,m.getName(),name));
		return m;
	}


	@Override
	public JSONObject defaultModels() throws Exception {
		return ivoa_models;
	}

}
