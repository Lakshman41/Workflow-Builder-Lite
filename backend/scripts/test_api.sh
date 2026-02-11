#!/usr/bin/env bash
# Run with: ./scripts/test_api.sh
# Requires: curl, jq. Set BASE_URL and BROWSER_ID or use defaults.

set -e
BASE_URL="${BASE_URL:-http://127.0.0.1:8000}"
BROWSER_ID="${BROWSER_ID:-550e8400-e29b-41d4-a716-446655440000}"
H="X-Browser-ID: $BROWSER_ID"
CT="Content-Type: application/json"

echo "=== 1. Health ==="
curl -s "$BASE_URL/api/health" | jq .

echo ""
echo "=== 2. List workflows (empty or existing) ==="
curl -s -H "$H" "$BASE_URL/api/workflows" | jq .

echo ""
echo "=== 3. Create minimal workflow (no steps) ==="
R=$(curl -s -X POST -H "$H" -H "$CT" -d '{"name": "Test Flow", "description": "For testing", "steps": [], "edges": []}' "$BASE_URL/api/workflows")
echo "$R" | jq .
WORKFLOW_ID=$(echo "$R" | jq -r '.id')
echo "WORKFLOW_ID=$WORKFLOW_ID"

echo ""
echo "=== 4. Create valid 3-step workflow ==="
R2=$(curl -s -X POST -H "$H" -H "$CT" -d '{
  "name": "Three Step Flow",
  "description": "START then process then END",
  "steps": [
    {"name": "Start", "description": "Input", "step_type": "START", "position": {"x": 0, "y": 0}},
    {"name": "Process", "description": "Clean the text", "step_type": "NORMAL", "position": {"x": 200, "y": 0}},
    {"name": "End", "description": "Output", "step_type": "END", "position": {"x": 400, "y": 0}}
  ],
  "edges": [{"source_index": 0, "target_index": 1}, {"source_index": 1, "target_index": 2}]
}' "$BASE_URL/api/workflows")
echo "$R2" | jq .
WORKFLOW_ID_3=$(echo "$R2" | jq -r '.id')
echo "WORKFLOW_ID_3=$WORKFLOW_ID_3"

echo ""
echo "=== 5. Create workflow – validation error (two STARTs) ==="
curl -s -X POST -H "$H" -H "$CT" -d '{
  "name": "Bad Flow",
  "description": "",
  "steps": [
    {"name": "A", "description": "", "step_type": "START", "position": null},
    {"name": "B", "description": "", "step_type": "START", "position": null},
    {"name": "C", "description": "", "step_type": "END", "position": null}
  ],
  "edges": [{"source_index": 0, "target_index": 2}, {"source_index": 1, "target_index": 2}]
}' "$BASE_URL/api/workflows" | jq . || true

echo ""
echo "=== 6. Get workflow by ID ==="
curl -s -H "$H" "$BASE_URL/api/workflows/$WORKFLOW_ID_3" | jq .

echo ""
echo "=== 7. List workflows ==="
curl -s -H "$H" "$BASE_URL/api/workflows" | jq .

echo ""
echo "=== 8. PATCH workflow (name only) ==="
curl -s -X PATCH -H "$H" -H "$CT" -d '{"name": "Updated Name", "description": "Updated desc"}' \
  "$BASE_URL/api/workflows/$WORKFLOW_ID_3" | jq .

echo ""
echo "=== 9. PATCH workflow (steps + edges) ==="
curl -s -X PATCH -H "$H" -H "$CT" -d '{
  "steps": [
    {"name": "Start", "description": "In", "step_type": "START", "position": {"x": 0, "y": 0}},
    {"name": "End", "description": "Out", "step_type": "END", "position": {"x": 200, "y": 0}}
  ],
  "edges": [{"source_index": 0, "target_index": 1}]
}' "$BASE_URL/api/workflows/$WORKFLOW_ID_3" | jq .

echo ""
echo "=== 10. Missing X-Browser-ID (expect 400) ==="
curl -s -o /dev/null -w "HTTP %{http_code}\n" "$BASE_URL/api/workflows"

echo ""
echo "=== 11. Create run ==="
RUN_R=$(curl -s -X POST -H "$H" -H "$CT" -d '{"input_text": "Hello world"}' \
  "$BASE_URL/api/runs/workflows/$WORKFLOW_ID_3/run")
echo "$RUN_R" | jq .
RUN_ID=$(echo "$RUN_R" | jq -r '.run_id')
echo "RUN_ID=$RUN_ID"

echo ""
echo "=== 12. Create run – workflow not found (expect 404) ==="
curl -s -X POST -H "$H" -H "$CT" -d '{"input_text": "x"}' \
  "$BASE_URL/api/runs/workflows/00000000-0000-0000-0000-000000000000/run" | jq . || true

echo ""
echo "=== 13. List runs ==="
curl -s -H "$H" "$BASE_URL/api/runs?limit=5" | jq .

echo ""
echo "=== 14. Get run by ID ==="
curl -s -H "$H" "$BASE_URL/api/runs/$RUN_ID" | jq .

echo ""
echo "=== 15. Delete minimal workflow (optional) ==="
curl -s -o /dev/null -w "DELETE workflow: HTTP %{http_code}\n" -X DELETE -H "$H" "$BASE_URL/api/workflows/$WORKFLOW_ID"

echo ""
echo "Done. See TESTING.md for full checklist."
