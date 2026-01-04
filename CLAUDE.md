# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VODML-Mapper is a web-based graphical tool for mapping between VO-DML (Virtual Observatory Data Modeling Language) models and data sources (TAP schemas, VOTables). It enables astronomers and data architects to create semantic mappings that describe how database tables or VOTable files conform to standardized VO-DML data models.

**Technology Stack:**
- **Backend:** Java Servlets with JAXB for XML processing, MongoDB or SQL Server for persistence
- **Frontend:** jQuery-based MVC with jsPlumb for visual connection drawing, jsTree for navigation
- **Build:** Gradle for dependency management and builds; Apache Ant (legacy JAXB generation)

## Development Commands

### Building JAXB Classes

JAXB classes are auto-generated from XSD schemas. When schemas change, regenerate:

```bash
cd WebContent/xsd
ant xjc-all
```

This generates Java classes in `jaxb-gen/` from:
- `vo-dml-v1.0.xsd` → `org.ivoa.vodml.jaxb`
- `VO-DML_Mapper.xsd` → `org.ivoa.vodml.mapper.jaxb`
- `vo-dml.mapping.xsd` → `org.ivoa.vodml.mapping.jaxb`
- `VOTable-1.4_vodml.xsd` → `org.ivoa.votable_1_4.jaxb`
- `VOTable-1.3.xsd` → `org.ivoa.votable.jaxb`
- `vo-dml-instance.xsd` → `org.ivoa.vodml.instance.jaxb`

**IMPORTANT:** Never manually edit files in `jaxb-gen/` - they are auto-generated.

### Building with Gradle (Recommended)

Gradle provides modern dependency management and build automation. Most dependencies are automatically downloaded from Maven Central. The STIL library (Starlink Tables Infrastructure Library) is automatically downloaded from Bristol University when needed.

**Quick Start:**

```bash
# Build the entire project (generates JAXB classes, compiles, and creates WAR)
./gradlew build

# Or on Windows:
gradlew.bat build
```

**Common Gradle Commands:**

```bash
# Generate JAXB classes from XSD schemas
./gradlew generateJaxb

# Compile Java sources
./gradlew compileJava

# Create WAR file for deployment
./gradlew war
# Output: build/libs/vodml-mapper-1.0.0-SNAPSHOT.war

# Clean build artifacts
./gradlew clean

# Run tests
./gradlew test

# Copy dependencies to WEB-INF/lib (for manual deployment)
./gradlew copyDependencies

# Create web.xml from template
./gradlew createWebXml

# Display all available tasks
./gradlew tasks

# Display project information
./gradlew projectInfo
```

**IDE Integration:**

```bash
# Generate Eclipse project files
./gradlew eclipse

# Generate IntelliJ IDEA project files
./gradlew idea
```

**Gradle Benefits:**
- Automatic dependency management (no manual JAR downloads)
- Reproducible builds
- Integrated JAXB code generation
- Built-in WAR packaging
- IDE integration
- Modern build caching for faster builds

**Note:** Gradle automatically handles JAXB code generation when you run `build` or `compileJava`.

### Dependencies

**STIL Library (Starlink Tables Infrastructure Library):**

The project uses the STIL library for VOTable parsing. Since STIL is not available in Maven Central, it's automatically downloaded from Bristol University:

```bash
# Download STIL library (automatically run during build)
./gradlew downloadStil
```

- **Download URL:** https://www.star.bristol.ac.uk/mbt/stil/stil.jar
- **Location:** `libs/stil.jar` (automatically created)
- **Auto-download:** The build process automatically downloads STIL before compilation
- **Git ignore:** The `libs/` directory is excluded from version control

If the download fails (e.g., network issues), you can manually:
1. Download the JAR from the URL above
2. Create a `libs` directory in the project root
3. Save the JAR as `libs/stil.jar`

**Other Dependencies:**

All other dependencies are managed through Gradle and automatically downloaded from Maven Central:
- Jakarta Servlet API 6.0.0
- Jakarta XML Binding (JAXB) 4.0.x
- MongoDB Driver 4.11.1
- SQL Server JDBC Driver 12.6.0
- Apache Commons (IO, FileUpload)
- Apache HTTP Client
- Log4j 2.22.1
- JSON library

