import React, { useRef, useState } from "react";
import { Copy, Link2 } from "lucide-react";
import { surveyRequest } from "../../services/surveys";

export function SurveyShareLink({ survey, compact = false }) {
  const [generated, setGenerated] = useState(null),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [manual, setManual] = useState(false);
  const input = useRef(null),
    path =
      survey.participantPath ||
      (generated?.id === survey.id ? generated.path : null),
    url = path ? new URL(path, window.location.origin).href : "";
  const copy = async () => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      let target = url;
      if (!target) {
        const data = await surveyRequest(
          "/" + survey.id + "/share",
          "PATCH",
          {},
        );
        setGenerated({ id: survey.id, path: data.survey.participantPath });
        target = new URL(data.survey.participantPath, window.location.origin)
          .href;
      }
      try {
        await navigator.clipboard.writeText(target);
        setMessage("Participant link copied.");
      } catch {
        setManual(true);
        setMessage("Select and copy the participant link below.");
        setTimeout(() => {
          input.current?.focus();
          input.current?.select();
        }, 0);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  if (!survey.canManage) return null;
  return (
    <div className={"se-share " + (compact ? "is-compact" : "")}>
      {!compact && (
        <>
          <div className="se-share-heading">
            <Link2 size={18} />
            <div>
              <strong>Participant link</strong>
              <p>
                Copy and send this link to invite responses. No participant
                account is needed.
              </p>
            </div>
          </div>
          <p className="se-share-status">
            {survey.status === "Draft"
              ? "Open collection before participants can submit."
              : survey.status === "Closed"
                ? "Collection is closed. This link no longer accepts responses."
                : survey.sampling === "random"
                  ? "Send invitation codes privately to the sampled participants along with this link."
                  : "Anyone with this link can respond. These are voluntary respondent findings."}
          </p>
        </>
      )}
      <div className="se-share-controls">
        {(!compact || manual) && (
          <input
            ref={input}
            aria-label="Participant link"
            readOnly
            value={url}
            placeholder="Generate a participant link"
            onFocus={(e) => e.target.select()}
          />
        )}
        <button type="button" disabled={busy} onClick={copy}>
          <Copy size={14} />
          {busy
            ? "Preparing…"
            : path
              ? "Copy participant link"
              : "Generate & copy link"}
        </button>
      </div>
      {message && <small role="status">{message}</small>}
      {error && <small role="alert">{error}</small>}
    </div>
  );
}
