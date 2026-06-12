#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const rootDir = path.resolve(import.meta.dirname, "..");
loadEnvFile(path.join(rootDir, ".env.local"));
loadEnvFile(path.join(rootDir, ".env"));

const elasticsearchUrl = process.env.ELASTICSEARCH_URL;
const apiKey = process.env.ELASTIC_API_KEY;
const index = process.env.ELASTIC_INDEX || "drill_knowledge";

if (!elasticsearchUrl || !apiKey) {
  console.error("Missing ELASTICSEARCH_URL or ELASTIC_API_KEY.");
  console.error("Create .env.local from .env.example, then run this script again.");
  process.exit(1);
}

const dataPath = path.join(rootDir, "src", "data", "drill_knowledge.json");
const records = JSON.parse(fs.readFileSync(dataPath, "utf8"));

await createIndex();
await bulkIndex(records);
await smokeSearch();

async function createIndex() {
  const response = await fetch(`${trimSlash(elasticsearchUrl)}/${encodeURIComponent(index)}`, {
    method: "PUT",
    headers: headers(),
    body: JSON.stringify({
      settings: {
        number_of_shards: 1,
        number_of_replicas: 0,
      },
      mappings: {
        properties: {
          id: { type: "keyword" },
          scenario: {
            type: "text",
            fields: { keyword: { type: "keyword" } },
          },
          hazard: {
            type: "text",
            fields: { keyword: { type: "keyword" } },
          },
          role: {
            type: "text",
            fields: { keyword: { type: "keyword" } },
          },
          condition: { type: "text" },
          safe_action: { type: "text" },
          checklist: { type: "text" },
          consequence: { type: "text" },
          source: { type: "keyword" },
          tags: { type: "keyword" },
        },
      },
    }),
  });

  if (response.status === 400) {
    const body = await response.json().catch(() => ({}));
    if (body?.error?.type === "resource_already_exists_exception") {
      console.log(`Index ${index} already exists.`);
      return;
    }
  }

  await assertOk(response, "create index");
  console.log(`Created index ${index}.`);
}

async function bulkIndex(recordsToIndex) {
  const body = recordsToIndex
    .flatMap((record) => [
      JSON.stringify({ index: { _index: index, _id: record.id } }),
      JSON.stringify(record),
    ])
    .join("\n")
    .concat("\n");

  const response = await fetch(`${trimSlash(elasticsearchUrl)}/_bulk?refresh=true`, {
    method: "POST",
    headers: {
      ...headers(),
      "Content-Type": "application/x-ndjson",
    },
    body,
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.errors) {
    console.error(JSON.stringify(payload, null, 2));
    throw new Error("Bulk index failed.");
  }

  console.log(`Indexed ${recordsToIndex.length} drill knowledge records into ${index}.`);
}

async function smokeSearch() {
  const response = await fetch(`${trimSlash(elasticsearchUrl)}/${encodeURIComponent(index)}/_search`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      size: 1,
      query: {
        multi_match: {
          query: "teacher fire blocked route vulnerable assistance",
          fields: ["scenario^4", "hazard^4", "role^3", "condition^3", "safe_action^2", "checklist^2", "tags^2"],
        },
      },
    }),
  });
  const payload = await response.json();
  await assertOk(response, "smoke search");
  const topHit = payload?.hits?.hits?.[0]?._source;
  console.log(`Smoke search top hit: ${topHit?.id ?? "none"}`);
}

function headers() {
  return {
    "Content-Type": "application/json",
    Authorization: `ApiKey ${apiKey}`,
  };
}

async function assertOk(response, label) {
  if (response.ok) {
    return;
  }

  const body = await response.text();
  throw new Error(`Elastic ${label} failed (${response.status}): ${body}`);
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }
    const [key, ...valueParts] = trimmed.split("=");
    if (!process.env[key]) {
      process.env[key] = valueParts.join("=").replace(/^['"]|['"]$/g, "");
    }
  }
}

function trimSlash(value) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}
