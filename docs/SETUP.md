# Setup

## Local Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Optional Live Retrieval

Create `.env.local`:

```bash
cp .env.example .env.local
```

Set:

```bash
ELASTICSEARCH_URL=https://YOUR_DEPLOYMENT.es.REGION.gcp.cloud.es.io
ELASTIC_API_KEY=YOUR_ENCODED_API_KEY
ELASTIC_INDEX=drill_knowledge
GEMINI_API_KEY=YOUR_GEMINI_KEY
```

Seed the drill knowledge index:

```bash
npm run elastic:seed
```

If no hosted deployment is available, the app uses the committed local evidence dataset and labels the result as demo evidence.

## Final Check

```bash
npm run hackathon:final
```

