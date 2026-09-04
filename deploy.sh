#!/bin/bash
# Munshi AI — Alibaba Cloud ECS Setup Script
# Run this ONCE on a fresh ECS instance (Ubuntu 22.04+)
# Usage: ssh root@<your-ecs-ip> then paste this or: bash deploy.sh

set -e

echo "=== Munshi AI — Server Setup ==="

# 1. Install Docker
if ! command -v docker &> /dev/null; then
  echo "Installing Docker..."
  apt-get update -y
  apt-get install -y ca-certificates curl gnupg lsb-release git

  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg

  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
  systemctl enable docker
  systemctl start docker
  echo "Docker installed."
else
  echo "Docker already installed."
fi

# 2. Clone or update the repo
APP_DIR="/opt/munshi-ai"
if [ -d "$APP_DIR" ]; then
  echo "Updating existing repo..."
  cd "$APP_DIR"
  git pull origin main
else
  echo "Cloning repo..."
  git clone https://github.com/MalaikaArshad12star/munshi-ai.git "$APP_DIR"
  cd "$APP_DIR"
fi

# 3. Build and run with Docker Compose
echo "Building and starting Munshi AI..."
docker compose down 2>/dev/null || true
docker compose up -d --build

echo ""
echo "=== Setup Complete ==="
echo "Munshi AI is running on port 3000"
echo "Access it at: http://<your-ecs-public-ip>:3000"
echo ""
echo "Useful commands:"
echo "  docker compose logs -f     # View logs"
echo "  docker compose restart     # Restart app"
echo "  docker compose down        # Stop app"
echo "  docker compose up -d --build  # Rebuild & restart"
