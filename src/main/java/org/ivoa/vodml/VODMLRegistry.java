package org.ivoa.vodml;


import org.ivoa.vodml.jaxb.Models.Modellocation;
import org.json.JSONObject;

public interface VODMLRegistry {

	/**
	 * Registry is allowed to use either name or url to retrieve a model.
	 * @param name
	 * @param url
	 * @return
	 * @throws Exception
	 */
	public Modellocation openModel(String name, String url) throws Exception;
	public JSONObject defaultModels() throws Exception;
}
