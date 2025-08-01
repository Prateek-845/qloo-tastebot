# QFusion (The Future CultureLens) 

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A web application that integrates **Qloo’s Taste AI™ API** with advanced Large Language Models (LLMs) like OpenAI GPT, Anthropic Claude, and Google Gemini to deliver personalized, culturally relevant recommendations across multiple domains such as movies, TV shows, books, brands, destinations, podcasts, and more.

This project was developed for the **Qloo LLM Hackathon** and demonstrates how taste and behavior data can be combined with powerful AI summarization to create intuitive discovery and recommendation experiences.

---

## Table of Contents

- [Features](#features)  
- [Demo](#demo)  
- [Tech Stack](#tech-stack)  
- [Installation](#installation)  
- [Running the Project](#running-the-project)  
- [Environment Variables](#environment-variables)  
- [Usage Guide](#usage-guide)  
- [Project Structure](#project-structure)  
- [Contributing](#contributing)  
- [License](#license)  
- [Acknowledgements](#acknowledgements)  

---

## Features

- **Multi-domain recommendations:** Explore insights about movies, music, books, brands, places, and more.  
- **Dynamic filtering:** Use detailed filters such as genres, popularity, year ranges, demographics, cuisines, and others to tailor results.  
- **AI-powered summaries:** Leverage multiple LLMs (Anthropic Claude, OpenAI GPT, Google Gemini, etc.) to generate rich, human-readable summaries and contextual insights.  
- **Intuitive UI:** Responsive React frontend built with Vite and styled with Tailwind CSS for smooth interaction, featuring tab navigation and clean card layouts.  
- **Backend API proxy:** Express server interacting securely with Qloo API and the OpenRouter API for LLM calls.  
- **Error handling and feedback:** Includes loading spinners, error messages, and accessible form controls for enhanced UX.

---

## Demo

[Click here to view the demo video](https://youtu.be/JkXBwzYhFXg)

You can **try the live app here**: [https://qfusion-frontend.onrender.com](https://qfusion-frontend.onrender.com)

---

## Tech Stack

- **Frontend:** React, Vite, Tailwind CSS  
- **Backend:** Node.js, Express.js  
- **APIs:**  
  - Qloo Taste AI™ API  
  - OpenRouter API (for Anthropic Claude, OpenAI, Google Gemini and more)  
- **Languages:** JavaScript (ES6+)   

---

## Installation

### Prerequisites

- Node.js (v16+ recommended) and npm installed  
- Valid API keys for Qloo Taste AI™ and OpenRouter (or your chosen LLM endpoint)

### Steps

1. **Clone the repository:**
2. **Setup the Server:**  
3. **Edit `.env` file:**  
4. **Start the backend server:**
5. **Setup the Client:**
6. **Configure Client API URL**
7. **Start the frontend:**

8. **Access the app:**  
   - Open [http://localhost:5173](http://localhost:5173) in your browser (or the port Vite shows) for local development  
   - Or access the **deployed app** at [https://qfusion-frontend.onrender.com](https://qfusion-frontend.onrender.com)

---

## Running the Project

1. **Backend:** Runs on port 5000 by default. Handles API requests to Qloo and OpenRouter.  
2. **Frontend:** Runs on port 5173 by default, serving the React UI.

Both must be running concurrently for the app to work properly.

---

## Environment Variables

### Server `.env`

| Variable            | Description                                 | Example                              |
|---------------------|---------------------------------------------|------------------------------------|
| `QLOO_API_KEY`       | Your Qloo Taste AI™ API key                  | `zwVscAsY50zu7mVlwscQLzz73AMQ7DCArLOw3g8iL4Y` |
| `QLOO_API_URL`       | Base URL for Qloo API                         | `https://hackathon.api.qloo.com`   |
| `OPENROUTER_API_KEY` | API key for OpenRouter LLM API service       | `sk-or-v1-examplekeyhere`           |

---

### Client `.env`

| Variable        | Description                             | Example                   |
|-----------------|-----------------------------------------|---------------------------|
| `VITE_API_URL`  | URL where backend API is running         | `http://localhost:5000`   |

---

## Usage Guide

- **Select Entity Type:** Choose from Movies, Books, Brands, Places, TV Shows, Podcasts, Artists, etc.  
- **Set Filters:** Available filters depend on the entity type, such as genre, popularity thresholds, release years, cuisines, and demographics.  
- **Optional Message:** Guide the AI to summarize results as you want (e.g., "Only summarize fashion brands").  
- **Select AI Model:** Choose your desired LLM for summary generation.  
- **Submit:** Click the button to fetch recommendations and AI-generated summaries.  
- **View Results:** Summaries and the list of included items appear below the form.

---


## Project Structure
```
qloo-tastebot/
├── client/                      # React frontend application
│   ├── src/                     # Source files for React
│   │   ├── components/          # Reusable React components (UI and logic)
│   │   ├── api/                 # API utility functions for backend communication
│   │   ├── App.jsx              # Main React app component
│   │   ├── App.css              # Main stylesheet
│   │   └── index.jsx            # React entry point
│   ├── public/                  # Static assets (favicon, index.html, images)
│   ├── .env.example             # Sample client-side environment variables
│   └── package.json             # Frontend dependencies and scripts
│
├── server/                      # Express backend API
│   ├── routes/                  # API route definitions (Qloo, LLM, etc.)
│   ├── middleware/              # Express middleware (error handling, request parsing)
│   ├── utils/                   # Utility functions (API clients, validation, etc.)
│   ├── index.js                 # Main server entry file
│   ├── .env.example             # Sample backend environment variables
│   └── package.json             # Backend dependencies and scripts
│
├── README.md                    # Project documentation (this file)
├── package.json / yarn.lock     # Root-level dependencies and project metadata (if monorepo)
└── LICENSE                      # License file (MIT)
```
---

---

## Contributing

Contributions are welcome! Feel free to:

- Open issues to report bugs or request features  
- Submit pull requests with improvements or fixes  
- Suggest enhancements through discussions or issues  

---

## License

This project is licensed under the **MIT License**. See [LICENSE](LICENSE) for details.

---

## Acknowledgements

- Thanks to **Qloo** for the Taste AI™ API and hackathon opportunity.  
- Thanks to **OpenRouter** and LLM providers for AI summarization services.  
- Inspiration and tooling credits to Vite, Tailwind CSS, React, and the open-source community.

---

*Developed by Prateek Bajpai & Sarthak Gupta for the Qloo LLM Hackathon 2025*
