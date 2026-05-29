# AWS EC2 Node.js/Next.js Deployment Skill

## Objective
This skill empowers the AI assistant to guide users through the end-to-end lifecycle of deploying and managing Node.js/Next.js web applications on AWS EC2 using Ubuntu. The workflow encompasses infrastructure provisioning via Terraform, server configuration (Caddy, systemd), project deployment via rsync, DNS management with Route 53, and ongoing maintenance using journalctl, AI-driven log analysis, and automated Telegram notifications.

## Prerequisites
To follow this tutorial and execute this skill, the user will need:
- The **Terraform CLI (1.2.0+)** installed.
- The **AWS CLI** installed.
- An **AWS account** and associated credentials that allow you to create resources in the `us-west-2` region, including an EC2 instance, VPC, and security groups.

## Step 1: Create EC2 and Connect via SSH

### 1. Gathering Information
**CRITICAL AI INSTRUCTION:** When starting this skill, you must proactively guide the human to answer the following questions before generating any code or executing commands:
1. **Region**: Which AWS region should we deploy to? (e.g., `us-west-2`)
2. **EC2 Name**: What should we name the EC2 instance?
3. **Instance Type**: What instance type would you like? (e.g., `t3.micro`)
4. **Security Group Rules**: What ports do we need to open? (e.g., SSH port 22 for your IP, HTTP port 80, etc.)
5. **Key Pair**: Do you have an existing SSH Key Pair name in AWS, or do we need to create one?

