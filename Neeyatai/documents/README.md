# JMeter EC2 Setup & Usage Guide

This document explains how to connect to the AWS EC2 instance, manage the environment, transfer files, check services/logs, and understand the HTTPS setup used with Cloudflare.

---

## 🔑 Connect to AWS EC2 Instance

> **Note:** Ensure that the `jmeter-key.pem` file is present in the current working directory before running the command.

```bash
ssh -i jmeter-key.pem ec2-user@16.171.52.5
```

---

## ⚙️ Running Setup Scripts

- **Start fresh (clean and rebuild everything):**
  ```bash
  sudo ./clean_and_up.sh
  ```

- **Quick start (clean only partially and start):**
  ```bash
  sudo ./quick-clean.sh
  ```

---

## 📂 Transferring Files Between EC2 and Local

- **Copy files from EC2 to local machine:**
  ```bash
  scp -i .\jmeter-key.pem -r ec2-user@16.171.52.5:/home/ec2-user/jmeter .\jmeter
  ```

---

## 💾 Check Volumes (Disk Space)

```bash
df -hT
```

---

## 📝 Logs

- **Check logs of Flask application (last 3 minutes):**
  ```bash
  sudo docker logs --since 3m flask_app
  ```

---

## 🍃 MongoDB

- **Connection string (use in MongoDB Compass):**
  ```
  mongodb://admin:admin123@localhost:27018/jmeter_tool?authSource=admin
  ```

- **Create SSH tunnel for MongoDB:**
  > **Note:** Ensure that the `jmeter-key.pem` file is present in the same directory where you run this command.

  ```bash
  ssh -i jmeter-key.pem -L 27018:127.0.0.1:27017 ec2-user@16.171.52.5
  ```

---

## 🌐 HTTPS Certificates & Cloudflare

The EC2 instance is already configured with SSL certificates to enable secure HTTPS access through Cloudflare.

- **Files used for API domain:**
  - `api.neeyatai.com.crt`
  - `api.neeyatai.com.key`

- **Files used for Jenkins domain:**
  - `jenkins.neeyatai.com.crt`
  - `jenkins.neeyatai.com.key`

These certificates are installed and linked within the EC2 setup to ensure proper HTTPS hosting through Cloudflare.  
You should **not modify or delete these files**, as they are required for HTTPS functionality.

---

## 📄 Reference File: aws.txt

There is also an **`aws.txt`** file in the project.  
It contains the same key commands for connecting to the EC2 instance, restarting services, transferring files, checking logs, and MongoDB connection details.  

This file can be used as a **quick reference guide** when working on the EC2 instance without needing to open the full documentation.

---

## ✅ Summary

- Use `ssh` to connect to the EC2 instance.  
- Ensure `jmeter-key.pem` is in the same directory where you run the command.  
- Use `clean_and_up.sh` for a full reset and `quick-clean.sh` for a faster restart.  
- Use `scp` to transfer files between EC2 and your local machine.  
- Use `df -hT` to check disk space.  
- Check Flask logs with Docker.  
- Connect to MongoDB either directly (if inside EC2) or via SSH tunneling.  
- SSL certificates (`*.crt` and `*.key`) are already configured to support HTTPS via Cloudflare.  
- **`aws.txt`** is available as a quick reference for essential EC2 commands.
- **backend.env** is the env file used for backend.
- **KickLoad.env** is the env file used for KickLoad.
- **NeeyatAILanding.env** is the env file used for NeeyatAI Landing Page.

---

📌 Keep your **`jmeter-key.pem`** file safe, as it’s required for SSH and SCP access.  
📌 Do not delete or modify SSL certificate files, as they are critical for HTTPS hosting.
