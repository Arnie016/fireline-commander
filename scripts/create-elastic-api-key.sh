#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [ -f "$ROOT_DIR/.env.local" ]; then
  set -a
  # shellcheck disable=SC1091
  . "$ROOT_DIR/.env.local"
  set +a
fi

ELASTIC_INDEX="${ELASTIC_INDEX:-drill_knowledge}"
ELASTIC_SPACE_NAME="${ELASTIC_SPACE_NAME:-default}"
KEY_NAME="${ELASTIC_API_KEY_NAME:-fireline-commander-demo-key}"
KEY_EXPIRATION="${ELASTIC_API_KEY_EXPIRATION:-7d}"

if [ -z "${ELASTICSEARCH_URL:-}" ]; then
  echo "Missing ELASTICSEARCH_URL, for example: https://YOUR_DEPLOYMENT.es.us-central1.gcp.cloud.es.io" >&2
  exit 1
fi

if [ -n "${ELASTIC_ADMIN_API_KEY:-}" ]; then
  AUTH_HEADER="Authorization: ApiKey ${ELASTIC_ADMIN_API_KEY}"
elif [ -n "${ELASTIC_USERNAME:-}" ] && [ -n "${ELASTIC_PASSWORD:-}" ]; then
  AUTH_HEADER="Authorization: Basic $(printf '%s:%s' "$ELASTIC_USERNAME" "$ELASTIC_PASSWORD" | base64)"
else
  echo "Missing admin auth. Set ELASTIC_ADMIN_API_KEY or ELASTIC_USERNAME + ELASTIC_PASSWORD." >&2
  exit 1
fi

echo "Creating Elastic API key for index '${ELASTIC_INDEX}' and Kibana space '${ELASTIC_SPACE_NAME}'..."

curl -sS -X POST "${ELASTICSEARCH_URL%/}/_security/api_key" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -d @- <<JSON
{
  "name": "${KEY_NAME}",
  "expiration": "${KEY_EXPIRATION}",
  "role_descriptors": {
    "fireline-commander-demo": {
      "cluster": ["monitor_inference"],
      "indices": [
        {
          "names": ["${ELASTIC_INDEX}"],
          "privileges": ["read", "view_index_metadata", "create_index", "write"]
        }
      ],
      "applications": [
        {
          "application": "kibana-.kibana",
          "privileges": ["feature_agentBuilder.read", "feature_actions.read"],
          "resources": ["space:${ELASTIC_SPACE_NAME}"]
        }
      ]
    }
  }
}
JSON

echo
echo "Use the returned 'encoded' value as ELASTIC_API_KEY in .env.local."
