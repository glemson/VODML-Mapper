package jaxb.tools;

import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;

import jakarta.xml.bind.JAXBContext;
import jakarta.xml.bind.JAXBException;
import jakarta.xml.bind.Unmarshaller;
import javax.xml.namespace.QName;
import javax.xml.stream.XMLEventReader;
import javax.xml.stream.XMLInputFactory;
import javax.xml.stream.XMLStreamException;

import org.ivoa.votable.jaxb.Data;
import org.ivoa.votable.jaxb.VOTABLE;

public class Main {
	public static void main(String[] args) throws Exception
	{
		new Main().testChunks();
	}
		public void testChunks() throws JAXBException, XMLStreamException, IOException {
		        
		    final QName qName = new QName("http://www.ivoa.net/xml/VOTable/v1.2","DATA");

		        
		    InputStream in = new FileInputStream("C:\\workspaces\\eclipse_VO-URP\\vo-dml\\doc\\examples\\2mass_concat.votable");
		    if(in == null)
		        throw new NullPointerException();

		    // create xml event reader for input stream
		    XMLInputFactory xif = XMLInputFactory.newInstance();
		    XMLEventReader reader = xif.createXMLEventReader(in);

		    // initialize jaxb
		    JAXBContext jaxbCtx = JAXBContext.newInstance("org.ivoa.votable");
		    Unmarshaller um = jaxbCtx.createUnmarshaller();

		    // unmarshall the Example element without parsing the document elements
		    VOTABLE example = um.unmarshal(new PartialXmlEventReader(reader, qName), 
		          VOTABLE.class).getValue();

    
		}

	}
