package org.ivoa.vodml;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.StringWriter;
import java.net.URL;

import jakarta.xml.bind.JAXBContext;
import jakarta.xml.bind.JAXBElement;
import jakarta.xml.bind.JAXBException;
import jakarta.xml.bind.Marshaller;
import jakarta.xml.bind.Unmarshaller;

import org.ivoa.vodml.jaxb.Model;
import org.ivoa.vodml.jaxb.ObjectFactory;
import org.ivoa.vodml.mapping.jaxb.MappedModels;

//import com.sun.tools.xjc.runtime.JAXBContextFactory;


public class VODML_JAXBHelper {

	private Unmarshaller vodml_unmarshaller;
	private Marshaller vodml_marshaller;
	private JAXBContext vodml_context;
	private JAXBContext vodml_mapping_context;
	private Unmarshaller vodml_mapping_unmarshaller;
	private ObjectFactory vodmlObjectFactory;

	public static final VODML_JAXBHelper jaxb = new VODML_JAXBHelper();

	private VODML_JAXBHelper() {
		try {
//			this.vodml_context = (JAXBContext) JAXBContextFactory.createContext(new Class[]{Model.class}, null);
			this.vodml_context = JAXBContext.newInstance(org.ivoa.vodml.jaxb.ObjectFactory.class);
			this.vodml_unmarshaller = vodml_context.createUnmarshaller();
			this.vodml_marshaller = vodml_context.createMarshaller();
			this.vodmlObjectFactory = new ObjectFactory();
			this.vodml_mapping_context = (JAXBContext) org.eclipse.persistence.jaxb.JAXBContextFactory.createContext("org.ivoa.vodml.mapping.jaxb", null);
//			this.vodml_mapping_context = JAXBContext.newInstance(MappedModels.class);
			this.vodml_mapping_unmarshaller = vodml_mapping_context.createUnmarshaller();
		} catch (JAXBException e) {
			System.out.println("Error initializing JAXBHelper:");
			e.printStackTrace();
		}
	}

	public String marshall(Model model) throws JAXBException{
		StringWriter sw = new StringWriter();
		JAXBElement<Model> j = vodmlObjectFactory.createModel(model);
		vodml_marshaller.marshal(j, sw);
		return sw.toString();
	}

	/**
	 * This method is synchronized as a simple way to avoid multi-threaded access.
	 * Otherwise
	 * [org.xml.sax.SAXException: FWK005 parse may not be called while parsing.]
	 * may be encountered.
	 * 
	 * @param url
	 * @return
	 * @throws JAXBException
	 */
	public synchronized Model parseVODML(URL url) throws JAXBException {
		return extractModel(vodml_unmarshaller.unmarshal(url));
	}
	/**
	 * This method is synchronized as a simple way to avoid multi-threaded access.
	 * Otherwise
	 * [org.xml.sax.SAXException: FWK005 parse may not be called while parsing.]
	 * may be encountered.
	 * 
	 * @param url
	 * @return
	 * @throws JAXBException
	 */
	public synchronized Model parseVODML(InputStream in) throws JAXBException {
		InputStreamReader ir = new InputStreamReader(in);
//		BufferedReader br = new BufferedReader(ir);
//		String line = null;
//		try {
//		while((line = br.readLine()) != null)
//			System.out.println(line);
//		} catch(Exception e) {
//			throw new JAXBException(e);
//		}
		
		return extractModel(vodml_unmarshaller.unmarshal(ir));
	}

	/**
	 * This method is synchronized as a simple way to avoid multi-threaded access.
	 * Otherwise
	 * [org.xml.sax.SAXException: FWK005 parse may not be called while parsing.]
	 * may be encountered.
	 * 
	 * @param f
	 * @return
	 * @throws JAXBException
	 */
	public synchronized Model parseVODML(File f) throws JAXBException {
		return extractModel(vodml_unmarshaller.unmarshal(f));
	}

	/**
	 * ...
	 * 
	 * @param o
	 * @return
	 */
	private static MappedModels extractMappedModels(Object o) {
		if (o instanceof MappedModels)
			return (MappedModels) o;
		else if (o instanceof JAXBElement<?>) {
			Object m = ((JAXBElement<?>) o).getValue();
			if (m instanceof MappedModels)
				return (MappedModels) m;
		}
		return null; // TODO log an error.
	}


	/**
	 * This method is synchronized as a simple way to avoid multi-threaded access.
	 * Otherwise
	 * [org.xml.sax.SAXException: FWK005 parse may not be called while parsing.]
	 * may be encountered.
	 * 
	 * @param f
	 * @return
	 * @throws JAXBException
	 */
	public synchronized MappedModels parseVODMLMapping(File f) throws JAXBException {
		return extractMappedModels(vodml_mapping_unmarshaller.unmarshal(f));
	}


	/**
	 * This method is synchronized as a simple way to avoid multi-threaded access.
	 * Otherwise
	 * [org.xml.sax.SAXException: FWK005 parse may not be called while parsing.]
	 * may be encountered.
	 * 
	 * @param url
	 * @return
	 * @throws JAXBException
	 */
	public synchronized MappedModels parseVODMLMapping(URL url) throws JAXBException {
		return extractMappedModels(vodml_mapping_unmarshaller.unmarshal(url));
	}


	/**
	 * Due to design of vo-dml.xsd, the return type of the marshalling is a
	 * JAXBElement<Model> rather than a model.<br/>
	 * This method checks this and extracts the actual Model instance.
	 * 
	 * @param o
	 * @return
	 */
	private static Model extractModel(Object o) {
		if (o instanceof Model)
			return (Model) o;
		else if (o instanceof JAXBElement<?>) {
			Object m = ((JAXBElement<?>) o).getValue();
			if (m instanceof Model)
				return (Model) m;
		}
		return null; // TODO log an error.
	}


}
