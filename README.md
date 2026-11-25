# ResearchRAG - AI-Powered Research Paper Platform

<div align="center">

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.2+-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.0+-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![ChromaDB](https://img.shields.io/badge/ChromaDB-Vector_DB-FF6F61?style=for-the-badge&logoColor=white)](https://www.trychroma.com/)
[![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

<p align="center">
  <b>A state-of-the-art AI-powered platform for ingesting, indexing, summarizing, and semantically querying academic and scientific research papers using Retrieval-Augmented Generation (RAG).</b>
</p>

</div>

---

## Table of Contents
- [Overview](#overview)
- [Key Features](#features)
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Database Schema](#database-schema)
- [RAG Pipeline Architecture](#rag-pipeline)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Setup & Installation](#setup-instructions)
  - [Option 1: Docker (Recommended)](#option-1-docker-recommended)
  - [Option 2: Local Development](#option-2-local-development)
- [Environment Variables](#environment-variables)
- [Testing Strategy](#testing-strategy)
- [Deployment](#deployment)
- [Future Enhancements](#future-enhancements)
- [License](#license)
- [Contributors](#contributors)

---

## Overview

Modern scientific literature is expanding exponentially, making literature review, synthesis, and deep comprehension difficult for researchers, engineers, and students. 

**ResearchRAG** is an end-to-end, production-ready research acceleration platform. It empowers users to upload complex PDF research papers, automatically parse multi-column academic formats, compute dense vector embeddings, extract multi-granularity summaries, and interact with the papers through a grounded, conversational RAG interface that eliminates hallucinations by citing specific source pages and passages.

---

## Features

- **Document Ingestion & Parsing**: High-fidelity PDF extraction parsing multi-column academic papers, preserving section headings, mathematical text, abstracts, and citations.
- **Semantic Vector Search**: Dense vector retrieval utilizing ChromaDB, enabling concept-based semantic discovery beyond simple keyword matching.
- **Multi-Granularity Summaries**: 
  - *Executive Summaries*: Instant 3-bullet core takeaways.
  - *Methodology Breakdowns*: Deep dive into technical approaches and experimental setups.
  - *Key Findings & Limitations*: Automatic extraction of outcomes and noted constraints.
- **Grounded Q&A with In-line Citations**: Context-aware RAG pipeline that answers user inquiries with strict attribution to exact pages and chunk references.
- **Interactive Multi-Session Chat**: Real-time conversational interface with context memory, session persistence, and token-streaming support.
- **Secure Authentication & RBAC**: JWT-based bearer authentication, encrypted password storage (bcrypt), and role-based access control.
- **Research Library Management**: Organize papers into collections, tag domain topics, monitor indexing status, and preview documents in-app.
- **Production-Ready Architecture**: Fully containerized with Docker and Docker Compose, robust async database connections with SQLAlchemy 2.0 and asyncpg, and automated health checks.

---

## System Architecture

The following diagram illustrates the interaction between the frontend client, reverse proxy, API backend, RAG pipeline, and persistent storage layers:

```mermaid
graph TD
    subgraph Client ["Client Layer"]
        UI["React 18 SPA (Vite + Tailwind CSS)"]
    end

    subgraph Gateway ["Web & Reverse Proxy"]
        NGINX["Nginx Server (Static Assets & /api Proxy)"]
    end

    subgraph BackendApp ["FastAPI Application"]
        API["FastAPI REST & Streaming Controller"]
        AUTH["JWT Authentication & RBAC"]
        INGEST["Ingestion & Document Pipeline"]
        RAG["RAG Retrieval & Generation Engine"]
        SUMM["Summarization Orchestrator"]
    end

    subgraph Processing ["AI & NLP Pipelines"]
        PARSER["PDF Parser & Text Extractor"]
        CHUNKER["Recursive Semantic Chunker"]
        EMBED["Embedding Generator (OpenAI / HuggingFace)"]
        LLM["Generative LLM (GPT-4o / Claude 3.5 / Ollama)"]
    end

    subgraph Persistence ["Persistence Layer"]
        PG[("PostgreSQL 15 (Users, Papers, Sessions, Messages)")]
        CHROMA[("ChromaDB (Vector Index & Document Chunks)")]
        FS[("File System (Original PDFs & Uploads)")]
    end

    UI -->|HTTP / REST / SSE| NGINX
    NGINX -->|Reverse Proxy| API
    API --> AUTH
    API --> INGEST
    API --> RAG
    API --> SUMM

    INGEST --> PARSER
    PARSER --> CHUNKER
    CHUNKER --> EMBED
    EMBED -->|Vector Upsert| CHROMA
    INGEST -->|Persist File| FS
    INGEST -->|Metadata| PG

    RAG -->|Query Embedding| EMBED
    RAG -->|Top-K Cosine Retrieval| CHROMA
    RAG -->|Context + Prompt| LLM
    LLM -->|Stream Answer + Citations| RAG

    SUMM -->|Contextual Chunks| LLM
    AUTH -->|User Credentials| PG
    API -->|CRUD Operations| PG
```

---

## Technology Stack

| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Backend Framework** | FastAPI | `^0.110.0` | Asynchronous high-performance REST API and SSE streaming |
| **Backend Runtime** | Python | `3.11+` | Core server runtime and NLP processing |
| **Database ORM** | SQLAlchemy | `^2.0.28` | Asynchronous ORM and schema migration manager |
| **Database Driver** | asyncpg | `^0.29.0` | High-performance asynchronous PostgreSQL client |
| **Relational Database**| PostgreSQL | `15` | Structured data: users, paper metadata, chat history |
| **Vector Database** | ChromaDB | `^0.4.24` | Vector storage, dense indexing, and cosine similarity search |
| **Document Processing**| PyMuPDF / pdfplumber | `^1.24.0` | Fast text extraction, page-level mapping, and layout retention |
| **Frontend Framework** | React | `^18.2.0` | Reactive component-based user interface |
| **Build Tooling** | Vite | `^5.1.0` | Lightning-fast HMR and optimized production bundling |
| **Styling** | Tailwind CSS | `^3.4.1` | Utility-first responsive design and dark mode styling |
| **Icons & UI** | Lucide React | `^0.359.0`| Clean, modern iconography |
| **HTTP Client** | Axios | `^1.6.8` | Client-side HTTP requests with interceptors for JWT |
| **Web Server** | Nginx | `1.25-alpine` | Static asset serving, gzip compression, and API proxy |
| **Containerization** | Docker & Compose | `v2+` | Multi-container reproducible orchestration |

---

## Database Schema

The relational schema is implemented with PostgreSQL and managed through SQLAlchemy. It consists of 6 primary entities linked through relational foreign keys:

```mermaid
erDiagram
    USERS ||--o{ PAPERS : "uploads"
    USERS ||--o{ CHAT_SESSIONS : "initiates"
    PAPERS ||--o{ PAPER_CHUNKS : "divided_into"
    PAPERS ||--o{ SUMMARIES : "generates"
    PAPERS ||--o{ CHAT_SESSIONS : "referenced_in"
    CHAT_SESSIONS ||--o{ CHAT_MESSAGES : "contains"

    USERS {
        uuid id PK "Primary Key"
        string email "Unique, Indexed"
        string hashed_password "Bcrypt / Argon2 Hash"
        string full_name "User Full Name"
        string role "Admin / Researcher / Student"
        boolean is_active "Active Status"
        timestamp created_at "Creation Timestamp"
        timestamp updated_at "Update Timestamp"
    }

    PAPERS {
        uuid id PK "Primary Key"
        uuid user_id FK "Owner Reference"
        string title "Paper Title"
        string authors "Author List"
        text abstract "Paper Abstract"
        int publication_year "Year of Publication"
        string file_path "Stored File Path"
        int file_size "File Size in Bytes"
        int total_pages "Total Page Count"
        string status "pending | processing | indexed | failed"
        timestamp created_at "Uploaded At"
        timestamp updated_at "Last Updated At"
    }

    PAPER_CHUNKS {
        uuid id PK "Primary Key"
        uuid paper_id FK "Paper Reference"
        int chunk_index "Sequential Index"
        text content "Text Chunk Content"
        string embedding_id "ChromaDB Vector ID"
        int page_number "Source PDF Page"
        int token_count "Estimated Token Count"
        timestamp created_at "Chunk Timestamp"
    }

    SUMMARIES {
        uuid id PK "Primary Key"
        uuid paper_id FK "Paper Reference"
        string summary_type "executive | comprehensive | methodology"
        text content "Summary Content"
        jsonb key_takeaways "Array of Structured Takeaways"
        string model_used "LLM Identifier"
        timestamp created_at "Generated At"
    }

    CHAT_SESSIONS {
        uuid id PK "Primary Key"
        uuid user_id FK "User Reference"
        uuid paper_id FK "Target Paper Reference"
        string title "Session Name"
        timestamp created_at "Started At"
        timestamp updated_at "Last Activity At"
    }

    CHAT_MESSAGES {
        uuid id PK "Primary Key"
        uuid session_id FK "Session Reference"
        string role "user | assistant | system"
        text content "Message Content"
        jsonb citations "Array of Source Chunk IDs & Pages"
        int token_count "Token Count"
        timestamp created_at "Timestamp"
    }
```

---

## RAG Pipeline

The platform uses a two-phase Retrieval-Augmented Generation architecture: **Ingestion Pipeline** and **Inference / Query Pipeline**.

```mermaid
flowchart TD
    subgraph Ingestion ["Ingestion Pipeline (Offline / Async)"]
        A[PDF Research Paper] --> B[Text & Structure Extraction]
        B --> C[Recursive Semantic Chunking<br/>chunk_size=1000, overlap=200]
        C --> D[Generate Vector Embeddings<br/>text-embedding-3-small / MiniLM]
        D --> E[ChromaDB Vector Collection]
        C --> F[Store Chunk Records & Page Map in PostgreSQL]
    end

    subgraph Retrieval ["Query & Retrieval Pipeline (Online)"]
        G[User Research Query] --> H[Generate Query Vector]
        H --> I[ChromaDB Top-K Cosine Search]
        E -.->|Similarity Match| I
        I --> J[Retrieve Top Chunks + Context Metadata]
        J --> K[Re-ranking & Deduplication]
    end

    subgraph Generation ["Augmentation & Response Generation"]
        K --> L[Assemble System Prompt + Context + Conversation History]
        L --> M[LLM Inference<br/>GPT-4o / Claude 3.5]
        M --> N[Stream Response with Citation Annotations<br/>Page Numbers & Source Snippets]
    end
```

### Ingestion Details
1. **Document Loading**: PyMuPDF extracts raw text while preserving whitespace and character spans to locate section boundaries.
2. **Recursive Chunking**: Text is partitioned into chunks of 1000 characters with an overlap of 200 characters, respecting sentence and paragraph boundaries to preserve semantic context.
3. **Embedding Vectorization**: Each chunk is mapped to a dense numerical vector using OpenAI's `text-embedding-3-small` (or local Sentence-Transformers).
4. **Indexing**: Embeddings are persisted in ChromaDB along with metadata (`paper_id`, `chunk_index`, `page_number`).

### Retrieval & Generation Details
1. **Dense Retrieval**: The user query is vectorized using the identical embedding model, followed by cosine similarity retrieval against the indexed paper collection.
2. **Context Window Formatting**: The top $K$ ($K=5$) chunks are combined with document metadata to form an augmented prompt.
3. **Grounded Generation**: The LLM synthesizes an answer strictly grounded on the supplied excerpts, attributing claims with bracketed citations (e.g. `[Page 4]`).

---

## API Documentation

All API endpoints are prefixed with `/api/v1` and return structured JSON responses.

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/v1/auth/register` | Register a new user account | No |
| `POST` | `/api/v1/auth/login` | Authenticate user and receive access token | No |
| `POST` | `/api/v1/auth/refresh` | Refresh an active JWT token | Yes |
| `GET` | `/api/v1/auth/me` | Retrieve profile of authenticated user | Yes |
| `POST` | `/api/v1/papers/upload` | Upload a PDF paper and initiate background indexing | Yes |
| `GET` | `/api/v1/papers` | List papers with pagination, search, and status filters | Yes |
| `GET` | `/api/v1/papers/{id}` | Retrieve comprehensive metadata and chunk metrics | Yes |
| `GET` | `/api/v1/papers/{id}/download`| Download the original PDF document | Yes |
| `DELETE`| `/api/v1/papers/{id}` | Delete paper, database records, and vector embeddings | Yes |
| `POST` | `/api/v1/papers/{id}/summarize`| Trigger multi-level AI summarization | Yes |
| `GET` | `/api/v1/papers/{id}/summaries`| Retrieve all generated summaries for a paper | Yes |
| `POST` | `/api/v1/search/semantic` | Perform semantic vector search across papers | Yes |
| `POST` | `/api/v1/search/hybrid` | Perform hybrid vector + keyword search | Yes |
| `GET` | `/api/v1/search/suggest` | Get search term suggestions | Yes |
| `POST` | `/api/v1/chat/sessions` | Create a new conversational research session | Yes |
| `GET` | `/api/v1/chat/sessions` | List active chat sessions for the user | Yes |
| `GET` | `/api/v1/chat/sessions/{id}`| Fetch full message history for a chat session | Yes |
| `POST` | `/api/v1/chat/sessions/{id}/messages` | Send query and get grounded answer with citations | Yes |
| `POST` | `/api/v1/chat/sessions/{id}/stream` | Stream RAG response tokens via Server-Sent Events (SSE) | Yes |
| `DELETE`| `/api/v1/chat/sessions/{id}`| Delete a chat session and message history | Yes |
| `GET` | `/api/v1/health` | Service health status (DB, Vector Store, API) | No |
| `GET` | `/api/v1/stats` | Platform usage statistics (Admin only) | Yes |

---

## Project Structure

```
├── .gitignore
├── docker-compose.yml
├── README.md
│
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── .env.example
│   │
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                    # Application entrypoint & middleware
│   │   ├── config.py                  # Pydantic environment configuration
│   │   │
│   │   ├── api/                       # API router endpoints
│   │   │   ├── __init__.py
│   │   │   ├── v1/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── auth.py            # User registration, login, profile
│   │   │   │   ├── papers.py          # Paper upload, list, download, delete
│   │   │   │   ├── summaries.py       # Paper summarization endpoints
│   │   │   │   ├── search.py          # Semantic and hybrid search
│   │   │   │   └── chat.py            # RAG conversational sessions & streaming
│   │   │
│   │   ├── core/                      # Core utilities & security
│   │   │   ├── __init__.py
│   │   │   ├── security.py            # Password hashing & JWT token handling
│   │   │   ├── database.py            # Async SQLAlchemy engine & sessions
│   │   │   └── exceptions.py          # Custom API exception handlers
│   │   │
│   │   ├── models/                    # SQLAlchemy database models
│   │   │   ├── __init__.py
│   │   │   ├── user.py                # Users table model
│   │   │   ├── paper.py               # Papers & PaperChunks models
│   │   │   ├── summary.py             # Summaries model
│   │   │   └── chat.py                # ChatSessions & ChatMessages models
│   │   │
│   │   ├── schemas/                   # Pydantic validation schemas
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── paper.py
│   │   │   ├── summary.py
│   │   │   ├── search.py
│   │   │   └── chat.py
│   │   │
│   │   └── services/                  # Business logic & AI pipelines
│   │       ├── __init__.py
│   │       ├── ingestion_service.py   # PDF text extraction & chunking
│   │       ├── vector_service.py      # ChromaDB client & vector operations
│   │       ├── rag_service.py         # Retrieval augmentation & LLM synthesis
│   │       └── summary_service.py     # Executive & deep summary generation
│   │
│   └── tests/                         # Pytest test suite
│       ├── conftest.py
│       ├── test_auth.py
│       ├── test_papers.py
│       └── test_rag.py
│
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── index.html
    │
    └── src/
        ├── main.jsx                   # React root entrypoint
        ├── App.jsx                    # Root router & layout wrapper
        ├── index.css                  # Global Tailwind stylesheet
        │
        ├── assets/                    # Static brand logos & illustrations
        ├── components/                # Reusable UI components
        │   ├── common/                # Buttons, Modal, Input, Spinner, Badges
        │   ├── layout/                # Navbar, Sidebar, Footer, LayoutWrapper
        │   ├── papers/                # PaperCard, UploadZone, ChunkViewer
        │   ├── chat/                  # ChatBox, MessageBubble, CitationCard
        │   └── search/                # SearchBar, FilterBar, ResultItem
        │
        ├── pages/                     # Application route views
        │   ├── DashboardPage.jsx      # Research paper overview & metrics
        │   ├── PapersPage.jsx         # Library collection & document manager
        │   ├── PaperDetailPage.jsx    # Viewer, summaries, and chunk inspector
        │   ├── ChatPage.jsx           # Grounded RAG conversational interface
        │   ├── SearchPage.jsx         # Semantic search exploration
        │   ├── LoginPage.jsx          # User login
        │   └── RegisterPage.jsx       # User registration
        │
        ├── context/                   # React Context state providers
        │   ├── AuthContext.jsx        # Authentication and session state
        │   └── ThemeContext.jsx       # Dark/Light mode theme state
        │
        ├── hooks/                     # Custom React hooks
        │   ├── useAuth.js
        │   ├── usePapers.js
        │   └── useChat.js
        │
        └── services/                  # Axios API communication clients
            ├── api.js                 # Base Axios instance with auth interceptors
            ├── authService.js
            ├── paperService.js
            └── chatService.js
```

---

## Prerequisites

Before running the application locally or via Docker, ensure you have the following installed:

- **Python**: Version `3.11` (pinned via `.python-version` and Docker images; compatible with 3.11.x)
- **Node.js**: Version `18.x` or `20.x LTS` (with `npm` or `pnpm`)
- **PostgreSQL**: Version `15+` (if running locally without Docker)
- **Git**: Latest release
- **Docker & Docker Compose**: (Optional, recommended for quick start)
- **API Key**: An [OpenAI API Key](https://platform.openai.com/) (or alternative configured LLM provider)

---

## Setup Instructions

### Option 1: Docker (Recommended)

Running the entire stack with Docker Compose takes less than 2 minutes:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/research-rag-platform.git
   cd research-rag-platform
   ```

2. **Configure environment variables**:
   ```bash
   cp backend/.env.example backend/.env
   ```
   Open `backend/.env` and insert your `OPENAI_API_KEY`:
   ```ini
   OPENAI_API_KEY=sk-your-actual-api-key-here
   ```

3. **Build and launch the containers**:
   ```bash
   docker-compose up --build
   ```

4. **Access the application**:
   - **Frontend**: [http://localhost:5173](http://localhost:5173)
   - **Backend API**: [http://localhost:8000](http://localhost:8000)
   - **Interactive API Docs (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)
   - **ChromaDB Vector Store**: [http://localhost:8001](http://localhost:8001)

To stop the containers:
```bash
docker-compose down
```

---

### Option 2: Local Development

If you prefer developing locally with live reload on both frontend and backend:

#### Step 1: Database Setup
Ensure PostgreSQL is running locally and create the database:
```sql
CREATE DATABASE research_rag;
```

#### Step 2: Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create and activate Python virtual environment
python -m venv venv

# Windows (PowerShell / CMD)
.\venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

# Upgrade pip and install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Create environment configuration
cp .env.example .env
# Edit .env with your PostgreSQL credentials and OpenAI key

# Run the FastAPI development server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
The backend will be available at [http://127.0.0.1:8000](http://127.0.0.1:8000).

#### Step 3: Frontend Setup
```bash
# Open a new terminal and navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Launch Vite development server
npm run dev
```
The frontend will be running at [http://localhost:5173](http://localhost:5173).

---

## Environment Variables

Configure the following variables in `backend/.env`:

| Variable | Default Value | Required | Description |
| :--- | :--- | :---: | :--- |
| `ENVIRONMENT` | `development` | Yes | Environment mode (`development` / `production` / `testing`) |
| `SECRET_KEY` | `your-secret-key-change-in-production` | Yes | Secret key used for signing JWT access tokens |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` (24 hours) | No | JWT access token validity duration |
| `DATABASE_URL` | `postgresql+asyncpg://postgres:postgres123@localhost:5432/research_rag` | Yes | PostgreSQL connection string using asyncpg driver |
| `CHROMA_HOST` | `localhost` | Yes | Host address for ChromaDB service |
| `CHROMA_PORT` | `8001` | Yes | Port for ChromaDB service (8000 inside Docker, 8001 on host) |
| `UPLOAD_DIR` | `./uploads` | No | Filesystem directory to persist uploaded PDFs |
| `MAX_UPLOAD_SIZE_MB` | `50` | No | Maximum permitted file upload size in megabytes |
| `OPENAI_API_KEY` | `sk-...` | Yes | OpenAI API key for embeddings and LLM completions |
| `LLM_MODEL` | `gpt-4o` | No | Primary LLM used for summarization and Q&A |
| `EMBEDDING_MODEL` | `text-embedding-3-small` | No | Embedding model used for vector indexing |
| `CHUNK_SIZE` | `1000` | No | Character count per document chunk |
| `CHUNK_OVERLAP` | `200` | No | Character overlap between consecutive chunks |

---

## Testing Strategy

Quality and stability are verified through comprehensive automated testing across both layers:

### Backend Testing
The backend utilizes `pytest` alongside `pytest-asyncio` and `httpx` to test asynchronous API routes and pipeline components:
```bash
cd backend
# Run all backend tests
pytest -v

# Run with test coverage report
pytest --cov=app --cov-report=html
```
- **Unit Tests**: Test PDF parsing, recursive text chunker, and token calculations.
- **API Tests**: Validate user registration, JWT lifecycle, paper CRUD endpoints, and access permissions using `httpx.AsyncClient`.
- **RAG Tests**: Verify retrieval similarity logic with mock embedding fixtures.

### Frontend Testing
Frontend code quality is maintained through Vite build verification and component testing:
```bash
cd frontend
# Lint code
npm run lint

# Verify production build compilation
npm run build
```

### Integration & End-to-End Testing
Full-lifecycle tests verify:
1. Registration & login authentication flow.
2. PDF file upload and processing pipeline.
3. Verification that embeddings exist in ChromaDB.
4. Sending a chat message and verifying valid citations returned in the response.

---

## Deployment

### AWS EC2 one-command deployment
After cloning the repository on an Ubuntu or Amazon Linux EC2 instance:

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd research-paper-analyzer
chmod +x deploy-ec2.sh
sudo ./deploy-ec2.sh
```

In the EC2 security group, allow inbound TCP port 80 from `0.0.0.0/0` (and port 22 for SSH).
The script installs Docker and Compose, creates a protected `.env` with generated database and JWT secrets,
builds all containers, and starts the app on port 80. Open `http://<EC2-PUBLIC-IP>/`.
Set `PUBLIC_URL=https://your-domain.example` or `PUBLIC_URL=http://<EC2-PUBLIC-IP>` before running
if you want to explicitly control the backend CORS origin.
The backend uses CPU-only PyTorch wheels and does not download NVIDIA CUDA libraries.
After pulling an update, rerun `sudo ./deploy-ec2.sh` to rebuild and restart the containers.
The default configuration is for testing: backend mock responses are enabled, while Puter.js
continues to provide browser-side AI features. Do not use this mock configuration for production.

Optional API keys can be added to `.env` after deployment:

```bash
LLM_PROVIDER=openai
OPENAI_API_KEY=your-key
```

After changing `.env`, redeploy with `sudo ./deploy-ec2.sh`.

### Production Docker Compose
For single-node cloud VM deployments (AWS EC2, DigitalOcean Droplet, Hetzner Cloud):
1. Configure a production domain with SSL termination via Certbot or Cloudflare.
2. Adjust `docker-compose.yml` environment variables to enforce strong `SECRET_KEY` and database passwords.
3. Launch with detached mode:
   ```bash
   docker-compose -f docker-compose.yml up -d
   ```

### Cloud Architecture Recommendations
- **AWS**:
  - **Compute**: AWS ECS (Elastic Container Service) with AWS Fargate.
  - **Database**: Amazon RDS for PostgreSQL.
  - **Vector Store**: ChromaDB on EC2 or managed vector service (e.g., Pinecone / pgvector).
  - **Storage**: Amazon S3 for PDF documents.
- **GCP**:
  - **Compute**: Google Cloud Run.
  - **Database**: Cloud SQL for PostgreSQL.
  - **Storage**: Google Cloud Storage.
- **CI/CD with GitHub Actions**:
  - Automated linting (`ruff`, `eslint`).
  - Running `pytest` and test coverage.
  - Automated Docker container build and push to Docker Hub / Amazon ECR.

---

## Future Enhancements

- [ ] **Real-time Collaborative Research**: Shared paper libraries, shared annotations, and multi-user research chat channels.
- [ ] **Paper Recommendation Engine**: Graph-based or embedding-based recommendations for related publications based on user reading habits.
- [ ] **In-Browser Annotation & Highlighting**: Highlight passages directly in the embedded PDF viewer and link annotations to chat context.
- [ ] **Export Summaries**: One-click exports of executive summaries and citations to Markdown, PDF, Notion, and LaTeX.
- [ ] **Academic Database Integrations**: Direct 1-click import from arXiv, PubMed, bioRxiv, and Semantic Scholar.
- [ ] **Multi-Language Support**: Cross-lingual RAG enabling queries in any language over papers published in English.
- [ ] **Browser Extension**: Chrome/Firefox extension to summarize arXiv papers directly while browsing.
- [ ] **Mobile Application**: Companion mobile app built with React Native for reading summaries on the go.

---

## License

This project is open-source software licensed under the **MIT License**. See the [LICENSE](LICENSE) file for more details.

```
MIT License

Copyright (c) 2026 ResearchRAG Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

---

## Contributors

Contributions, issues, and feature requests are welcome!

### Contribution Guidelines
1. **Fork the Repository** and create your branch (`git checkout -b feature/AmazingFeature`).
2. **Commit your changes** (`git commit -m 'Add some AmazingFeature'`).
3. **Push to the branch** (`git push origin feature/AmazingFeature`).
4. **Open a Pull Request** describing your changes and link any relevant issues.

### Project Contributors
- **Project Lead & Platform Architecture**: Revant Khanna
- **RAG Engineering & Full-Stack Development**: Ramesh
- **Feedback & Support**: Open an issue or join our community discussions.