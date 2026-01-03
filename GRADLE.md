# Gradle Build Guide for VODML-Mapper

This document provides detailed instructions for building VODML-Mapper using Gradle.

## Prerequisites

- **Java Development Kit (JDK)** 8 or later
  - Java 8, 11, 17, or 21 recommended
  - Check version: `java -version`
  - Set `JAVA_HOME` environment variable

- **No Gradle installation required!**
  - The project includes Gradle Wrapper (`gradlew` / `gradlew.bat`)
  - Wrapper automatically downloads the correct Gradle version

## Quick Start

### Build the Project

```bash
# On Linux/macOS:
./gradlew build

# On Windows:
gradlew.bat build
```

This single command will:
1. Generate JAXB classes from XSD schemas
2. Compile all Java sources
3. Package everything into a WAR file
4. Output: `build/libs/vodml-mapper-1.0.0-SNAPSHOT.war`

### Deploy the WAR

```bash
# Copy to Tomcat webapps directory (example)
cp build/libs/vodml-mapper-1.0.0-SNAPSHOT.war $TOMCAT_HOME/webapps/

# Or deploy to your application server of choice
```

## Detailed Build Commands

### Core Build Tasks

```bash
# Full clean build
./gradlew clean build

# Build without running tests (faster)
./gradlew build -x test

# Create WAR file only
./gradlew war

# Compile Java sources only
./gradlew compileJava

# Run tests
./gradlew test

# Clean all build outputs
./gradlew clean
```

### JAXB Code Generation

```bash
# Generate JAXB classes from XSD schemas
./gradlew generateJaxb

# Clean and regenerate JAXB classes
./gradlew clean generateJaxb
```

JAXB classes are generated from schemas in `WebContent/xsd/` to `jaxb-gen/`:

| Schema | Output Package |
|--------|----------------|
| vo-dml-v1.0.xsd | org.ivoa.vodml.jaxb |
| VO-DML_Mapper.xsd | org.ivoa.vodml.mapper.jaxb |
| vo-dml.mapping.xsd | org.ivoa.vodml.mapping.jaxb |
| VOTable-1.4_vodml.xsd | org.ivoa.votable_1_4.jaxb |
| VOTable-1.3.xsd | org.ivoa.votable.jaxb |
| vo-dml-instance.xsd | org.ivoa.vodml.instance.jaxb |

### Dependency Management

```bash
# View all dependencies
./gradlew dependencies

# Copy runtime dependencies to WebContent/WEB-INF/lib
./gradlew copyDependencies

# Check for dependency updates
./gradlew dependencyUpdates  # requires plugin
```

### IDE Integration

```bash
# Generate Eclipse project files (.project, .classpath, etc.)
./gradlew eclipse

# Generate IntelliJ IDEA project files (.iml, .idea/)
./gradlew idea

# Clean Eclipse files
./gradlew cleanEclipse

# Clean IDEA files
./gradlew cleanIdea
```

After generating project files:
- **Eclipse**: Import as "Existing Projects into Workspace"
- **IntelliJ IDEA**: Open the project directory or import the `.iml` file

### Configuration Tasks

```bash
# Create web.xml from template
./gradlew createWebXml

# Display project information
./gradlew projectInfo

# List all available tasks
./gradlew tasks

# List all tasks with descriptions
./gradlew tasks --all
```

### Database Setup Tasks

```bash
# Display SQL Server setup instructions
./gradlew setupSqlServer
```

## Project Structure

```
VODML-Mapper/
├── build.gradle              # Main build configuration
├── settings.gradle           # Project settings
├── gradle.properties         # Build properties
├── gradlew                   # Gradle wrapper (Unix/Mac)
├── gradlew.bat              # Gradle wrapper (Windows)
├── gradle/
│   └── wrapper/
│       └── gradle-wrapper.properties
│
├── src/                      # Java source code
├── vodml/src/               # VODML library source
├── jaxb-gen/                # Generated JAXB classes
├── WebContent/              # Web application files
│   ├── WEB-INF/
│   │   ├── web.xml.template
│   │   └── lib/             # Runtime dependencies (populated by Gradle)
│   ├── js/                  # JavaScript files
│   ├── css/                 # Stylesheets
│   ├── xsd/                 # XML Schema definitions
│   └── ...
│
└── build/                   # Build outputs (created by Gradle)
    ├── classes/             # Compiled .class files
    ├── libs/                # Generated WAR file
    └── ...
```

## Dependencies

All dependencies are automatically managed by Gradle and downloaded from Maven Central.

### Runtime Dependencies

