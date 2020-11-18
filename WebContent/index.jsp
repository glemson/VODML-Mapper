<!DOCTYPE html>
<!--  
PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd"
 -->
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=ISO-8859-1">
<title>VO-DML Mapper</title>

<!-- 
<link type="text/css" rel="stylesheet"	href="http://galformod.mpa-garching.mpg.de/common/css/galformod-mpaci.css" />
-->

<!-- M. Egger's choices: -->
<!-- ** JQUERY resources ************************************************** -->

<!-- jquery CORE js (from google CDN) -->
<!--script	type="text/javascript"	src="https://ajax.googleapis.com/ajax/libs/jquery/1.8.3/jquery.min.js" ></script-->
<!-- 
	<script	type="text/javascript"	src="https://ajax.googleapis.com/ajax/libs/jquery/1.8.3/jquery.js" ></script>
 -->
<script type="text/javascript" src="js/jquery.js"></script>
<!-- jquery UI js & css (from google CDN) -->
<!-- 
	<script type="text/javascript"	src="https://ajax.googleapis.com/ajax/libs/jqueryui/1.9.2/jquery-ui.js" ></script>
	<link type="text/css" rel="stylesheet"	href="https://ajax.googleapis.com/ajax/libs/jqueryui/1.9.2/themes/south-street/jquery-ui.css" />
 -->
<script type="text/javascript" src="js/jquery-ui.js"></script>
<link type="text/css" rel="stylesheet" href="css/jquery-ui.css" />

<!-- jquery LAYOUT (no CDN) -->
<script type="text/javascript" src="js/jquery.layout-1.3.0-rc30.79.js"></script>
<link type="text/css" rel="stylesheet" href="css/jquery.layout-default-1.3.0-rc30.79.css" />
<!-- jquery TREE -->
<script type="text/javascript" src="js/jquery.jstree-1.0-rc3.js"></script>
<!-- jquery jsPlumb -->
<!-- <script type="text/javascript" src="js/jquery.jsPlumb-1.4.1-all.js"></script>  -->
<!-- 1.6.2 does not work, needs recoding mapper. -->
<script type="text/javascript" src="js/jquery_jsPlumb-1_6_2
.js"></script>
<!-- jquery contextmenu -->
<!-- 
<script type="text/javascript" src="js/jquery.contextMenu_1.6.5.js"></script>
<link rel="stylesheet"	href="css/jquery.contextMenu_1.6.5.css">
 -->
<script type="text/javascript" src="js/jquery.contextmenu.js"></script>
<link rel="stylesheet"	href="css/jquery.contextMenu.css">

<script type="text/javascript" src="js/jquery.dataTables.min.js"></script>
<link rel="stylesheet"	href="css/demo_page.css">
<link rel="stylesheet"	href="css/demo_table.css">

<script type="text/javascript" src="js/vkbeautify.0.99.00.beta.js"></script>

<!-- 
<script type="text/javascript" src="js/html2canvas.js"></script>
<script type="text/javascript" src="js/Canvas2Image.js"></script>
 -->
<!-- ========================================= -->

<!-- 
<link rel="stylesheet"	href="http://blueimp.github.io/cdn/css/bootstrap.min.css">
 -->
<link type="text/css" rel="stylesheet" href="css/style.css" />
<link type="text/css" rel="stylesheet" href="css/vo-dml.mapper.css" />

<script type="text/javascript" src="js/util.js"></script>
<script type="text/javascript" src="js/vo-dml.js"></script>
<script type="text/javascript" src="js/mapper.tap.js"></script>
<script type="text/javascript" src="js/tables-manager.js"></script>
<script type="text/javascript" src="js/vo-dml.mvc.js"></script>

<script type="text/javascript" src="js/vo-dml.mvc.mapper.js"></script>
<script type="text/javascript" src="js/vodml.annotation.js"></script>
<!-- 
<script type="text/javascript" src="js/utype.js"></script>
 -->
<script type="text/javascript">
	/////////////////////////////////////////////////////////////////////////
	// static variables giving name of remote json files to be retrieved for initialisation
	/////////////////////////////////////////////////////////////////////////

	var controller;
	var myLayout;
</script>

<style type="text/css">
.header {
	background: #D8EEEE;
	font-weight: bold;
	text-align: center;
	position: relative;
	/*
	padding: 1px 0 1px;
	overflow: hidden;
*/
}
/**
      *Basic Layout Theme
       * 
      *This theme uses the default layout class-names for all classes
      *Add any 'custom class-names', from options: paneClass, resizerClass,
      togglerClass
       */
.ui-layout-pane { /* all 'panes' */
	background: #FFF;
	border: 1px solid #BBB;
	padding: 10px;
	overflow: auto;
}