### Deployment Configuration

Before deploying:

1. Copy `WebContent/WEB-INF/web.xml.template` to `WebContent/WEB-INF/web.xml`
2. Configure MongoDB connection parameters:
   - `mongodb-host` (default: localhost)
   - `mongodb-port` (default: 27017)
   - `mongodb-user`
   - `mongodb-pwd`
   - `mongodb-database`

3. Deploy as WAR to Java application server (Tomcat, JBoss, etc.)

### Validating VOTable Output

To validate a generated VOTable against the schema:

```bash
cd WebContent/xsd
ant validateVOTable -Dvotable.file=path/to/votable.xml
```

## Architecture

### Client-Server Interaction Flow

```
Browser (JavaScript MVC)
    ↓ AJAX requests
VODMLMapperServlet.java (main entry point)
    ├─→ MongoDB (via MongoDBHelper363.java) - mapping persistence
    ├─→ VODMLManager - VO-DML model loading and caching
    ├─→ TAPInterpreter.java - TAP service queries
    └─→ RegistryServlet.java - model registry operations
```

**Key servlets:**
- `VODMLMapperServlet` (`/modelLoader`) - Main servlet handling all mapper actions
- `RegistryServlet` (`/registry`, `/registry_private`) - Model registry management

### JAXB Architecture

The application heavily uses JAXB for XML binding. All XML schemas in `WebContent/xsd/` generate corresponding Java classes in `jaxb-gen/`.

**Critical JAXB helpers:**
- `org.ivoa.vodml.VODML_JAXBHelper` - VO-DML model parsing (synchronized for thread safety)
- `net.ivoa.dm.vodml.mapper.VOTABLE_JAXBHelper` - VOTable parsing and validation

**Why synchronized?** JAXB unmarshallers are not thread-safe. The helpers use synchronized methods to prevent parser conflicts when multiple users load models simultaneously.

### Data Model Graph Representation

When a VO-DML model is loaded:

1. JAXB unmarshals XML → `org.ivoa.vodml.jaxb.Model` object
2. `ModelGraph` builds directed graph representation
3. Graph nodes represent model elements:
   - `ObjectTypeNode`, `DataTypeNode` - types
   - `AttributeNode`, `ReferenceNode` - properties
   - `CompositionNode`, `RelationNode` - relationships
4. Graph enables traversal, validation, and UI rendering

### Frontend MVC Components

Located in `WebContent/js/`:

**Controllers:**
- `MapperController` (vo-dml.mvc.mapper.js:1992 lines) - Main UI controller, handles connection drawing
- `BaseController` (vo-dml.mvc.js) - State management, shared functionality
- `TablesManager` (tables-manager.js) - Table/column management
- `ModelsManager` - VO-DML model tree navigation

**Annotation/Export:**
- `SHORTVODML2VOTableAnnotator` (short-vodml.annotation2.js) - Generates VOTable with VO-DML annotations from mapper state
- `vodml.annotation.js` - Annotation utilities

**Key JavaScript state object:**
```javascript
mapperState = {
    models: {},        // Loaded VO-DML models
    tables: {},        // Loaded table sources
    mappings: {},      // Visual connections
    graph: {}          // Mapper graph representation
}
```

## Directory Structure

