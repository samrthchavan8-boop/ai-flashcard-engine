# 🤖 AI Flashcard Engine

An AI-powered study engine that helps students learn any topic using AI-generated study notes, interactive 3D flashcards, voice commands, and PDF export.

## 🌐 Live Demo

👉 [Try AI Flashcard Engine](https://ai-flashcard-engine.vercel.app)

## ✨ Features

- 🤖 **AI Generation** — Generate structured study notes using Google Gemini.
- 🧠 **Interactive Flashcards** — Learn using animated 3D flashcards.
- 🎤 **Voice Control** — Use voice commands for an interactive study experience.
- 📄 **PDF Export** — Export your flashcard deck as a PDF.
- 📱 **Responsive Design** — Designed to work across different screen sizes.
- ⚡ **Serverless Backend** — AI requests are handled through Vercel Serverless Functions.

## 🛠️ Tech Stack

- **Frontend:** HTML5, CSS, JavaScript, Tailwind CSS
- **Backend:** Vercel Serverless Functions
- **Runtime:** Node.js
- **AI:** Google Gemini API
- **PDF:** jsPDF
- **Voice:** Web Speech API

## 🏗️ Architecture

```text
User
  ↓
Frontend
  ↓
Vercel Serverless API
  ↓
Google Gemini API
  ↓
AI-generated Study Content
  ↓
Interactive Flashcards
