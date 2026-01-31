import { useState } from "react";
import "./App.css";
import { pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

function App() {
  const [jobRole, setJobRole] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const roleSkillMap = {
    "react developer": { major: ["react", "javascript", "html", "css"], minor: ["jsx", "hooks", "state", "props", "component"] },
    "frontend developer": { major: ["html", "css", "javascript", "react"], minor: ["responsive", "tailwind", "bootstrap", "ui"] },
    "backend developer": { major: ["node", "express", "mongodb", "api"], minor: ["authentication", "database", "jwt"] },
    "javascript developer": { major: ["javascript", "es6", "dom", "async"], minor: ["promise", "api", "function"] },
    "web developer": { major: ["html", "css", "javascript", "react"], minor: ["node", "api", "website"] },
    "angular.js developer": { major: ["angular", "angularjs", "typescript", "html", "css"], minor: ["rxjs", "ngmodules", "services", "components"] }
  };

  const normalizeRole = (input) => {
    const role = input.trim().toLowerCase();
    const aliases = {
      "angular.js developer": ["angular.js developer", "angular developer", "angularjs developer"],
      "react developer": ["react developer", "react.js developer"],
      "frontend developer": ["frontend developer", "ui developer"],
      "backend developer": ["backend developer", "node developer"],
      "javascript developer": ["javascript developer", "js developer"],
      "web developer": ["web developer", "fullstack developer"]
    };
    for (let key in aliases) if (aliases[key].includes(role)) return key;
    return "web developer";
  };

  const handlePdfUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const typedArray = new Uint8Array(event.target.result);
      try {
        const pdf = await pdfjs.getDocument(typedArray).promise;
        const textSet = new Set();
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          content.items.forEach((item) => {
            const line = item.str.trim();
            if (line) textSet.add(line);
          });
        }
        setResumeText([...textSet].join("\n"));
      } catch (err) {
        alert("Error reading PDF.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const analyzeResume = () => {
    if (!resumeText || !jobRole) {
      alert("Enter Job Role and resume");
      return;
    }
    setLoading(true);
    setResult("");
    setTimeout(() => {
      const roleKey = normalizeRole(jobRole);
      const skills = roleSkillMap[roleKey];
      const resumeLower = resumeText.toLowerCase().replace(/\./g, "").replace(/\s+/g, " ");

      const foundMajor = skills.major.filter((s) => resumeLower.includes(s.toLowerCase()));
      const foundMinor = skills.minor.filter((s) => resumeLower.includes(s.toLowerCase()));
      const foundSkills = [...foundMajor, ...foundMinor];

      const showMissing = roleKey !== "react developer";
      const missingSkills = showMissing ? [...new Set([...skills.major, ...skills.minor].filter(s => !foundSkills.includes(s)))] : [];

      const majorWeight = 80;
      const minorWeight = 20;
      const majorScore = (foundMajor.length / skills.major.length) * majorWeight;
      const minorScore = (foundMinor.length / skills.minor.length) * minorWeight;
      let score = majorScore + minorScore;

      const totalSkillsCount = skills.major.length + skills.minor.length;
      const missingCount = missingSkills.length;
      const totalScoreBeforeDeduction = score;

      let deduction = (totalScoreBeforeDeduction * missingCount) / totalSkillsCount;
      deduction = Math.min(deduction, totalScoreBeforeDeduction * 0.7);
      score = totalScoreBeforeDeduction - deduction;

      if (resumeLower.includes("project")) score += 5;
      if (resumeLower.includes("experience")) score += 5;
      if (resumeLower.includes("github")) score += 5;

      score = Math.max(0, Math.min(100, score));

      const feedback = `
Job Role: ${jobRole}

Skill Match: ${Math.round(score)}%

Strengths:
${foundSkills.length ? "- " + foundSkills.join("\n- ") : "- Basic Web Skills"}

Missing Skills:
${missingSkills.length ? "- " + missingSkills.join("\n- ") : "- None"}

Suggestions:
- Focus on ${jobRole}-related projects
- Add GitHub / portfolio links
- Highlight tools, frameworks, achievements
- Keep resume concise and role-focused
`;
      setResult(feedback);
      setLoading(false);
    }, 500);
  };

  return (
    <div className="container">
      <div className="card">
        <h1>Web Developer Resume Analyzer</h1>
        <input type="text" placeholder="Job Role" value={jobRole} onChange={(e) => setJobRole(e.target.value)} />
        <input type="file" accept=".pdf" onChange={handlePdfUpload} />
        <textarea placeholder="Or paste resume here..." rows="10" value={resumeText} onChange={(e) => setResumeText(e.target.value)} />
        <button onClick={analyzeResume} disabled={loading}>{loading ? "Analyzing..." : "Analyze Resume"}</button>
        {loading && <div className="progress-bar"><div className="progress" /></div>}
        {result && <div className="result"><pre>{result}</pre></div>}
      </div>
    </div>
  );
}

export default App;
