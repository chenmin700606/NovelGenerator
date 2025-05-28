# NovelGenerator (Web App)

NovelGenerator is a web application that uses the Gemini API to collaboratively write a book based on a user's premise and desired chapter structure. It generates detailed outlines, character profiles, chapter plans, and full chapter content with integrated consistency checks.

From idea to manuscript, with a little help from AI!

## ✨ Features

*   **Interactive Story Input:** Provide your story premise and desired number of chapters.
*   **AI-Powered Generation:** Leverages the Gemini API for:
    *   Story Outline Generation
    *   Character Extraction & Profiling
    *   World Building (e.g., world name, motifs)
    *   Detailed Chapter-by-Chapter Planning
    *   Full Chapter Content Writing
*   **Real-time Progress:** View the generation process step-by-step, including outlines and chapter plans as they are created.
*   **Consistency Checks:** The system aims to maintain narrative consistency throughout the generated content.
*   **Book Preview:** View the final generated book directly in the browser.
*   **Downloadable Content:** (Future Feature) Option to download the final book in various formats.

## 🛠️ Tech Stack

*   **Frontend:** React, TypeScript, Tailwind CSS
*   **AI Integration:** Google Gemini API (`@google/genai`)
*   **Build Tool:** Vite
*   **Package Manager:** npm

## 📋 Prerequisites

*   Node.js (v18 or higher recommended)
*   npm (comes with Node.js)
*   A Google Gemini API Key

## 🚀 Getting Started

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/KazKozDev/NovelGenerator.git # Or your repository URL
    cd NovelGenerator
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up Environment Variables:**
    Create a `.env.local` file in the root of the project and add your Gemini API key:
    ```env
    GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
    ```
    Replace `YOUR_GEMINI_API_KEY_HERE` with your actual API key.

4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application should now be running on `http://localhost:5173` (or another port if 5173 is in use).

## ⚙️ Available Scripts

*   `npm run dev`: Starts the development server.
*   `npm run build`: Builds the application for production.
*   `npm run preview`: Locally previews the production build.

## 💡 How it Works

1.  Enter your story idea in teaser format (see example in the app) and the desired number of chapters.
2.  Our AI will generate a detailed story outline and chapter-by-chapter plan.
3.  Then, it will write each chapter, performing consistency checks along the way.
4.  Finally, your complete book draft will be presented!
5.  Before publication, we recommend a final manual edit to eliminate possible inconsistencies and remove possible technical markup. Re-generation with the same input may give a better result. Save both versions for comparison.

## 🤝 Contributing

Contributions are welcome! If you have suggestions or want to improve the project, please feel free to:

1.  Fork the repository.
2.  Create a new feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details (if you add one).

## 🙏 Acknowledgments

*   Built with the power of the Google Gemini API.
*   Inspired by creative storytelling and AI collaboration.

---

Made with ❤️ by [KazKozDev](https://github.com/KazKozDev)
