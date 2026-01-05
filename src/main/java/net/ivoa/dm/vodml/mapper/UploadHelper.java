package net.ivoa.dm.vodml.mapper;

import java.io.File;
import java.io.FileOutputStream;
import java.io.FileWriter;
import java.io.IOException;
import java.io.PrintWriter;

import jakarta.servlet.http.HttpServletRequest;

public class UploadHelper {

	public static  File getUserFile(String name, HttpServletRequest req) throws IOException
	{
		File userPath = getUserSpecificPath(req);
		File file = new File(userPath.getCanonicalPath()+"/"+name);
		if(file.getParentFile().equals(userPath)) return file;
		else return null;
	}

	public static File getUserSpecificPath(HttpServletRequest req)
	{
		String user = req.getRemoteUser();
		if(user == null) throw new RuntimeException("No user found");
		File fileUploadPath = new File(req.getServletContext().getInitParameter("upload_path"));
		File path = new File(fileUploadPath.getAbsolutePath()+"/"+user);
		if(!path.exists()) path.mkdir();
		return path;
	}
	
}