- **Servlet API** 3.1.0 (provided)
- **JAXB** 2.3.1 (API and implementation)
- **MongoDB Driver** 3.12.14
- **SQL Server JDBC Driver** 12.4.2
- **Apache HTTP Client** 4.5.14
- **Apache Commons IO** 2.11.0
- **Apache Commons FileUpload** 1.5
- **Log4j2** 2.20.0
- **JSON** (org.json) 20231013
- **Starlink STIL** 4.1.6 (VOTable parsing)

### Test Dependencies

- **JUnit** 4.13.2
- **Mockito** 5.6.0

## Configuration

### Build Configuration

Edit `gradle.properties` to customize:

```properties
# Java version
javaVersion=1.8

# WAR file naming
warArchiveBaseName=vodml-mapper
warArchiveVersion=1.0.0-SNAPSHOT

# Build performance
org.gradle.jvmargs=-Xmx2048m
org.gradle.parallel=true
org.gradle.caching=true
```

### Dependency Versions

Edit `build.gradle` to change dependency versions:

```gradle
ext {
    servletApiVersion = '3.1.0'
    mongoDriverVersion = '3.12.14'
    // ... etc
}
```

## Advanced Usage

### Running with Different Java Versions

```bash
# Use specific Java version
JAVA_HOME=/path/to/java17 ./gradlew build

# Or set in gradle.properties
org.gradle.java.home=/path/to/java17
```

### Build with Debug Information

```bash
# Enable detailed logging
./gradlew build --info

# Enable debug logging
./gradlew build --debug

# Show stack traces for errors
./gradlew build --stacktrace
```

### Offline Build

```bash
# Build without downloading dependencies (uses local cache)
./gradlew build --offline
```

### Parallel Builds

```bash
# Enable parallel execution (faster on multi-core CPUs)
./gradlew build --parallel
```

### Custom Build Tasks

You can define custom tasks in `build.gradle`. Example:

```gradle
task deployLocal(type: Copy) {
    dependsOn war
    from war.archiveFile
    into '/path/to/tomcat/webapps'
}
```

Then run: `./gradlew deployLocal`

## Continuous Integration

### GitHub Actions Example

```yaml
name: Build

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Set up JDK 8
        uses: actions/setup-java@v3
        with:
          java-version: '8'
          distribution: 'temurin'

      - name: Build with Gradle
        run: ./gradlew build

      - name: Upload WAR
        uses: actions/upload-artifact@v3
        with:
          name: vodml-mapper-war
          path: build/libs/*.war
```

### Jenkins Example

```groovy
pipeline {
    agent any

    tools {
        jdk 'JDK8'
    }

    stages {
        stage('Build') {
            steps {
                sh './gradlew clean build'
            }
        }

        stage('Test') {
            steps {
                sh './gradlew test'
            }
        }

        stage('Archive') {
            steps {
                archiveArtifacts artifacts: 'build/libs/*.war', fingerprint: true
            }
        }
    }
}
```

## Troubleshooting

### Permission Denied (Unix/Mac)

```bash
# Make gradlew executable
chmod +x gradlew
```

### Out of Memory Errors

Increase memory in `gradle.properties`:

```properties
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m
```

### Dependency Download Failures

```bash
# Clear Gradle cache
rm -rf ~/.gradle/caches/

# Retry build
./gradlew build --refresh-dependencies
```

### JAXB Generation Errors

```bash
# Clean and regenerate
./gradlew clean generateJaxb

# Check XSD files exist in WebContent/xsd/
ls -la WebContent/xsd/*.xsd
```

### Build Cache Issues

```bash
# Disable build cache temporarily
./gradlew build --no-build-cache

# Or clear build cache
./gradlew cleanBuildCache
```

## Migration from Ant

If you're migrating from Ant:

1. **Dependencies**: Remove manual JAR management. Gradle handles this automatically.

2. **JAXB Generation**: The Ant task in `WebContent/xsd/build.xml` is preserved but Gradle provides `generateJaxb` task.

3. **Build Output**: Ant used `WebContent/WEB-INF/classes`, Gradle uses `build/classes`.

4. **WAR Packaging**: Gradle's `war` task creates a complete WAR file in `build/libs/`.

Both build systems can coexist. Gradle is recommended for new development.

## Further Reading

- [Gradle User Guide](https://docs.gradle.org/current/userguide/userguide.html)
- [Gradle War Plugin](https://docs.gradle.org/current/userguide/war_plugin.html)
- [Gradle Dependency Management](https://docs.gradle.org/current/userguide/dependency_management.html)
- [JAXB with Gradle](https://github.com/jacobono/gradle-jaxb-plugin)

## Getting Help

For Gradle-specific issues:
- Run `./gradlew help` for basic help
- Run `./gradlew tasks --all` to see all available tasks
- Check the [Gradle Forums](https://discuss.gradle.org/)

For VODML-Mapper build issues:
- Check `CLAUDE.md` for project-specific documentation
- Review build logs with `./gradlew build --info`