```
VODML-Mapper/
├── src/                                    # Java source code
│   └── net/ivoa/dm/vodml/mapper/
│       ├── VODMLMapperServlet.java        # Main servlet (301 lines)
│       ├── MongoDBHelper363.java          # MongoDB operations (505 lines)
│       ├── TAPInterpreter.java            # TAP protocol handler (372 lines)
│       ├── RegistryServlet.java           # Registry operations (438 lines)
│       └── VOTABLE_JAXBHelper.java        # VOTable parsing (124 lines)
│
├── jaxb-gen/                              # JAXB auto-generated classes (DO NOT EDIT)
│   └── org/ivoa/
│       ├── vodml/jaxb/                    # VO-DML model classes
│       ├── vodml/mapper/jaxb/             # TAP schema mapping
│       ├── vodml/mapping/jaxb/            # Mapping definitions
│       ├── vodml/instance/jaxb/           # VO-DML instances
│       ├── votable/jaxb/                  # VOTable 1.3
│       └── votable_1_4/jaxb/              # VOTable 1.4 with VO-DML extensions
│
├── vodml/                                 # VO-DML library (49 Java files)
│   └── src/org/ivoa/vodml/
│       ├── graph/                         # Model graph representation (17 classes)
│       │   ├── ModelGraph.java           # Core graph structure
│       │   ├── ObjectTypeNode.java
│       │   ├── AttributeNode.java
│       │   └── ...
│       ├── model/                         # Object instances (8 classes)
│       ├── VODML_JAXBHelper.java         # JAXB utilities (synchronized)
│       ├── VODMLManager.java             # Model registry
│       └── Utype.java                    # UType path parsing
│
├── WebContent/                            # Web application files
│   ├── index.jsp                         # Main entry point
│   ├── initdialogs.jsp                   # Dialog initialization
│   ├── WEB-INF/
│   │   ├── web.xml.template              # Servlet config template
│   │   └── classes/                      # Compiled Java classes
│   ├── js/                               # JavaScript (~105KB)
│   │   ├── vo-dml.mvc.mapper.js          # Main mapper controller (1,992 lines)
│   │   ├── short-vodml.annotation2.js    # VOTable annotation generator
│   │   ├── tables-manager.js             # Table management
│   │   ├── vo-dml.mvc.js                 # Base MVC framework
│   │   └── ...
│   ├── xsd/                              # XML Schema definitions
│   │   ├── build.xml                     # Ant build for JAXB generation
│   │   ├── vo-dml-v1.0.xsd              # VO-DML model schema
│   │   ├── VOTable-1.4_vodml.xsd        # VOTable with VO-DML extensions
│   │   └── ...
│   ├── css/                              # Stylesheets
│   └── samples/                          # Example mapping files
│
├── states/                                # Saved mapping states (JSON)
├── auth/                                  # Authentication configuration
│   ├── JdbcRealm.sql                     # User database schema
│   └── mongodb.txt                       # MongoDB setup notes
└── doc/                                   # Documentation
    └── TODO.txt                          # Development roadmap
```

## Key Concepts

### VO-DML Models

VO-DML models define semantic data structures for astronomical data. They are XML documents describing:
- **ObjectTypes** - Complex objects with identity (e.g., Source, Observation)
- **DataTypes** - Value objects without identity (e.g., Position, Magnitude)
- **PrimitiveTypes** - Basic types (string, real, integer, boolean)
- **Attributes** - Properties of types
- **References** - Relationships between objects
- **Compositions** - Containment relationships

Models are loaded from URLs and cached in `VODMLManager`.

### TAP Schemas

TAP (Table Access Protocol) schemas describe database table structures. The mapper queries TAP services via `TAPInterpreter.java` to retrieve:
- Schema metadata
- Table definitions
- Column descriptions

TAP queries use VOTable format for responses, parsed with the Starlink table library.

### Mapping Process

1. Load VO-DML model (creates graph representation)
2. Load data source (TAP schema or VOTable)
3. Drag model types onto canvas (creates visual nodes)
4. Draw connections between model attributes and table columns (creates edges)
5. Export mapping as:
   - VOTable with VO-DML annotations (for data)
   - Mapping definition (for reuse)

### VOTable Annotation

The mapper generates VOTable XML with embedded VO-DML annotations describing how table data maps to model instances. This is handled by `SHORTVODML2VOTableAnnotator` which:
1. Traverses the mapper graph
2. Builds VODML elements referencing model types
3. Links TABLE FIELDs to model attributes via vodml-id references
4. Serializes via JAXB marshalling

## Database Options

The application supports two database backends:

### MongoDB (Default)

- **mappings** - User-created mapping definitions (public/private)
- **models** - Cached VO-DML models
- **schemas** - Cached TAP schemas
- **GridFS** - Large binary files (VOTables, models)

