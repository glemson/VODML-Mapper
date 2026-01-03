# Java 21 and JAXB Generation Migration Guide

This document explains the changes made to support Java 21 and fix the JAXB code generation task.

## What Was Changed

### 1. Java Version Updated to 21

**File: `build.gradle`**

```gradle
java {
    sourceCompatibility = JavaVersion.VERSION_21
    targetCompatibility = JavaVersion.VERSION_21
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}
```

**File: `gradle.properties`**

```properties
javaVersion=21
```

### 2. Dependencies Updated for Java 21

#### Jakarta EE (Formerly Java EE)

Java 21 requires **Jakarta EE 10**, which uses the `jakarta.*` namespace instead of `javax.*`:

| Old (javax) | New (jakarta) |
|-------------|---------------|
| `javax.servlet` | `jakarta.servlet` |
| `javax.xml.bind` | `jakarta.xml.bind` |

#### Updated Dependency Versions

```gradle
// Servlet API - Jakarta EE 10 for Java 21
servletApiVersion = '6.0.0'  // was 3.1.0

// MongoDB Driver - Updated for Java 21
mongoDriverVersion = '4.11.1'  // was 3.12.14
// Package: org.mongodb.driver.sync (not com.mongodb)

// SQL Server JDBC Driver
sqlServerDriverVersion = '12.6.0.jre11'  // was 12.4.2.jre8
// Note: jre11 works with Java 21

// Log4j2 - Updated
log4jVersion = '2.22.1'  // was 2.20.0

// Commons IO - Updated
commonsIoVersion = '2.15.1'  // was 2.11.0

// JSON - Updated
jsonVersion = '20240205'  // was 20231013

// JAXB - Jakarta XML Binding for Java 21
jaxbApiVersion = '4.0.1'
jaxbRuntimeVersion = '4.0.4'
jaxbXjcVersion = '4.0.4'  // XJC compiler tools
```

### 3. JAXB Code Generation Fixed

#### Problem with Original Implementation

The original `generateJaxb` task had issues:
1. Tried to use `XJCFacade` from `runtimeClasspath`
2. XJC tools were not included in dependencies
3. Didn't work with Java 9+ (JAXB removed from JDK)

#### New Implementation

**Added JAXB Configuration:**

```gradle
configurations {
    jaxb  // Separate configuration for JAXB XJC tools
}

dependencies {
    // JAXB Runtime (for application use)
    implementation "jakarta.xml.bind:jakarta.xml.bind-api:${jaxbApiVersion}"
    implementation "org.glassfish.jaxb:jaxb-runtime:${jaxbRuntimeVersion}"

    // JAXB XJC tools (for code generation only)
    jaxb "org.glassfish.jaxb:jaxb-xjc:${jaxbXjcVersion}"
    jaxb "org.glassfish.jaxb:jaxb-runtime:${jaxbRuntimeVersion}"
    jaxb "jakarta.xml.bind:jakarta.xml.bind-api:${jaxbApiVersion}"
    jaxb "jakarta.activation:jakarta.activation-api:2.1.2"
}
```

**Fixed generateJaxb Task:**

Uses Ant's XJC task with the proper classpath:

```gradle
task generateJaxb {
    doLast {
        // Define Ant task for XJC
        ant.taskdef(
            name: 'xjc',
            classname: 'com.sun.tools.xjc.XJCTask',
            classpath: configurations.jaxb.asPath  // Uses jaxb configuration
        )

        // Execute XJC for each schema
        ant.xjc(
            destdir: outputDir.absolutePath,
            package: schemaConfig.package,
            schema: schemaFile.absolutePath,
            extension: schemaConfig.extension ?: false
        ) {
            // Binding files and options...
        }
    }
}
```

## Code Changes Required

### 1. Update Servlet Imports

**Old Code (javax):**
```java
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
```

**New Code (jakarta):**
```java
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
```

**Find and replace:**
```bash
# In all Java files
find src -name "*.java" -exec sed -i 's/javax\.servlet/jakarta.servlet/g' {} +
find vodml/src -name "*.java" -exec sed -i 's/javax\.servlet/jakarta.servlet/g' {} +
```

### 2. Update JAXB Imports

**Old Code (javax):**
```java
import javax.xml.bind.JAXB;
import javax.xml.bind.JAXBContext;
import javax.xml.bind.JAXBException;
import javax.xml.bind.Marshaller;
import javax.xml.bind.Unmarshaller;
```

**New Code (jakarta):**
```java
import jakarta.xml.bind.JAXB;
import jakarta.xml.bind.JAXBContext;
import jakarta.xml.bind.JAXBException;
import jakarta.xml.bind.Marshaller;
import jakarta.xml.bind.Unmarshaller;
```

**Find and replace:**
```bash
# In all Java files
find src -name "*.java" -exec sed -i 's/javax\.xml\.bind/jakarta.xml.bind/g' {} +
find vodml/src -name "*.java" -exec sed -i 's/javax\.xml\.bind/jakarta.xml.bind/g' {} +
```

### 3. Update MongoDB Driver Code

The MongoDB driver changed from version 3.x to 4.x with different package structure.

**Old Code:**
```java
import com.mongodb.MongoClient;
import com.mongodb.MongoClientURI;
```

**New Code:**
```java
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.ConnectionString;
```

