# KickLoad Gatling Test Generator
## Complete User Guide

---

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [How to Use](#how-to-use)
4. [Prompt Examples](#prompt-examples)
5. [File Upload Feature](#file-upload-feature)
6. [Understanding the Output](#understanding-the-output)
7. [Action Modal](#action-modal)
8. [Running Your Tests](#running-your-tests)
9. [Troubleshooting](#troubleshooting)
10. [FAQ](#faq)

---

## Introduction

The **Gatling Test Generator** is an AI-powered tool that creates Gatling Scala test scripts for load and performance testing. Simply describe your test scenario in plain English, and the AI generates a ready-to-use Gatling script.

### What is Gatling?

Gatling is a powerful open-source load testing tool designed for testing web applications. It uses Scala as its scripting language and provides detailed performance reports.

### Key Features

- ✅ AI-powered test generation using Gemini
- ✅ Natural language prompts
- ✅ Upload and modify existing Scala files
- ✅ Instant file preview
- ✅ Download ready-to-use scripts
- ✅ Automatic validation

---

## Getting Started

### Accessing the Feature

1. **Login** to KickLoad application
2. Click the **Settings** icon (⚙️) in the header
3. Select **"Gatling"** (orange lightning bolt icon ⚡)

### First Time Setup

No setup required! The feature is ready to use immediately.

---

## How to Use

### Step 1: Describe Your Test

Type your test scenario in the chat input box. Be specific about:

- **URL**: Full URL including protocol (https://)
- **HTTP Method**: GET, POST, PUT, DELETE, etc.
- **Endpoint**: The API path (e.g., /users, /login)
- **Number of Users**: How many virtual users to simulate

### Step 2: Send Your Request

Click the **Send** button or press **Enter** to submit your prompt.

### Step 3: Wait for Generation

The AI will generate your Gatling script in approximately 10-30 seconds.

### Step 4: Review and Download

A modal will appear with options to:
- **View** the generated Scala code
- **Download** the .scala file
- **Rename** the file (coming soon)
- **Delete** the file (coming soon)

---

## Prompt Examples

### Basic Examples

#### Example 1: Simple GET Request
```
Test GET https://api.example.com/users with 50 users
```

**Generated Output:**
```scala
package simulations

import io.gatling.core.Predef._
import io.gatling.http.Predef._
import scala.concurrent.duration._

class GetUsersSimulation extends Simulation {
  val httpProtocol = http
    .baseUrl("https://api.example.com")
    .acceptHeader("application/json")
  
  val scn = scenario("Get Users Scenario")
    .exec(http("Get all users")
      .get("/users")
      .check(status.is(200)))
  
  setUp(
    scn.inject(atOnceUsers(50))
  ).protocols(httpProtocol)
}
```

#### Example 2: POST Request
```
Test POST https://api.example.com/login with 100 users
```

#### Example 3: Load Test with Ramp-Up
```
Create a load test for https://shop.example.com with 500 users ramping up over 60 seconds
```

#### Example 4: Multiple Endpoints
```
Run a load test on https://api.example.com with 200 users hitting:
- GET /products
- POST /cart/add
- PUT /checkout/confirm
```

### Advanced Examples

#### Example 5: Stress Test
```
Simulate 1000 concurrent users hitting GET https://api.example.com/products
```

#### Example 6: API with Headers
```
Test POST https://api.example.com/data with 100 users sending JSON data with authentication headers
```

#### Example 7: Gradual Load
```
Generate a test for https://example.com/api with 300 users starting with 10 users per second
```

---

## File Upload Feature

### Uploading Existing Scala Files

You can upload existing Gatling Scala files (.scala) for modification or validation.

#### How to Upload

1. Click the **Upload** icon (📎) next to the send button
2. Select **"Upload Scala file"** from the dropdown
3. Choose your `.scala` file
4. Optionally add a prompt describing changes
5. Click **Send**

### Use Cases

#### Use Case 1: Validate Existing Script
```
Action: Upload file only (no prompt)
Result: File is validated and saved if correct
```

#### Use Case 2: Modify Script
```
Upload: my_test.scala
Prompt: "Change user count to 1000"
Result: AI modifies the script and saves new version
```

#### Use Case 3: Fix Errors
```
Upload: broken_test.scala
Prompt: "Fix this script and make it ready to run"
Result: AI fixes errors and generates valid script
```

### File Requirements

- **Extension**: Must be `.scala`
- **Content**: Valid Gatling Scala test script
- **Limit**: One file at a time

---

## Understanding the Output

### File Naming Convention

Generated files follow this pattern:
```
gatling_test_DD-MM-YYYY_HH-MM-SS.scala
```

Example:
```
gatling_test_04-03-2026_15-30-45.scala
```

For uploaded files:
```
{original_name}_DD-MM-YYYY_HH-MM-SS.scala
```

Example:
```
my_test_04-03-2026_15-30-45.scala
```

### Script Structure

Every generated Gatling script contains:

1. **Package Declaration**
```scala
package simulations
```

2. **Required Imports**
```scala
import io.gatling.core.Predef._
import io.gatling.http.Predef._
import scala.concurrent.duration._
```

3. **Simulation Class**
```scala
class MySimulation extends Simulation {
  // Test configuration
}
```

4. **HTTP Protocol Configuration**
```scala
val httpProtocol = http
  .baseUrl("https://api.example.com")
  .acceptHeader("application/json")
```

5. **Scenario Definition**
```scala
val scn = scenario("Test Scenario")
  .exec(http("Request Name")
    .get("/endpoint")
    .check(status.is(200)))
```

6. **Load Injection Profile**
```scala
setUp(
  scn.inject(atOnceUsers(50))
).protocols(httpProtocol)
```

---

## Action Modal

After generating a test, an action modal appears with four options:

### 🔍 View

**Purpose**: Preview the generated Scala code

**How to Use**:
1. Click the **View** button
2. A file viewer modal opens
3. Scroll through the Scala code
4. Click **X** to close

**When to Use**: Before downloading, to verify the script is correct

### ⬇️ Download

**Purpose**: Download the .scala file to your computer

**How to Use**:
1. Click the **Download** button
2. File downloads automatically
3. Save to your desired location

**When to Use**: When you're ready to run the test with Gatling

### ✏️ Rename

**Status**: Coming soon

**Purpose**: Rename the generated file

### 🗑️ Delete

**Status**: Coming soon

**Purpose**: Delete the generated file

---

## Running Your Tests

### Prerequisites

1. **Install Gatling**
   - Download from: https://gatling.io/open-source/
   - Extract to your preferred location

2. **Install Java**
   - Gatling requires Java 8 or higher
   - Download from: https://www.oracle.com/java/technologies/downloads/

### Running the Test

#### Method 1: Using Gatling Command Line

1. **Copy your .scala file** to Gatling's simulations folder:
```
gatling/user-files/simulations/
```

2. **Run Gatling**:
```bash
cd /path/to/gatling
./bin/gatling.sh
```

3. **Select your simulation** from the list

4. **View results** in the generated HTML report

#### Method 2: Using Gatling Maven Plugin

1. **Add to your pom.xml**:
```xml
<plugin>
  <groupId>io.gatling</groupId>
  <artifactId>gatling-maven-plugin</artifactId>
  <version>4.3.0</version>
</plugin>
```

2. **Run with Maven**:
```bash
mvn gatling:test
```

#### Method 3: Using Gatling Gradle Plugin

1. **Add to your build.gradle**:
```gradle
plugins {
  id 'io.gatling.gradle' version '3.9.5'
}
```

2. **Run with Gradle**:
```bash
./gradlew gatlingRun
```

### Understanding Results

Gatling generates an HTML report with:
- **Response time percentiles**
- **Requests per second**
- **Success/failure rates**
- **Detailed timeline charts**

---

## Troubleshooting

### Common Issues

#### Issue 1: "Prompt is too short"

**Problem**: Your prompt doesn't have enough detail

**Solution**: Include URL, method, endpoint, and user count
```
✗ Bad: "test api"
✓ Good: "Test GET https://api.example.com/users with 50 users"
```

#### Issue 2: "Request took too long"

**Problem**: Generation exceeded 2 minutes

**Solution**: Simplify your prompt or break into smaller requests
```
✗ Bad: "Create complex test with 10 different endpoints and various scenarios"
✓ Good: "Test GET https://api.example.com/users with 50 users"
```

#### Issue 3: "Only .scala files are allowed"

**Problem**: Uploaded file has wrong extension

**Solution**: Ensure file ends with `.scala`

#### Issue 4: "Failed to generate valid script"

**Problem**: AI couldn't create valid Gatling script after 3 attempts

**Solution**: 
- Rephrase your prompt
- Be more specific about requirements
- Try a simpler test first

### Getting Help

If you encounter issues:

1. **Type 'help'** in the chat for instructions
2. **Type 'clear'** to reset and start over
3. **Check your prompt** follows the examples
4. **Contact support** if problem persists

---

## FAQ

### General Questions

**Q: What is the difference between JMeter and Gatling?**

A: Both are load testing tools, but:
- JMeter uses XML configuration (.jmx files)
- Gatling uses Scala code (.scala files)
- Gatling is generally faster and more developer-friendly
- JMeter has a GUI, Gatling is code-based

**Q: Do I need to know Scala to use this feature?**

A: No! The AI generates the Scala code for you. You just describe your test in plain English.

**Q: Can I modify the generated script?**

A: Yes! You can:
- Edit the .scala file manually
- Re-upload it with modification instructions
- Ask the AI to make specific changes

**Q: How many tests can I generate?**

A: Rate limit is 5 requests per minute. No daily limit.

### Technical Questions

**Q: What Gatling version is supported?**

A: Generated scripts are compatible with Gatling 3.x and 4.x

**Q: Can I use CSV data files?**

A: Not yet, but this feature is planned for future release.

**Q: Can I test HTTPS endpoints?**

A: Yes! Just include `https://` in your URL.

**Q: Can I add custom headers?**

A: Yes! Mention it in your prompt:
```
"Test POST https://api.example.com/data with 100 users using Bearer token authentication"
```

**Q: Can I test WebSocket connections?**

A: Not currently supported. Feature may be added in future.

### Prompt Questions

**Q: What's the minimum prompt length?**

A: At least 10 characters, but be specific for best results.

**Q: Can I use abbreviations?**

A: Yes, common abbreviations work:
- API, REST, HTTP, GET, POST, etc.

**Q: Do I need to specify HTTP method?**

A: Not required, but recommended. Default is GET if not specified.

**Q: Can I test multiple endpoints in one script?**

A: Yes! List them in your prompt:
```
"Test https://api.example.com with 100 users:
- GET /users
- POST /login
- PUT /profile"
```

### File Questions

**Q: Where are my files stored?**

A: Files are stored in `uploads/{your-email}/` folder on the server.

**Q: How long are files kept?**

A: Files are kept indefinitely unless manually deleted.

**Q: Can I download files later?**

A: Currently, download is only available immediately after generation. History feature coming soon.

**Q: What's the file size limit?**

A: No explicit limit, but keep scripts reasonable (< 1MB).

---

## Quick Reference

### Chat Commands

| Command | Description |
|---------|-------------|
| `help` | Show help instructions |
| `upload scala` | Learn about file upload |
| `clear` or `reset` | Restart the chat |

### Prompt Template

```
[Action] [Method] [URL] with [Number] users [Optional: additional details]
```

Examples:
```
Test GET https://api.example.com/users with 50 users
Simulate POST https://api.example.com/login with 100 users
Run load test on https://shop.example.com with 500 users ramping up over 60 seconds
```

### File Extensions

| Type | Extension | Purpose |
|------|-----------|---------|
| Gatling Script | `.scala` | Test script to run with Gatling |
| JMeter Script | `.jmx` | Test script to run with JMeter |

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Enter` | Send message |
| `Shift + Enter` | New line in message |

---

## Support

For additional help or questions:

- **Email**: support@neeyatai.com
- **Documentation**: https://docs.neeyatai.com
- **Gatling Docs**: https://gatling.io/docs/

---

## Appendix: Complete Example

### Scenario

You want to test a REST API endpoint that returns user data.

### Step-by-Step

1. **Access Gatling Generator**
   - Login to KickLoad
   - Click Settings → Gatling

2. **Enter Prompt**
```
Test GET https://api.example.com/users with 50 users
```

3. **Wait for Generation**
   - AI processes your request (~15 seconds)
   - Modal appears with generated file

4. **View the Script**
   - Click "View" button
   - Review the Scala code:

```scala
package simulations

import io.gatling.core.Predef._
import io.gatling.http.Predef._
import scala.concurrent.duration._

class GetUsersSimulation extends Simulation {
  val httpProtocol = http
    .baseUrl("https://api.example.com")
    .acceptHeader("application/json")
    .contentTypeHeader("application/json")
    .userAgentHeader("Gatling/PerformanceTest")

  val scn = scenario("Get Users Scenario")
    .exec(http("Get all users")
      .get("/users")
      .check(status.is(200)))

  setUp(scn.inject(atOnceUsers(50))).protocols(httpProtocol)
}
```

5. **Download the File**
   - Click "Download" button
   - Save as: `gatling_test_04-03-2026_15-30-45.scala`

6. **Run with Gatling**
```bash
# Copy to Gatling folder
cp gatling_test_04-03-2026_15-30-45.scala ~/gatling/user-files/simulations/

# Run Gatling
cd ~/gatling
./bin/gatling.sh

# Select your simulation
# View results in generated HTML report
```

7. **Analyze Results**
   - Open the HTML report
   - Check response times
   - Verify success rates
   - Identify bottlenecks

---

## Version Information

- **Feature Version**: 1.0
- **Last Updated**: March 4, 2026
- **Gatling Compatibility**: 3.x, 4.x
- **AI Model**: Gemini 2.5 Flash

---

## Changelog

### Version 1.0 (March 2026)
- ✅ Initial release
- ✅ AI-powered test generation
- ✅ File upload support
- ✅ Action modal with view/download
- ✅ Automatic validation
- ✅ Natural language prompts

### Planned Features
- 🔜 Test history panel
- 🔜 Rename/delete functionality
- 🔜 CSV data file support
- 🔜 Multiple scenario support
- 🔜 Test execution integration

---

**End of User Guide**

For the latest updates and features, visit: https://kickload.neeyatai.com
