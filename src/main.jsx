import { SurveyParticipant } from "./components/modules/SurveyParticipant";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { ThemeProvider } from "./context/ThemeContext";
import { LanguageProvider } from "./context/LanguageContext";

const participantToken = new URLSearchParams(window.location.search).get(
  "participate",
);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      <LanguageProvider>
        {participantToken !== null ? (
          <SurveyParticipant token={participantToken} />
        ) : (
          <App />
        )}
      </LanguageProvider>
    </ThemeProvider>
  </StrictMode>,
);