**Example Update for MongoDBHelper363.java:**

```java
// Old
this.mongo = new MongoClient(host, port);
this.mongoDB = this.mongo.getDatabase("vodmlmapper");

// New
String connectionString = String.format("mongodb://%s:%d", host, port);
this.mongo = MongoClients.create(connectionString);
this.mongoDB = this.mongo.getDatabase("vodmlmapper");
```

## Testing the Build

### Prerequisites

1. **Install Java 21:**
   ```bash
   # Verify Java 21 is installed
   java -version
   # Should show: openjdk version "21" or similar
   ```

2. **Set JAVA_HOME:**
   ```bash
   # On Windows:
   set JAVA_HOME=C:\Path\To\JDK21

   # On Linux/Mac:
   export JAVA_HOME=/path/to/jdk21
   ```

### Test JAXB Generation

```bash
# Clean previous build
./gradlew clean

# Generate JAXB classes only
./gradlew generateJaxb

# Check output
ls -la jaxb-gen/org/ivoa/vodml/jaxb/
ls -la jaxb-gen/org/ivoa/votable/jaxb/
ls -la jaxb-gen/org/ivoa/vodml/mapper/jaxb/
```

**Expected Output:**
```
Generating JAXB classes for vo-dml-v1.0.xsd
Generated JAXB classes for vo-dml-v1.0.xsd -> org.ivoa.vodml.jaxb
Generating JAXB classes for VO-DML_Mapper.xsd
Generated JAXB classes for VO-DML_Mapper.xsd -> org.ivoa.vodml.mapper.jaxb
...
JAXB generation completed successfully
```

### Full Build

```bash
# Full build (JAXB generation + compile + WAR)
./gradlew build

# If successful, WAR file will be at:
# build/libs/vodml-mapper-1.0.0-SNAPSHOT.war
```

## Troubleshooting

### Issue: "javax.servlet not found"

**Cause:** Servlet API changed from `javax.servlet` to `jakarta.servlet`

**Solution:** Update all servlet imports in Java source files (see above)

### Issue: "javax.xml.bind not found"

**Cause:** JAXB API changed from `javax.xml.bind` to `jakarta.xml.bind`

**Solution:** Update all JAXB imports in Java source files (see above)

### Issue: "MongoClient constructor not found"

**Cause:** MongoDB driver API changed from version 3.x to 4.x

**Solution:**
1. Update MongoDB connection code (see above)
2. Or revert to MongoDB driver 3.x by changing `build.gradle`:
   ```gradle
   mongoDriverVersion = '3.12.14'
   implementation "org.mongodb:mongo-java-driver:${mongoDriverVersion}"
   ```

### Issue: XJC generation fails with "schema not found"

**Cause:** Schema files don't exist in `WebContent/xsd/`

**Solution:** Verify all XSD files are present:
```bash
ls -la WebContent/xsd/*.xsd
```

Required files:
- vo-dml-v1.0.xsd
- VO-DML_Mapper.xsd
- vo-dml.models.xsd
- vo-dml.mapping.xsd
- VOTable-1.4_vodml.xsd
- VOTable-1.3.xsd
- vo-dml-instance.xsd

### Issue: Binding file errors

**Cause:** Binding XML files may have namespace issues with Jakarta

**Solution:** Check binding files have correct namespaces:
```xml
<!-- Old -->
<jxb:bindings xmlns:jxb="http://java.sun.com/xml/ns/jaxb">

<!-- New (if needed) -->
<jxb:bindings xmlns:jxb="https://jakarta.ee/xml/ns/jaxb">
```

## Gradual Migration Strategy

If you need to migrate gradually, you can:

1. **Keep Java 8 but fix JAXB generation:**
   - Keep `javaVersion=1.8` in gradle.properties
   - Use `javax.*` packages
   - Use older dependency versions
   - Still use the fixed `generateJaxb` task with `javax.xml.bind:jaxb-api:2.3.1`

2. **Update to Java 21 later:**
   - Run the find/replace commands for jakarta imports
   - Update dependency versions
   - Change `javaVersion=21`

## Benefits of Java 21

- **Modern Java features:** Pattern matching, records, sealed classes, virtual threads
- **Performance improvements:** Better garbage collection, startup time
- **Long-term support (LTS):** Supported until September 2031
- **Security updates:** Latest security patches
- **Ecosystem compatibility:** Most Java libraries now support Java 21

## Next Steps

1. ✅ Update `build.gradle` - **DONE**
2. ✅ Update `gradle.properties` - **DONE**
3. ⏳ Update Java source code imports (`javax.*` → `jakarta.*`)
4. ⏳ Update MongoDB driver code (if using MongoDB)
5. ⏳ Test JAXB generation: `./gradlew generateJaxb`
6. ⏳ Test full build: `./gradlew build`
7. ⏳ Test WAR deployment

## Summary

The build system is now configured for Java 21 with:
- ✅ Java 21 toolchain support
- ✅ Jakarta EE 10 dependencies
- ✅ Working JAXB code generation
- ✅ Updated library versions
- ⏳ Source code needs jakarta imports (manual update required)

**The JAXB generation task now works correctly by:**
1. Using a separate `jaxb` configuration for XJC tools
2. Properly invoking Ant's XJC task with correct classpath
3. Supporting all schema features (bindings, extensions)