Access via `MongoDBHelper363.java` (singleton pattern) at `src/net/ivoa/dm/vodml/mapper/MongoDBHelper363.java:505`

### SQL Server (Alternative)

As an alternative to MongoDB, `SQLServerDBHelper.java` provides equivalent functionality using SQL Server 2016+.

**Tables:**
- `ivoa_models` - Model metadata
- `ivoa_model_files` - Model XML content (XML data type)
- `user_mappings` - Private mapping states (JSON as NVARCHAR(MAX))
- `public_mappings` - Published mapping states (JSON as NVARCHAR(MAX))
- `user_files` - Binary file storage (VARBINARY(MAX))
- `users` - User information

**Setup:**
```bash
# 1. Create database
sqlcmd -S localhost -U sa -Q "CREATE DATABASE vodmlmapper"

# 2. Run schema script
sqlcmd -S localhost -U sa -d vodmlmapper -i sql/sqlserver_schema.sql

# 3. Configure web.xml with sqlserver-* parameters instead of mongodb-*
```

**Key differences from MongoDB:**
- Uses JDBC with SQL Server driver (mssql-jdbc)
- JSON stored as validated NVARCHAR(MAX) with ISJSON() constraint
- XML stored as native XML data type
- Files stored as VARBINARY(MAX) instead of GridFS
- Queries use SQL LIKE for JSON field matching (can be optimized with indexed computed columns)

Access via `SQLServerDBHelper.java` (singleton pattern) at `src/net/ivoa/dm/vodml/mapper/SQLServerDBHelper.java`

See `sql/README.md` for detailed SQL Server setup and configuration.

## Common Development Patterns

### Adding a New Servlet Action

In `VODMLMapperServlet.java`:

```java
String action = request.getParameter("action");

if (action.equals("myNewAction")) {
    // Process request
    String result = performAction();

    // Return JSON response
    response.setContentType("application/json");
    response.getWriter().write(jsonResult);
}
```

### Loading a VO-DML Model

```java
// Server-side
VODMLManager manager = VODMLManager.getInstance();
Model model = manager.loadModel(url);
ModelGraph graph = new ModelGraph(model);

// Returns model structure as JSON to client
```

### Parsing VOTable

```java
// Using JAXB helper (thread-safe)
VOTABLE votable = VOTABLE_JAXBHelper.parseVOTABLE(url, validate);

// Or using Starlink for table data access
VOTableBuilder builder = new VOTableBuilder();
StarTable table = builder.build(inputStream);
```

## Important Notes

### Thread Safety

- JAXB helpers use synchronized methods to prevent concurrent access issues
- Multiple users can load models simultaneously without conflicts
- MongoDB operations are handled via singleton `MongoDBHelper`

### JAXB Regeneration

When modifying XSD schemas:
1. Edit the `.xsd` file in `WebContent/xsd/`
2. Run `ant xjc-all` to regenerate Java classes
3. Rebuild and redeploy application
4. Test thoroughly - JAXB changes affect XML parsing/serialization

### State Management

- Client-side state stored in JavaScript `mapperState` object
- Server-side persistence via MongoDB
- State serialization format is JSON (mappings, positions, connections)

### Authentication

- Uses Java servlet security (BASIC auth configured in web.xml)
- User identity via `request.getRemoteUser()`
- Private registry endpoints require authentication
- Public endpoints accessible without auth

## Troubleshooting

### JAXB Parsing Errors

Check synchronization in helper classes. If you see parser conflicts, ensure `VODML_JAXBHelper` methods are synchronized.

### Connection Drawing Issues

jsPlumb library (version 1.6.2) handles visual connections. Check:
- `MapperController.drawConnection()` in vo-dml.mvc.mapper.js
- Endpoint configurations for multiplicity constraints

### TAP Query Failures

`TAPInterpreter.java` logs all HTTP calls. Check:
- TAP endpoint URL format
- VOTable response parsing
- Network connectivity to remote services

### MongoDB Connection Issues

Verify `web.xml` MongoDB parameters match your MongoDB instance. Connection handled in `MongoDBHelper363.java` constructor.
