#!/bin/bash
curl -s ${CLAW_BODY_URL:-http://localhost:3001}/api/status | jq .
