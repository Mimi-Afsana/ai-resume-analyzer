import { useState } from "react";
import "./App.css";
import { Document, Page } from "react-pdf";

function App() {
  const [jobRole, setJobRole] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);

  // PDF Upload and Read
  const handlePdfUpload = (e) => {
    const file = e.target.files[0];
    setPdfFile(file);

    const reader = new FileReader();
    reader.onload = function (event) {
      const typedArray = new Uint8Array(event.target.result);
      import("pdfjs-dist").then((pdfjsLib) => {
        pdfjsLib.GlobalWorkerOptions.workerSrc =
          `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.js`;
        pdfjsLib.getDocument(typedArray).promise.then((pdf) => {
          let allText = "";
          let pagesPromises = [];
          for (let i = 1; i <= pdf.numPages; i++) {
            pagesPromises.push(
              pdf.getPage(i).then((page) =>
                page.getTextContent().then((textContent) => {
                  const pageText = textContent.items.map((s) => s.str).join(" ");
                  allText += pageText + "\n";
                })
              )
            );
          }
          Promise.all(pagesPromises).then(() => {
            setResumeText(allText);
          });
        });
      });
    };
    reader.readAsArrayBuffer(file);
  };

  // Analyze Resume
  const analyzeResume = async () => {
    if (!resumeText || !jobRole) {
      alert("Enter job role and upload/paste resume.");
      return;
    }
    setLoading(true);

    try {
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer YOUR_OPENAI_API_KEY`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: "You are an expert HR resume analyzer." },
              {
                role: "user",
                content: `
Analyze this resume for the role of ${jobRole}.

Resume:
${resumeText}

Give:
1. Skill match percentage
2. Strengths
3. Missing skills
4. Improvement tips
                `,
              },
            ],
          }),
        }
      );
      const data = await response.json();
      setResult(data.choices[0].message.content);
    } catch (error) {
      alert("Error analyzing resume");
      console.error(error);
    }

    setLoading(false);
  };

  return (
    <div className="container">
      <div className="card">
        <h1>AI Resume Analyser</h1>

        <input
          type="text"
          placeholder="Job Role (e.g. React Developer)"
          value={jobRole}
          onChange={(e) => setJobRole(e.target.value)}
        />

        <input type="file" accept=".pdf" onChange={handlePdfUpload} />

        <textarea
          placeholder="Or paste resume here..."
          value={resumeText}
          onChange={(e) => setResumeText(e.target.value)}
        />

        <button onClick={analyzeResume}>
          {loading ? "Analyzing..." : "Analyze Resume"}
        </button>

        {loading && (
          <div className="progress-bar">
            <div className="progress" />
          </div>
        )}

        {result && (
          <div className="result">
            <h3>Analysis Result</h3>
            <pre>{result}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
