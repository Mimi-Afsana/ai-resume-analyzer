import { useState } from "react";
import "./App.css";
import { pdfjs } from "react-pdf";

// PDF worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

function App() {
  const [jobRole, setJobRole] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  // PDF upload
  const handlePdfUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const typedArray = new Uint8Array(event.target.result);
      try {
        const pdf = await pdfjs.getDocument(typedArray).promise;
        const linesSet = new Set();
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          content.items.forEach((item) => {
            const line = item.str.trim();
            if (line) linesSet.add(line);
          });
        }
        setResumeText(Array.from(linesSet).join("\n\n"));
      } catch (err) {
        console.error("PDF parse error:", err);
        alert("Error reading PDF. Make sure it's not corrupted.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Dynamic Mock AI analyze
  const analyzeResume = () => {
    if (!resumeText || !jobRole) {
      alert("Enter Job Role and upload/paste resume");
      return;
    }

    setLoading(true);
    setResult("");

    setTimeout(() => {
      // Define skills
      const skills = [
        "React",
        "JavaScript",
        "CSS",
        "Node.js",
        "TypeScript",
        "HTML",
        "Python",
        "SQL",
        "AI",
        "Machine Learning",
      ];

      // Detect skills in resume
      const foundSkills = skills.filter((s) =>
        resumeText.toLowerCase().includes(s.toLowerCase())
      );
      const missingSkills = skills.filter((s) => !foundSkills.includes(s));

      // Skill match % + random variation
      let skillMatch = Math.round((foundSkills.length / skills.length) * 100);
      skillMatch += Math.floor(Math.random() * 5); // +0 to +4%
      if (skillMatch > 100) skillMatch = 100;

      // Strengths / Improvement tips
      const aiResponse = `
Job Role: ${jobRole}

Skill Match: ${skillMatch}%
Strengths: ${foundSkills.join(", ") || "None"}
Missing Skills: ${missingSkills.join(", ") || "None"}
Improvement Tips:
- Focus on missing skills: ${missingSkills.slice(0, 3).join(", ") || "None"}
- Practice real-world projects with ${jobRole} focus
- Keep updating skills regularly
`;

      setResult(aiResponse);
      setLoading(false);
    }, 1200); // simulate loading
  };

  return (
    <div className="container">
      <div className="card">
        <h1>AI Resume Analyzer (Mock)</h1>

        <input
          type="text"
          placeholder="Job Role"
          value={jobRole}
          onChange={(e) => setJobRole(e.target.value)}
        />

        <input type="file" accept=".pdf" onChange={handlePdfUpload} />

        <textarea
          placeholder="Or paste resume here..."
          value={resumeText}
          onChange={(e) => setResumeText(e.target.value)}
        />

        <button onClick={analyzeResume} disabled={loading}>
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
