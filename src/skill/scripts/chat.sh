#!/bin/bash
BRIDGE=${CLAW_BODY_URL:-http://localhost:3001}
curl -s -X POST "$BRIDGE/api/chat" -H 'Content-Type: application/json' -d "{\"text\":\"${1:-Hello}\",\"sessionId\":\"${2:-default}\"}" | jq .
