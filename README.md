# INTI Library System - Web Interface Architecture

![Status: Live/Production Ready](https://img.shields.io/badge/Status-Production_Ready-success)
![Stack: HTML/CSS/JS](https://img.shields.io/badge/Stack-Vanilla_JS_%7C_CSS3-blue)
![Database: ISIS](https://img.shields.io/badge/Database-ISIS_%2F_WXIS-orange)

Modernized web interface and search architecture for the Central Library of the **National Institute of Industrial Technology (INTI)**, Argentina. 

This repository showcases the frontend architecture and system design that bridges legacy ISIS databases with a modern, responsive web experience. *(Note: Sensitive institutional data, proprietary databases, and private backend executables are strictly excluded from this public repository).*

## 📖 Overview

Many institutional libraries rely on **ISIS databases** and **WXIS** as their backend engine. While extremely powerful for handling complex metadata, their default web interfaces are often outdated, undocumented, and difficult for modern users to navigate. 

This project represents a complete **reverse-engineering and modernization** of the INTI library catalog. It transforms a legacy silo into a fast, user-friendly Single Page Application (SPA) while maintaining the absolute integrity of the underlying MARC21/RDA metadata.

## ✨ Key Features

* **Advanced Search Architecture:** Multi-field combination searches with automatic special character cleanup to maximize information recall.
* **Real-time Suggestions:** A custom-built system that reads a controlled thesaurus (normalized into a JSON structure) to provide instant search suggestions to the user.
* **Modern Results Navigation:** Custom pagination, block navigation, and responsive bibliographic record displays.
* **Data Portability:** Implementation of features to save searches, generate persistent URLs for sharing, and export bibliographic records to CSV and TXT formats.
* **Ecosystem Integration:** Seamless interconnection between the main bibliographic catalog and the institution's Technical Dictionaries.
* **Security & Performance:** Frontend logic designed to work alongside Apache server hardening, supporting security headers, caching strategies, and technical SEO.

## 🛠️ Tech Stack

* **Frontend:** HTML5, Modern CSS3, Vanilla JavaScript
* **Data Structure:** JSON (for thesaurus and API-like data handling)
* **Backend Logic Mapping:** WXIS / `.xis` scripting logic
* **Server Compatibility:** Apache HTTP Server
* **Metadata Standards:** RDA, AACR2, MARC21

## 🧠 Engineering Approach

The core challenge of this project was not just visual design, but **Information Architecture**. The process required:
1. Auditing and decoding legacy `.xis` and `.fdt` database format files.
2. Rewriting the entire search flow logic (Simple, Advanced, Descriptors, Single Record, Export) from scratch to interact cleanly with modern web protocols.
3. Structuring the output to be consumed by a modern DOM without breaking the native ISIS indexing speed.

---

**Architected & Developed by [Joel Foti](https://github.com/fotilejo)** *Information Architect & Systems Developer* 🌐 [Portfolio](https://fotilejo.github.io/joel-foti/) | 💼 [LinkedIn](https://www.linkedin.com/in/joel-foti)
