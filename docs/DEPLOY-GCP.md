# Deploy Workflow Builder Lite on GCP

This guide deploys the app to **Google Cloud Run** with **Cloud SQL (PostgreSQL)**. No Kubernetes—Cloud Run is serverless and scales to zero. Upstash Redis and Gemini are used via env vars (no extra GCP services).

## Architecture

- **Cloud Run** – Single service (FastAPI + static frontend). One container, one URL.
- **Cloud SQL** – Managed PostgreSQL. Backend connects via Unix socket or private IP.
- **Secrets** – `GEMINI_API_KEY`, `DATABASE_URL`, and optionally Upstash credentials via Secret Manager or Cloud Run env.

## Prerequisites

- [Google Cloud SDK (gcloud)](https://cloud.google.com/sdk/docs/install) installed and logged in.
- A GCP project. Set it: `gcloud config set project YOUR_PROJECT_ID`

## 1. Enable APIs

```bash
gcloud services enable run.googleapis.com sqladmin.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com
```

## 2. Create Cloud SQL (PostgreSQL)

```bash
# Replace REGION (e.g. us-central1) and INSTANCE_NAME (e.g. workflow-db)
REGION=us-central1
INSTANCE_NAME=workflow-db

gcloud sql instances create $INSTANCE_NAME \
  --database-version=POSTGRES_16 \
  --tier=db-f1-micro \
  --region=$REGION

# Create database and user
gcloud sql databases create workflows --instance=$INSTANCE_NAME
gcloud sql users set-password postgres --instance=$INSTANCE_NAME --password=YOUR_DB_PASSWORD
```

Get the **connection name** (for Cloud Run):

```bash
gcloud sql instances describe $INSTANCE_NAME --format='value(connectionName)'
# Example: PROJECT:REGION:INSTANCE_NAME
```

For **DATABASE_URL** you will use either:

- **Cloud Run + private IP (VPC)**: `postgresql+asyncpg://postgres:PASSWORD@/workflows?host=/cloudsql/CONNECTION_NAME` (Unix socket), or
- **Public IP (simpler, less secure)**: create a public IP, allow your IP or 0.0.0.0/0 for testing, and use `postgresql+asyncpg://postgres:PASSWORD@PUBLIC_IP:5432/workflows?sslmode=require`. Prefer private IP in production.

## 3. Artifact Registry and build image

```bash
REGION=us-central1
REPO=workflow-builder

# Create repo
gcloud artifacts repositories create $REPO --repository-format=docker --location=$REGION

# Configure Docker for Artifact Registry
gcloud auth configure-docker ${REGION}-docker.pkg.dev

# Build and push (from project root)
IMAGE=${REGION}-docker.pkg.dev/$(gcloud config get-value project)/${REPO}/app:latest
docker build -t $IMAGE .
docker push $IMAGE
```

## 4. Secrets (recommended)

Store sensitive values in Secret Manager:

```bash
# Create secrets (replace values)
echo -n "your-gemini-api-key" | gcloud secrets create GEMINI_API_KEY --data-file=-
echo -n "postgresql+asyncpg://postgres:PASSWORD@/workflows?host=/cloudsql/PROJECT:REGION:INSTANCE" | gcloud secrets create DATABASE_URL --data-file=-

# Optional: Upstash
echo -n "https://xxx.upstash.io" | gcloud secrets create UPSTASH_REDIS_REST_URL --data-file=-
echo -n "your-token" | gcloud secrets create UPSTASH_REDIS_REST_TOKEN --data-file=-
```

Grant Cloud Run’s default compute service account access:

```bash
PROJECT=$(gcloud config get-value project)
PROJECT_NUMBER=$(gcloud projects describe $PROJECT --format='value(projectNumber)')
for s in GEMINI_API_KEY DATABASE_URL UPSTASH_REDIS_REST_URL UPSTASH_REDIS_REST_TOKEN; do
  gcloud secrets add-iam-policy-binding $s --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" --role=roles/secretmanager.secretAccessor 2>/dev/null || true
done
```

## 5. Deploy to Cloud Run

**Option A: With Cloud SQL (private) and secrets**

Replace `CONNECTION_NAME`, `REGION`, `IMAGE`, and ensure the service account has Secret Manager access.

```bash
CONNECTION_NAME=PROJECT:REGION:INSTANCE_NAME   # from step 2
REGION=us-central1
IMAGE=us-central1-docker.pkg.dev/YOUR_PROJECT/workflow-builder/app:latest

gcloud run deploy workflow-builder-lite \
  --image=$IMAGE \
  --region=$REGION \
  --platform=managed \
  --allow-unauthenticated \
  --add-cloudsql-instances=$CONNECTION_NAME \
  --set-env-vars="STATIC_DIR=/app/static,PORT=8080" \
  --set-secrets="DATABASE_URL=DATABASE_URL:latest,GEMINI_API_KEY=GEMINI_API_KEY:latest" \
  --set-secrets="UPSTASH_REDIS_REST_URL=UPSTASH_REDIS_REST_URL:latest,UPSTASH_REDIS_REST_TOKEN=UPSTASH_REDIS_REST_TOKEN:latest"
```

If using **Unix socket** with Cloud SQL Proxy (default when you use `--add-cloudsql-instances`), the backend must use a URL like:

`postgresql+asyncpg://postgres:PASSWORD@/workflows?host=/cloudsql/CONNECTION_NAME`

Cloud Run injects the socket at `/cloudsql/CONNECTION_NAME`. So your secret `DATABASE_URL` should be in that form (with the actual password and connection name).

**Option B: Plain env (no Secret Manager)**

```bash
gcloud run deploy workflow-builder-lite \
  --image=$IMAGE \
  --region=$REGION \
  --allow-unauthenticated \
  --add-cloudsql-instances=$CONNECTION_NAME \
  --set-env-vars="STATIC_DIR=/app/static,PORT=8080,DATABASE_URL=postgresql+asyncpg://postgres:PASSWORD@/workflows?host=/cloudsql/CONNECTION_NAME,GEMINI_API_KEY=your-key"
```

After deploy, the CLI prints the service URL (e.g. `https://workflow-builder-lite-xxx.run.app`). Open it to use the app.

## 6. Database SSL (Cloud SQL public IP)

If you connect via public IP with `?sslmode=require`, set:

```bash
--set-env-vars="DATABASE_SSL_NO_VERIFY=true"
```

only if you must disable certificate verification (e.g. for testing). Prefer Cloud SQL Auth Proxy / private IP in production.

## 7. Local Docker run (no GCP)

From project root, with a Postgres URL in `.env` or in the command:

```bash
docker compose up --build
# App at http://localhost:8080
```

Or build and run the image manually:

```bash
docker build -t workflow-builder-lite .
docker run -p 8080:8080 -e DATABASE_URL=postgresql+asyncpg://postgres:postgres@host.docker.internal:5432/workflows -e GEMINI_API_KEY=yourkey workflow-builder-lite
```

## Summary

| Item        | Choice              |
|------------|---------------------|
| Compute    | Cloud Run (no GKE)  |
| Database   | Cloud SQL PostgreSQL|
| Redis      | Upstash (env vars)  |
| Secrets    | Secret Manager or env |
| Container  | Single image (API + SPA) |

No Kubernetes is required; Cloud Run handles scaling and HTTPS.
