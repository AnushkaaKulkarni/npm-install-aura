
# 🚀 RozgarLink
### AI-Powered Career Development & Employment Platform

RozgarLink connects **job seekers, recruiters, and training providers** through a unified platform for job discovery, resume improvement, skill development, and AI-powered interview preparation.

<p align="center">
  <img src="https://img.shields.io/badge/Platform-AI%20Powered-2457A7?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Frontend-Next.js-black?style=for-the-badge&logo=next.js" />
  <img src="https://img.shields.io/badge/Backend-Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/Database-MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" />
</p>

---

## ✨ Key Features

- 🎯 **AI Job Matching** — Match candidates with opportunities based on eligibility and skills.
- 📄 **Resume Studio** — Analyze resumes and assist with tailored resume creation.
- 🤖 **AI Career Assistant** — Get personalized career guidance.
- 📚 **AI Tutor** — Access AI-powered learning assistance.
- 🎤 **AI Interview Coach** — Practice interviews and receive feedback.
- 📊 **Skill Gap Analysis** — Identify missing skills and discover learning resources.
- 🏢 **Recruiter Dashboard** — Manage job postings and applicants.
- 🎓 **Training Provider Workspace** — Manage learning materials and resources.

## 🧭 How RozgarLink Works

```mermaid
flowchart TD
    A([Start]) --> B[Create Account]
    B --> C{Select Role}

    C -->|Candidate| D[Build Profile & Upload Resume]
    C -->|Recruiter| E[Post Jobs & Manage Applicants]
    C -->|Training Provider| F[Upload Learning Resources]

    D --> G[AI Eligibility & Skill Matching]
    G --> H[Recommended Opportunities]
    H --> I[Resume Analysis & Application]

    D --> J[Skill Gap Analysis]
    J --> K[Personalized Learning]
    K --> L[AI Interview Practice]

    E --> M[Review Eligible Applicants]
    F --> N[Provide Learning Materials]

    I --> O([Career Progress])
    L --> O

    classDef startEnd fill:#17365D,color:#fff,stroke:#17365D
    classDef ai fill:#E6A23C,color:#17202A,stroke:#C88719
    classDef user fill:#EAF1FB,color:#17365D,stroke:#2457A7

    class A,O startEnd
    class G,J,K,L ai
    class B,C,D,E,F,H,I,M,N user
```

## 🔄 AI Job Matching Workflow

```mermaid
flowchart LR
    A[Candidate Profile] --> B[Mandatory Eligibility Check]
    B --> C{Eligible?}
    C -->|No| D[Explain Missing Criteria]
    C -->|Needs Information| E[Request More Details]
    C -->|Yes| F[Match Skills & Experience]
    F --> G[Calculate Match Score]
    G --> H[Recommend Opportunity]
    H --> I[Resume Analysis]
    I --> J[Application Submission]

    classDef check fill:#EAF1FB,stroke:#2457A7,color:#17365D
    classDef success fill:#DDF4E4,stroke:#237A57,color:#155B3B
    classDef blocked fill:#FCE8E6,stroke:#C0392B,color:#922B21

    class A,B,F,G,H,I,J check
    class C success
    class D,E blocked
```

## 🎤 AI Interview Preparation Flow

```mermaid
sequenceDiagram
    actor Candidate
    participant UI as RozgarLink UI
    participant AI as AI Interview Service
    participant DB as Database

    Candidate->>UI: Start Mock Interview
    UI->>AI: Request Interview Question
    AI-->>UI: Return Question
    UI-->>Candidate: Display Question & Avatar
    Candidate->>UI: Submit Recorded Answer
    UI->>AI: Process Answer
    AI-->>UI: Feedback & Suggestions
    UI->>DB: Save Interview Results
    DB-->>UI: Confirm Saved Results
    UI-->>Candidate: Display Final Report
```

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | Next.js, React, TypeScript, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB |
| AI Features | AI-powered career assistance, learning, and interview preparation |
| Visualization | Mermaid diagrams |

## 📂 Project Structure

```text
RozgarLink/
├── backend/
│   ├── controllers/
│   ├── middlewares/
│   ├── models/
│   ├── routes/
│   └── services/
├── frontend/
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── public/
└── README.md
```

## ⚙️ Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/AnushkaaKulkarni/npm-install-aura.git
cd npm-install-aura
```

### 2. Install Dependencies

```bash
cd backend
npm install
```

In a separate terminal:

```bash
cd frontend
npm install
```

### 3. Configure Environment Variables

Create the required `.env` files using the project's environment examples. Configure database connections and any required AI service credentials.

**Security:** Never commit API keys, passwords, or secret environment files to GitHub.

### 4. Run the Application

Start the backend and frontend using the development scripts defined in their respective `package.json` files.

## 🌟 Project Goal

RozgarLink aims to simplify career development by bringing **employment opportunities, resume improvement, skill development, and interview preparation** together in one AI-powered platform.

---

<p align="center">
  <b>RozgarLink — Connecting Skills, Opportunities & Careers.</b>
</p>
