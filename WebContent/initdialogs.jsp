<!-- Dialogs -->
  <div id="action_center" title="DO SOMETHING!">
    
  </div>

	<div id="type4connection_dialog" title="Select type for connection endpoint">
	<p>
	Select a type for this connection, or cancel.
	</p>
		<select id="endpoint_datatypes" style="width: 100%"></select><br/><hr/>
	</div>



	<div id="modelloadtab_dialog" title="Load VO-DML models">
		<table>
			<tr>
				<td>IVOA</td>
				<td><select id="loadIVOAModelSelect" style="width: 100%">
<!--
  						<option>source</option>
						<option>photdm-alt</option>
						<option>caom2</option>
						<option>sample</option>
						<option>filter</option>
						<option>ivoa</option>
-->
<!--
 						<option>vo-dml</option>   
 -->
				</select></td>
				<td><button id="loadIVOAModelButton" style='width: 100%'>Load</button></td>
			</tr>
			<tr>
				<td>Custom</td>
				<td><input type="text" id="loadCustomModelInput"
					style="width: 40em" /></td>
				<td><button id="loadCustomModelButton" style='width: 100%'>Load</button></td>
			</tr>
		</table>
	</div>
	<div id="tapload_dialog" title="Load TAP Schema">
<table><tr><td colspan=2>
					&nbsp;<select id="tapendpoint" style="width: 40em">
							<option>http://dc.zah.uni-heidelberg.de/__system__/tap/run/tap</option>
							<option>http://www.cadc-ccda.hia-iha.nrc-cnrc.gc.ca/tap</option>
							<option>http://gea.esac.esa.int/tap-server/tap</option>
							<option>http://vao.stsci.edu/hsctap/TapService.aspx</option>
							<option>http://vao.stsci.edu/CAOMTAP/TapService.aspx</option>
							<option>http://tapvizier.u-strasbg.fr/TAPVizieR/tap</option>
							<option>http://voparis-tap.obspm.fr/__system__/tap/run/tap</option>
<!-- 
							<option>http://wfaudata.roe.ac.uk/sdssdr9-dsa/TAP</option>
							<option>http://wfaudata.roe.ac.uk/ukidssDR9-dsa/TAP</option>
 -->
 					</select>
		<button id="loadTAPEndpointButton" style="">Select Endpoint</button>
</td></tr><tr><td>					
<select id="tapschemas" style="width: 20em" size=10></select>
</td><td>
<select id="tapschematables" style="width: 20em" size=10></select>
</td></tr><tr><td>
<button id="loadTAPTablesButton" style="width: 20em;"
							disabled="disabled">Load Tables</button>
						<br />
						<div id="tapschemaDescription"></div>
</td></tr></table>
		</div>
	</div>
	<div id="tableurlload_dialog" title="Load Table(s) from URL">
		<table>
			<tr>
				<td>SCS</td>
				<td><select id="scsendpoint" style='width: 32em'>
						<option>TBD</option>
				</select></td>
				<td><button id="loadSCSButton" style='width: 100%'>Load
						SCS Metadata</button></td>
			</tr>
			<tr>
				<td>VOTable</td>
				<td><input type='text' id="votableurl" style='width: 95%'
					value=""></input></td>
				<td><button id="loadVOTableButton" style='width: 100%'>Load from URL</button></td>
			</tr>
			<tr>
				<td>FITS</td>
				<td><input type='text' id="fitsurl" style='width: 95%' value=""></input></td>
				<td><button id="loadFITSURLButton" style='width: 100%'>Load from URL</button></td>
			</tr>
		</table>
	</div>
	<div id="vizier_dialog" title="Load VizieR table(s)">
		<table>
			<tr>
				<td colspan=3>Enter comma-separated list of catalogue names</td>
			</tr>
			<tr>
				<td><input type='text' id="vizierField" style='width: 40em'
					value="J/A+A/461/397,J/A+A/347/47"></input></td>
				<td>&nbsp;&nbsp;</td>
				<td><button id="loadVizieRButton" style='width: 100%'>&nbsp;&nbsp;Load
						Catalogue(s) by Name</button></td>
			</tr>
			<tr>
				<td>
					<button id="showvizier"
						onClick="document.getElementById('vizierIFrame').src='http://vizier.u-strasbg.fr/viz-bin/VizieR';">VizieR
						Home</button> <!-- 
			<button onClick="document.getElementById('vizierIFrame').contentWindow.history.back(-1);">Back</button>
			<button onClick="document.getElementById('vizierIFrame').contentWindow.history.forward(1);">Forward</button>
-->
				</td>
				<td colspan=2></td>
			</tr>
		</table>
		<div id="vizierpanel" style="width: 100%;">
			<iframe id="vizierIFrame" src="" style="width: 100%; height: 600px;"></iframe>
		</div>
	</div>
	<div id="showstate_dialog" title="Show state">
		<textarea id="mappingconsole" readonly  style="width:100%;cursor:text;background-color:white" cols="128"  rows="25"></textarea>
  </div>
