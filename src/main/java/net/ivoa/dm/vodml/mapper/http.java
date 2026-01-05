package net.ivoa.dm.vodml.mapper;

import java.io.IOException;

import org.apache.http.client.methods.HttpGet;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;

public class http {

	public static void main(String[] args) throws IOException{
		
		CloseableHttpClient cl = HttpClients.createDefault();
		HttpGet get = new HttpGet("http://cnn.com");
		try {
			cl.execute(get);
		} catch(Exception e) {
			e.printStackTrace();
		} finally {
			cl.close();
		}
	}
}
