package com.example;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;

import javax.ws.rs.FormParam;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;

@Path("/")
public class SensorParam {

	@GET
	@Path("/getCSC")
	@Produces(MediaType.TEXT_PLAIN)
	public String jsonOutPut() {
		return dataPick();
	}

	@POST
	@Path("/postCSC")
	@Produces(MediaType.TEXT_PLAIN)
	public String input(@FormParam("speed") String speed,
			@FormParam("cadence") String cadence) {
		String s = "{\"speed\": " + speed + ", \"cadence\":" + cadence + "}";
		this.dataSave(s);
		return "";
	}

	private String dataPick() {
		String str = "";
		try {
			File file = new File(".csc.txt");
			BufferedReader br = new BufferedReader(new FileReader(file));
			str = br.readLine();
			br.close();
		} catch (Exception e) {
		}
		return str;

	}

	private void dataSave(String s) {
		try {
			File file = new File(".csc.txt");
			file.delete();
			FileWriter filewriter = new FileWriter(file);
			filewriter.write(s);
			filewriter.close();
		} catch (Exception e) {
			System.out.println("dataSave:1");
		}
	}

	public static void main(String[] args) {
		SensorParam inst = new SensorParam();
		// System.out.println("CSC"+ inst.jsonOutPut());
	}
}