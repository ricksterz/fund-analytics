"""Parse a spilled javascript_tool result file (double-encoded JSON with a
trailing "(captured at origin ...)" note) and save the decoded
{quarter: [rows...]} payload to scripts/formd_history/<name>.json."""

import json
import sys
from pathlib import Path

spilled_path, out_name = sys.argv[1], sys.argv[2]

with open(spilled_path) as f:
    outer = json.load(f)
raw = outer[0]["text"]
marker = "\n\n(captured at origin"
idx = raw.rfind(marker)
data = json.loads(json.loads(raw[:idx]))

out_path = Path(__file__).resolve().parent / "formd_history" / f"{out_name}.json"
out_path.write_text(json.dumps(data))
print(f"saved {sum(len(v) for v in data.values())} rows -> {out_path}")
for q, rows in data.items():
    print(f"  {q}: {len(rows)}")