.ui-layout-resizer { /* all 'resizer-bars' */
	background: #D8EEEE;
}

.ui-layout-toggler { /* all 'toggler-buttons' */
	background: #008B8B;
}
</style>
</head>
<body>
  <div id="splashscreen" title="Laoding">
  </div>
  <script>
	var dialog = jQuery("#splashscreen").dialog({
		dialogClass: "splashScreenWindow",
		autoOpen:true, 
		width:'auto',
		modal: true,
		width:300, // match to background loader image in vo-dml.mapper.css
		height: 300,
		resizable : false});
</script>
	<jsp:include page="initdialogs.jsp"></jsp:include>
	<!--  NORTH  banner -->
	<div class="ui-layout-north">
	<table style="width:100%"><tr><td style="width:70%">
		<h1 >
<img src="css/images/Logo.png"/>&nbsp;The VO-DML Mapper
</h1>
</td><td style="width:20%">Written by: Gerard Lemson<br/>
<a href="docs/documentation.html" target="_blank">Documentation</a><br/>
Register
</td><td style="width:10%">
<img src="css/images/ivoa_logoc2_72px.jpg" /></td></tr></table>		
	</div>


	<!--  EAST: model in tree view   -->
	<div class="ui-layout-east" style="background-color:#F8F8F8;" onmouseout="myLayout.resetOverflow(this)">
		<div id="tablemanegement">
			<div class="header" >
				<h2>Tables</h2>
			</div>
			<div id="tablestreediv" style="background-color:#F8F8F8;"></div>
		</div>
	</div>
	<!--    CENTER  -->
	<div id="mapperdiv" class="ui-layout-center  jstree-drop mapper"
		onmouseout="myLayout.resetOverflow(this)"></div>
 <!-- 	<canvas id="mapperdiv" class="ui-layout-center  jstree-drop mapper"
		onmouseout="myLayout.resetOverflow(this)"></canvas>
 -->
	<!--    WEST  -->
	<div class="ui-layout-west"  style="background-color:#F8F8F8;" onmouseout="myLayout.resetOverflow(this)">
		<div class="header">
			<h2>Models</h2>
		</div>
		<div id="modelstreediv"  style="background-color:#F8F8F8;"></div>
	</div>
<!-- SOUTH -->
	<div class="ui-layout-south" onmouseout="myLayout.resetOverflow(this)">
		<div id="workingtabs">
			<ul>
<!-- 
				<li><a href="#tablefileloadtab"><img
						src="css/images_jstree/Database-Table-icon-16.png">&nbsp;&nbsp;Uploaded&nbsp;Files</a></li>
 -->
 				<li><a href="#consoletab">
								<img src="css/images_jstree/Document-icon-16.png">&nbsp;&nbsp;Log&nbsp;Console</a></li>
			</ul>
			<!-- 
			<div id="tablefileloadtab">
			</div>
			 -->
			<div id="consoletab">
				<div id="logconsole"></div>
			</div>
		</div>
	</div>


	<script>
		jQuery(document).ready(function() {

			try {
			var conf = new Config();
			//			conf.tablesDiv = "tablesdiv";
			conf.modelsDiv = "modelsdiv";
			conf.mapperDiv = "mapperdiv";
			conf.modelsTreeDiv = "modelstreediv";
			conf.tablesTreeDiv = "tablestreediv";
			conf.logConsole = "logconsole";
			conf.mappingTab = "mappingtab";
			conf.mappingConsole = "mappingconsole";
			conf.loadIVOAModelButton = "loadIVOAModelButton";
			conf.loadIVOAModelSelect = "loadIVOAModelSelect";
			conf.loadCustomModelButton = "loadCustomModelButton";
			conf.loadCustomModelInput = "loadCustomModelInput";
			conf.loadTAPButton = "loadTAPTablesButton";
			conf.tapendpoint = "tapendpoint";
			conf.loadVOTableButton = "loadVOTableButton";
			conf.votableurlField = "votableurl";
			conf.loadVizieRButton = "loadVizieRButton";
			conf.vizierField = "vizierField";
			
			controller = new VODMLMapper.BaseController(conf);

			myLayout = jQuery('body').layout({
				spacing_open : 8,
				spacing_closed : 12,
				north__togglerLength_open : 100,
				north__togglerLength_closed : 100,
				north__resizable : true,
				north__size : 120,
				west__size : 400,
				east__size : 400,
				south__size : 200
			});
			jQuery("#workingtabs").tabs();
			jQuery("#vizierpanel").resizable();
			controller.init();
			} catch(err){
				jQuery("#splashscreen").dialog("close");
				alert("Error initializing application:"+err.message);
			}
			jQuery("#splashscreen").dialog("close");

		});
	</script>
</body>
</html>