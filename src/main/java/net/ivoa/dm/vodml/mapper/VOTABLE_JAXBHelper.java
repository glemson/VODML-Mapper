package net.ivoa.dm.vodml.mapper;

import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.net.URL;

import jakarta.xml.bind.JAXBException;
import jakarta.xml.bind.Unmarshaller;
import jakarta.xml.bind.ValidationEvent;
import jakarta.xml.bind.ValidationEventLocator;
import jakarta.xml.bind.util.ValidationEventCollector;
import javax.xml.stream.StreamFilter;
import javax.xml.stream.XMLInputFactory;
import javax.xml.stream.XMLStreamReader;


//import org.apache.commons.jxpath.JXPathContext;
//import org.apache.commons.jxpath.NodeSet;
import org.eclipse.persistence.jaxb.JAXBContext;
import org.eclipse.persistence.jaxb.JAXBContextFactory;
import org.ivoa.votable.jaxb.AnyTEXT;
import org.ivoa.votable.jaxb.VOTABLE;


public class VOTABLE_JAXBHelper {

	private Unmarshaller votable_unmarshaller;
	private JAXBContext votable_context;
	
	private class JAXBValidator extends ValidationEventCollector {
	    @Override
	    public boolean handleEvent(ValidationEvent event) {
	        if (event.getSeverity() == ValidationEvent.ERROR ||
	            event.getSeverity() == ValidationEvent.FATAL_ERROR)
	        {
	            ValidationEventLocator locator = event.getLocator();
	            // change RuntimeException to something more appropriate
	            throw new RuntimeException("XML Validation Exception:  " +
	                event.getMessage() + " at row: " + locator.getLineNumber() +
	                " column: " + locator.getColumnNumber());
	        }

	        return true;
	    }
	}
	
	
	private class DATAFilter implements StreamFilter
	{

		private boolean accept = true;
		@Override
		public boolean accept(XMLStreamReader reader) {
			if(reader.isStartElement()){
				String name = reader.getLocalName();
				if("DATA".equals(name)) 
					accept = false;
	        } else if(reader.isEndElement()){
				String name = reader.getLocalName();
	        	if("DATA".equals(name)) {
	        		boolean returnValue = accept;
	        		accept = true;
	        		return returnValue;
		        } 
	        }
	        return accept;
		}
		
	}
	public static final VOTABLE_JAXBHelper jaxb = new VOTABLE_JAXBHelper();

	private VOTABLE_JAXBHelper() {
		try {
			this.votable_context = (JAXBContext) JAXBContextFactory
					.createContext("org.ivoa.votable.jaxb", null);
			this.votable_unmarshaller = votable_context.createUnmarshaller();
			votable_unmarshaller.setEventHandler(new JAXBValidator());

		} catch (JAXBException e) {
			System.out.println("Error initializing JAXBHelper:");
			e.printStackTrace();
		}
	}

	public VOTABLE parseVOTABLE(URL url, boolean withData) throws Exception {
		return parseVOTABLE(url.openStream(), withData);
	}
	/**
	 * 
	 * @param xmlStream
	 * @param withData if true include TABLEDATA in parsing, if false only parse metadata
	 * @return
	 * @throws Exception
	 */
	public VOTABLE parseVOTABLE(InputStream xmlStream, boolean withData) throws Exception {
        XMLInputFactory xif = XMLInputFactory.newInstance();
        VOTABLE vot;
        if(withData)
        {
//        	Unmarshaller.unmarshal(rootNode, MyType.class);
        	vot = (VOTABLE)votable_unmarshaller.unmarshal(xmlStream);
        } else {
        	XMLStreamReader xsr = xif.createXMLStreamReader(xmlStream);
        	xsr = xif.createFilteredReader(xsr, new DATAFilter());
            vot = (VOTABLE) votable_unmarshaller.unmarshal(xsr);
        }
        
        return vot;
	}
	public VOTABLE parseVOTABLE(File f, boolean withData) throws Exception {
        return parseVOTABLE(new FileInputStream(f), withData);
	}

	public static void main(String[] args ) throws Exception {
	
		File f = new File("C:\\workspaces\\eclipse-luna-4.4.1\\vo-urp-etc\\vo-dml\\doc\\samples\\2mass.votable");
		
		VOTABLE vot = jaxb.parseVOTABLE(f, false);
		AnyTEXT at = vot.getDESCRIPTION();
		for(Object o:at.getContent())
			System.out.printf("%s\n", o);
	}
}