### 2. Terraform Implementation
Once the user answers the questions:
- Use the provided `templates/main.tf` as a base or write a new one based on the user's answers.
- The configuration should include the AWS provider, a security group reflecting the requested rules, and the `aws_instance` resource.
- Be sure to add an `output` block to display the public IP of the EC2 instance.
- Reference: [Terraform AWS Get Started Tutorial](https://developer.hashicorp.com/terraform/tutorials/aws-get-started/aws-create)

### 3. Execution & Connection
- Guide the user or run `terraform init`, `terraform fmt`, `terraform validate`, `terraform plan`, and `terraform apply`.
- After successful creation, use the output public IP to show the user the exact SSH command to connect. **Save this SSH command to a local file (`connect.sh`)** and make it executable so that for future steps like deployment, the user can easily reference this file to connect to the EC2 instance:
  ```bash
  #!/bin/bash
  ssh -i <path-to-key-pair.pem> ubuntu@<public-ip>
  ```
- **Make the file executable:** Run `chmod +x connect.sh`. The user can then connect anytime by simply running `./connect.sh`.

### 4. Stop/Start Infrastructure
If the user wants to temporarily pause their work, they can stop the EC2 instance to save costs without destroying it.
- **Stop Instance:** Guide the user to stop the instance via the AWS Management Console or using the AWS CLI: `aws ec2 stop-instances --instance-ids <instance-id>`.
- **Start Instance:** When they are ready to resume, they can start the instance again: `aws ec2 start-instances --instance-ids <instance-id>`.
- **CRITICAL NOTE:** When an EC2 instance is stopped and then started again, its public IP address will change (unless an Elastic IP is used). Because of this, the `connect.sh` script will naturally become outdated. After starting the instance, you MUST update the `connect.sh` file with the new public IP address (you can retrieve the new IP by running `terraform refresh` to update the state, followed by reading the updated output, or by using the AWS CLI).

### 5. Destroy Infrastructure
If the user is unsatisfied with the previously created EC2 instance or no longer needs it, you can destroy the infrastructure. 
**CRITICAL AI INSTRUCTION:** Before destroying any infrastructure, you MUST confirm with the user again to ensure they really want to delete the instance. Do not proceed until you have received explicit permission.

You can offer the user two methods to destroy the infrastructure:
1. **Remove Specific Resource (Recommended for EC2 only):**
   - Comment out or remove the `aws_instance` resource block in `main.tf`.
   - Comment out or remove any related outputs in `outputs.tf` (e.g., public IP or DNS).
   - Run `terraform apply`. Terraform will plan to destroy only the removed resources.
2. **Destroy Entire Workspace:**
   - Run `terraform destroy` to tear down all resources managed by the current configuration.

- Reference: [Terraform AWS Destroy Tutorial](https://developer.hashicorp.com/terraform/tutorials/aws-get-started/aws-destroy)

---

## Step 2: Update,upgrade and install Node.js on EC2

Connect to the EC2 instance using the `connect.sh` script. 

**CRITICAL NOTE:** The following commands MUST be executed directly on the remote EC2 instance after you have successfully connected via SSH, NOT on your local machine.

Update the system packages on the EC2 instance:
```bash
sudo apt update
sudo apt upgrade
```

Install Node.js on the EC2 instance:
```bash
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt-get install -y nodejs   
```

---

## Step 3: Build & Prepare Project

**CRITICAL AI INSTRUCTION:** Before transferring files to EC2, you must identify the user's project stack and guide them through the correct build/preparation process. **IMPORTANT:** Everything must be based on the user's specific project. You must fully discuss the deployment approach with the user before proceeding. The steps outlined below are only suggestions; the user's actual project requirements always take the highest priority:

### 1. Standard Node.js (Express, etc.)
- **Build:** No compilation is strictly needed.
- **Preparation:** Ensure `package.json` has the correct `start` script.
- **Run strategy:** Advise the user to use `systemd` so the app runs in the background.

### 2. Next.js App
- **Build:** Next.js should be optimized for production.
- **Preparation:** 
  1. Guide the user to update `next.config.ts` (or `.js`) to include `output: 'standalone'`.
  2. Run `npm run build` locally.
  3. Explain that the `.next/standalone` folder will be the main deployment artifact. 
  4. **Crucial Next.js step:** Instruct the user that they must copy the `public` folder and `.next/static` folder into `.next/standalone/public` and `.next/standalone/.next/static` respectively, as the standalone build doesn't include them automatically.
- **Run strategy:** Run `node server.js` inside the standalone folder on the server. Advise the user to use `systemd` so the app runs in the background.

### 3. Docker (Containerized Approach)
- **Build:** If the user prefers Docker, guide them to create a `Dockerfile` and a `.dockerignore` file.
- **Preparation:** Provide a standard multi-stage `Dockerfile` suitable for their specific framework (e.g., Next.js or plain Node.js).
- **Run strategy:** Transfer the project files to EC2, then build the image (`docker build -t my-app .`) and run the container with port mapping (`docker run -d -p 80:3000 my-app`).

### 4. Static Frontend (React, Vue, Vite)
- **Build:** Run `npm run build` locally.
- **Preparation:** The generated `dist` or `build` folder contains all needed assets.
- **Run strategy:** Serve the static files on the EC2 instance using a web server like `Nginx`, or a simple Node.js static server like `serve`.

### 5. Script Generation
- **Deliverable:** The final output of this step will be an automated shell script (e.g., `build.sh`) containing all the necessary build and preparation commands discussed and agreed upon with the user.
- **Make the file executable:** Run `chmod +x <script-name>.sh`. The user can then execute the steps anytime by simply running `./<script-name>.sh`.

---

## Step 4: Rsync project build artifacts to EC2.

### 1. Navigate (`cd`) to the directory containing the build artifacts (e.g., the `.next/standalone` folder, or another appropriate build directory depending on the project stack).

### 2. Use the `rsync` command to securely transfer the files to the EC2 instance, excluding unnecessary files like `.git` and `.env`.

**Command Example:**
```bash
cd <build-artifact-directory>
rsync -avz --exclude '.git' --exclude '.env' \
  -e "ssh -i <path-to-key-pair.pem>" \
  . ubuntu@<public-ip>:~/app
```
 *(Note: You can usually extract the SSH key path, user (`ubuntu`), and public IP information from the previously generated `connect.sh` script.)*

---

## Step 5: Create the Environment File

**CRITICAL NOTE:** The following commands MUST be executed directly on the remote EC2 instance after you have successfully connected via SSH, NOT on your local machine.

```bash
sudo vim /etc/app.env
sudo chmod 600 /etc/app.env
sudo chown ubuntu:ubuntu /etc/app.env
```

---

## Step 6: Create the systemd Service File

**CRITICAL NOTE:** The following commands MUST be executed directly on the remote EC2 instance after you have successfully connected via SSH, NOT on your local machine.

Open vim to create the service file:
```bash
sudo vim /etc/systemd/system/myapp.service
```

Enter the following content (please note that this might need adjustment based on your specific project):
```ini
[Unit]
Description=Node.js App
After=network.target multi-user.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/app
ExecStart=/usr/bin/node server.js
Restart=always
Environment=NODE_ENV=production
EnvironmentFile=/etc/app.env
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=myapp

[Install]
WantedBy=multi-user.target
```

Then, reload systemd, enable, and start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable myapp.service
sudo systemctl start myapp.service
```

---

## Step 7: Install and Configure Caddy

**CRITICAL NOTE:** The following commands MUST be executed directly on the remote EC2 instance after you have successfully connected via SSH, NOT on your local machine.

Install Caddy:
```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy
sudo systemctl start caddy
```

Configure Caddy:
```bash
sudo vim /etc/caddy/Caddyfile
```

Then, write the following configuration (adjust the domain and proxy port based on the project):
```caddyfile
# The Caddyfile is an easy way to configure your Caddy web server.
#
# Unless the file starts with a global options block, the first
# uncommented line is always the address of your site.
#
# To use your own domain name (with automatic HTTPS), first make
# sure your domain's A/AAAA DNS records are properly pointed to
# this machine's public IP, then replace ":80" below with your
# domain name.

**CRITICAL AI INSTRUCTION:** Automatically replace `<your-domain.com>` below with the domain name the user requested in Step 8 (or ask them for it).

<your-domain.com> {
        # Set this path to your site's directory.
#       root * /usr/share/caddy

        # Enable the static file server.
#       file_server

        # Another common task is to set up a reverse proxy:
        reverse_proxy localhost:3000

        # Or serve a PHP site through php-fpm:
        # php_fastcgi localhost:9000
}

# Refer to the Caddy docs for more information:
# https://caddyserver.com/docs/caddyfile
```

Finally, restart Caddy to apply the changes:
```bash
sudo systemctl restart caddy
```

---

## Step 8: Configure AWS Route 53

**CRITICAL AI INSTRUCTION:** If the user has a domain managed by AWS Route 53, you can help them update the DNS record to point to the new EC2 instance's public IP address. This should be executed on the user's local machine using the AWS CLI.

1. **Find the Hosted Zone ID:**
   If the user doesn't know their Hosted Zone ID, you can find it using:
   ```bash
   aws route53 list-hosted-zones-by-name --dns-name <domain-name>
   ```

2. **Update the A Record:**
   Use the `change-resource-record-sets` command to create or update (UPSERT) the DNS record. Replace `<hosted-zone-id>`, `<subdomain.domain.com>`, and `<ec2-public-ip>` with the actual values.

   ```bash
   aws route53 change-resource-record-sets \
     --hosted-zone-id <hosted-zone-id> \
     --change-batch '{
       "Comment": "Update A record to new EC2 instance",
       "Changes": [
         {
           "Action": "UPSERT",
           "ResourceRecordSet": {
             "Name": "<subdomain.domain.com>",
             "Type": "A",
             "TTL": 300,
             "ResourceRecords": [
               {
                 "Value": "<ec2-public-ip>"
               }
             ]
           }
         }
       ]
     }'
   ```
   *Note: DNS propagation may take a few minutes to take effect.*

---

## Step 9: Monitor Logs

**CRITICAL NOTE:** The following commands MUST be executed directly on the remote EC2 instance after you have successfully connected via SSH, NOT on your local machine.

To view the application logs managed by systemd, you can use `journalctl`.

View all logs for the service:
```bash
sudo journalctl -u myapp.service
```

Tail the logs (follow the output in real-time):
```bash
sudo journalctl -fu myapp.service
```

---

## Step 10: Analyze Logs with LLM (Optional)

**INSTRUCTION:** When the user asks things like "How is the project running?", "Check the logs", or "What problems occurred?", you should:
1. Connect to the EC2 instance using the `connect.sh` script.
2. Retrieve the recent logs using the method in Step 9 (e.g., `sudo journalctl -u myapp.service -n 100 --no-pager` to get the last 100 lines without pagination).
3. Pass these logs through the Xiaomi MiMo LLM to get an intelligent analysis.

Since this is a Node.js project, you can use the built-in `fetch` API (Node.js 18+) to call the MiMo API. A ready-to-use script is provided in `templates/analyze_logs.js`.

To use this script on the EC2 server, you must first ensure the directory is configured to support ES Modules. Run the following on the EC2 instance once:
```bash
npm init -y
npm pkg set type="module"
```

Then, you can pipe the logs directly into the script:
```bash
# Fetch the last 100 lines of logs and pipe them to the Node.js script
sudo journalctl -u myapp.service -n 100 --no-pager | node analyze_logs.js
```
*(Ensure your API KEY is set in the environment where you run the Node.js script)*

---

## Step 11: Send Log or LLM Analysis Results to User via Telegram (Optional)

**INSTRUCTION:** If the user wants to receive log analysis results or server notifications via Telegram, you can use the script provided in `templates/send_telegram_msg.js`.

1. Review `templates/send_telegram_msg.js` for the complete implementation.
2. The Telegram script requires an external dependency. Install it on your server by running:
   ```bash
   npm install node-telegram-bot-api
   ```
3. If you need to integrate this into another script (like `analyze_logs.js`), simply import the `sendTelegramMessage` function from the template.
4. Ensure the environment variables `TELEGRAM_TOKEN` and `MY_TELEGRAM_CHAT_ID` are set before executing any script that uses this module.

