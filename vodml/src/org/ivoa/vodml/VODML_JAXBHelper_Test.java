package org.ivoa.vodml;

import java.io.File;

import org.ivoa.vodml.jaxb.Model;

public class VODML_JAXBHelper_Test {

	public static void main(String[] args) throws Exception{
		try {
		File f = new File("C:\\workspaces\\eclipse-luna-4.4.1\\vo-urp-etc\\vo-dml\\models\\source\\SourceDM.vo-dml.xml");
		Model model = VODML_JAXBHelper.jaxb.parseVODML(f);
		if(model != null)
			System.out.printf("Model name = %s\n", model.getName());
		else
			System.out.println("No model found");
		}
		catch(Exception e)
		{
			e.printStackTrace();
		}
	}
}
