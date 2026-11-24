#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

if [[ $EUID -ne 0 && -z "${SUDO_USER:-}" ]]; then
  echo "Run this script with sudo: sudo ./deploy-ec2.sh"
  exit 1
fi

RUN_AS_USER="${SUDO_USER:-$(id -un)}"

if command -v apt-get >/dev/null 2>&1; then
  apt-get update
  DEBIAN_FRONTEND=noninteractive apt-get install -y ca-certificates curl openssl
  if ! command -v docker >/dev/null 2>&1; then
    DEBIAN_FRONTEND=noninteractive apt-get install -y docker.io
  fi
  systemctl enable --now docker

  if ! docker compose version >/dev/null 2>&1; then
    DEBIAN_FRONTEND=noninteractive apt-get install -y docker-compose-v2 2>/dev/null ||
      DEBIAN_FRONTEND=noninteractive apt-get install -y docker-compose-plugin 2>/dev/null ||
      true
  fi
elif command -v dnf >/dev/null 2>&1; then
  dnf install -y docker docker-compose-plugin curl openssl
  systemctl enable --now docker
elif command -v yum >/dev/null 2>&1; then
  yum install -y docker curl openssl
  systemctl enable --now docker
else
  echo "Unsupported Linux distribution. Install Docker and Docker Compose manually."
  exit 1
fi

usermod -aG docker "$RUN_AS_USER" 2>/dev/null || true

if docker compose version >/dev/null 2>&1; then
  COMPOSE=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE=(docker-compose)
else
  echo "Docker Compose is unavailable. Re-run after installing Docker Compose v2."
  exit 1
fi

random_hex() {
  openssl rand -hex "$1"
}

append_env_if_missing() {
  local key="$1"
  local value="$2"
  if ! grep -q "^${key}=" .env 2>/dev/null; then
    printf '%s=%s\n' "$key" "$value" >> .env
  fi
}

touch .env
append_env_if_missing POSTGRES_USER "research_rag"
append_env_if_missing POSTGRES_PASSWORD "$(random_hex 24)"
append_env_if_missing POSTGRES_DB "research_rag"
append_env_if_missing ENVIRONMENT "production"
append_env_if_missing JWT_SECRET_KEY "$(random_hex 32)"
append_env_if_missing JWT_ALGORITHM "HS256"
append_env_if_missing JWT_EXPIRATION_MINUTES "1440"
append_env_if_missing LLM_PROVIDER "mock"
append_env_if_missing LLM_MODEL ""
append_env_if_missing LLM_TIMEOUT_SECONDS "60"
append_env_if_missing OPENAI_API_KEY ""
append_env_if_missing HUGGINGFACE_API_KEY ""
append_env_if_missing EMBEDDING_MODEL "sentence-transformers/all-MiniLM-L6-v2"
append_env_if_missing CHUNK_SIZE "1000"
append_env_if_missing CHUNK_OVERLAP "200"
append_env_if_missing TOP_K_RESULTS "5"
append_env_if_missing SIMILARITY_THRESHOLD "0.3"
append_env_if_missing LLM_TEMPERATURE "0.7"
append_env_if_missing MAX_FILE_SIZE_MB "50"

if [[ -n "${PUBLIC_URL:-}" ]]; then
  FRONTEND_URL="$PUBLIC_URL"
else
  IMDS_TOKEN="$(curl -fsS -m 2 -X PUT -H 'X-aws-ec2-metadata-token-ttl-seconds: 300' \
    http://169.254.169.254/latest/api/token 2>/dev/null || true)"
  if [[ -n "$IMDS_TOKEN" ]]; then
    PUBLIC_IP="$(curl -fsS -m 2 -H "X-aws-ec2-metadata-token: $IMDS_TOKEN" \
      http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || true)"
  fi
  PUBLIC_IP="${PUBLIC_IP:-$(hostname -I 2>/dev/null | awk '{print $1}')}"
  FRONTEND_URL="${PUBLIC_IP:+http://$PUBLIC_IP}"
  FRONTEND_URL="${FRONTEND_URL:-http://localhost}"
fi

if grep -q "^FRONTEND_URL=" .env 2>/dev/null; then
  sed -i "s|^FRONTEND_URL=.*|FRONTEND_URL=$FRONTEND_URL|" .env
else
  printf 'FRONTEND_URL=%s\n' "$FRONTEND_URL" >> .env
fi

chmod 600 .env

echo "Building and starting containers..."
"${COMPOSE[@]}" down --remove-orphans
"${COMPOSE[@]}" build
"${COMPOSE[@]}" up -d

echo "Waiting for services..."
for attempt in $(seq 1 60); do
  if curl -fsS http://127.0.0.1/ >/dev/null 2>&1 &&
     curl -fsS http://127.0.0.1/api/health >/dev/null 2>&1; then
    echo ""
    echo "Deployment successful."
    echo "Open: $FRONTEND_URL"
    echo "Health: $FRONTEND_URL/api/health"
    "${COMPOSE[@]}" ps
    exit 0
  fi
  sleep 2
  printf "."
done

echo ""
echo "Deployment did not become healthy. Container status:"
"${COMPOSE[@]}" ps
"${COMPOSE[@]}" logs --tail=100
exit 1
