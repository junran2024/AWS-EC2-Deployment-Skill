# AWS EC2 Node.js/Next.js Deployment Skill

This project is a complete automated deployment and operations workflow template, designed to assist users in deploying and managing Node.js/Next.js web applications on AWS EC2 (Ubuntu) via an AI assistant.

## Objective
This skill empowers the AI assistant to guide users through the end-to-end lifecycle of deploying and managing Node.js/Next.js web applications on AWS EC2 using Ubuntu. The workflow encompasses infrastructure provisioning via Terraform, server configuration (Caddy, systemd), project deployment via rsync, DNS management with Route 53, and ongoing maintenance using journalctl, AI-driven log analysis, and automated Telegram notifications.

## Core Workflow (11 Steps)

This guide is divided into 11 core steps, covering the full lifecycle management from cloud server creation and code deployment to monitoring and operations:

1. **Provisioning & Connection**: Automate the creation of an EC2 instance and configure security groups using Terraform, generating an SSH connection script (`connect.sh`) for quick access.
2. **EC2 Initialization**: Update system dependencies on the EC2 server and automate the installation of the Node.js runtime environment.
3. **Project Build**: Based on the specific project tech stack (Node.js, Next.js, Docker, etc.), complete project code bundling and deployment preparation locally.
4. **File Synchronization**: Use the `rsync` command to securely and quickly sync local build artifacts to the EC2 instance.
5. **Environment Variables**: Securely create and configure the environment file (`.env`) on the server to ensure sensitive information is not leaked.
6. **Background Hosting**: Write a `systemd` service configuration file to host the application as a background daemon, ensuring automatic restart upon crashes.
7. **Web Server**: Install and configure Caddy as a reverse proxy, automatically provisioning HTTPS certificates for the bound domain.
8. **Domain Binding**: Use the AWS CLI to operate Route 53, resolving a custom domain name to the EC2's public IP.
9. **Log Monitoring**: Use the `journalctl` command to view and track application running status and system logs in real-time.
10. **AI Log Analysis (Optional)**: Integrate an LLM to perform intelligent analysis and error diagnosis on extracted application logs.
11. **Message Notification (Optional)**: Automatically push log analysis results or critical server operating statuses to Telegram via a bot.

## Directory Structure

- `SKILL.md`: Contains the complete detailed steps of this workflow and the execution instructions (Prompts) provided to the AI assistant.
- `templates/`: Contains core configuration file templates, including Terraform infrastructure code (`main.tf`, `variables.tf`, `outputs.tf`), as well as Node.js scripts for AI log analysis (`analyze_logs.js`) and Telegram notifications (`send_telegram_msg.js`).