<div id="browsestates_dialog">
<div id="mapscontainertabs">
		<ul>
			<li><a href="#searchmaps"> <img
					src="css/images/green-unlock-icon-16.png">&nbsp;&nbsp;Search Maps
			</a></li>
			<li><a href="#savedmapstabs"><img
					src="css/images/red-lock-icon-16.png">&nbsp;&nbsp;Your Maps</a></li>
		</ul>
		<div id="searchmaps">
			<table>
				<tr>
					<td valign="middle"><input type="checkbox"
						style="height: 20px; width: 20px;" id="searchmap_includemodel" /></td>
					<td valign="middle">Model</td>
					<td valign="middle"><input id="searchmaps_models" type="text" style="width:40em;"/>
					</td>
				</tr>
				<tr>
					<td><input type="checkbox" style="height: 20px; width: 20px;"
						id="searchmap_includetype" /></td>
					<td>Type</td>
					<td><input id="searchmaps_types" type="text"  style="width:40em"/>
					<!-- TBD could be autocomplete based on loaded models --></td>
				</tr>
				<tr>
					<td><input type="checkbox" id="searchmap_includevodmlref"
						style="height: 20px; width: 20px;" /></td>
					<td>vodmlref</td>
					<td><input id="searchmaps_vodmlrefs" type="text"  style="width:40em"/>
					<!-- TBD could be autocomplete based on loaded models --></td>
				</tr>
				<tr><td /><td><button id="searchmaps_submit">submit</button></td><td /></tr>
			</table>
			<hr />
			<table id="searchmaps_table" cellpadding="0" cellspacing="0"
				border="0" class="display" width="100%">
				<thead>
					<tr>
						<th style="width: 40px">Actions</th>
						<th>Owner</th>
						<th>Publication Time</th>
						<th>Owner Reference</th>
						<th>Annotation</th>
					</tr>
				</thead>
				<tbody></tbody>
			</table>
		</div>
	<div id="savedmapstabs">
		<ul>
			<li><a href="#privatemaps"><img
					src="css/images/red-lock-icon-16.png">&nbsp;&nbsp;All Your Maps</a></li>
			<li><a href="#publicmaps"> <img
					src="css/images/green-unlock-icon-16.png">&nbsp;&nbsp;Your Public Maps
			</a></li>
		</ul>
		<div id="privatemaps">
			<table id="mymaps_table" cellpadding="0" cellspacing="0" border="0"
				class="display" width="100%">
				<thead>
					<tr>
						<th style="width: 100px">Actions</th>
						<th>Your Reference</th>
						<th>Create Time</th>
						<th>Annotation</th>
					</tr>
				</thead>
				<tbody></tbody>
			</table>
		</div>
		<div id="publicmaps">
			<table id="publicmaps_table" cellpadding="0" cellspacing="0"
				border="0" class="display" width="100%">
				<thead>
					<tr>
						<th style="width: 80px">Actions</th>
						<th>Owner</th>
						<th>Publication Time</th>
						<th>Owner Reference</th>
						<th>Annotation</th>
					</tr>
				</thead>
				<tbody></tbody>
			</table>
		</div>
<hr/><br/>
    <button id="RefreshMyMaps">Refresh</button>
	</div>
	</div>
</div>
<div id="savestate_dialog" title="Save state">
	<div id="savestate_updatemode">
<input type="radio" id="savestate_insert" name="updatemode" value="insert" checked="checked">&nbsp;Insert<br/>
<input type="radio" id="savestate_update" name="updatemode" value="update">&nbsp;Update
</div>
<h3>Your reference</h3>
<input type="text" id="state_label"></input> 
<h3>Annotation</h3>
<textarea id="state_annotation"></textarea>
</div>

<script >
function createdialog(id,html_title){
	var dialog = jQuery(id).dialog({autoOpen:false, width:'auto',modal: true,
	buttons:[{text:"Close", click:function(){
		jQuery(this).dialog("close");
	}}]});
	if(html_title != null){
		dialog.data( "uiDialog" )._title = function(title) {
		    title.html( this.options.title );
		};
		dialog.dialog('option', 'title', html_title);
	};
	return dialog;
}
createdialog("#savestate_dialog", null);
createdialog("#modelloadtab_dialog","<img src='css/images_jstree/3D-objects-icon-16.png'>&nbsp;&nbsp;Load VO-DML models");
//createdialog("#tablefileload_dialog", null);
createdialog("#vizier_dialog", null);
createdialog("#tableurlload_dialog", null);
createdialog("#tapload_dialog", null);
createdialog("#showstate_dialog", null);
createdialog("#browsestates_dialog", "<img src='css/images_jstree/objects-icon-16.png'>&nbsp;&#8614;&nbsp;<img src='css/images_jstree/Database-Table-icon-16.png'>&nbsp;&nbsp;Saved&nbsp;VO-DML&nbsp;Maps")
createdialog("#type4connection_dialog", null);
</script>
