"use client";

import { useState } from "react";
import { Editor } from "@tiptap/react";
import { X, Sparkles, Wand2, FileText, Expand, SpellCheck, Languages, HelpCircle, Loader2, ArrowRight, Copy, Check } from "lucide-react";

interface AIAssistantProps {
  editor: Editor;
  onClose: () => void;
}

const AI_ACTIONS = [
  { action: "improve", label: "Improve Writing", icon: <Wand2 size={14} />, desc: "Make it clearer and more engaging" },
  { action: "summarize", label: "Summarize", icon: <FileText size={14} />, desc: "Condense into key points" },
  { action: "expand", label: "Expand", icon: <Expand size={14} />, desc: "Add more detail and depth" },
  { action: "fix_grammar", label: "Fix Grammar", icon: <SpellCheck size={14} />, desc: "Correct grammar and spelling" },
  { action: "simplify", label: "Simplify", icon: <HelpCircle size={14} />, desc: "Use simpler language" },
  { action: "translate", label: "Translate", icon: <Languages size={14} />, desc: "Translate to another language" },
];

export default function AIAssistant({ editor, onClose }: AIAssistantProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [activeAction, setActiveAction] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [language, setLanguage] = useState("Spanish");

  const getSelectedText = () => {
    const { from, to } = editor.state.selection;
    return editor.state.doc.textBetween(from, to, " ");
  };

  const runAction = async (action: string) => {
    const text = getSelectedText();
    if (!text) { setError("Select some text first"); setTimeout(() => setError(""), 3000); return; }

    setLoading(true); setActiveAction(action); setResult(""); setError("");
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, text, language: action === "translate" ? language : undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setResult(data.result);
    } catch { setError("AI service unavailable"); }
    finally { setLoading(false); }
  };

  const insertResult = () => {
    if (!result) return;
    const { from, to } = editor.state.selection;
    editor.chain().focus().deleteRange({ from, to }).insertContentAt(from, result).run();
    setResult("");
  };

  const copyResult = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="animate-slide-in-right" style={{ width: 320, borderLeft: "1px solid var(--border-subtle)", background: "var(--bg-surface)", display: "flex", flexDirection: "column", height: "calc(100vh - 92px)" }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Sparkles size={16} style={{ color: "var(--color-primary-light)" }} />
          <h3 style={{ fontSize: 15, fontWeight: 700 }}>AI Assistant</h3>
        </div>
        <button onClick={onClose} className="btn btn-ghost btn-icon" style={{ width: 28, height: 28 }}><X size={14} /></button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
        <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>Select text in the editor, then choose an action below.</p>

        {error && <div style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(239,68,68,0.1)", color: "var(--color-error)", fontSize: 12, marginBottom: 12 }}>{error}</div>}

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {AI_ACTIONS.map(a => (
            <button key={a.action} onClick={() => runAction(a.action)} className="btn btn-secondary" disabled={loading} style={{ justifyContent: "flex-start", textAlign: "left", padding: "10px 14px", gap: 10, fontSize: 13 }}>
              <span style={{ color: "var(--color-primary-light)" }}>{a.icon}</span>
              <div>
                <div style={{ fontWeight: 500 }}>{a.label}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 400 }}>{a.desc}</div>
              </div>
              {loading && activeAction === a.action && <Loader2 size={14} className="animate-spin-slow" style={{ marginLeft: "auto" }} />}
            </button>
          ))}
        </div>

        {/* Language for translate */}
        <div style={{ marginTop: 12 }}>
          <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Translation language</label>
          <select value={language} onChange={e => setLanguage(e.target.value)} className="input" style={{ fontSize: 12 }}>
            {["Spanish", "French", "German", "Hindi", "Japanese", "Chinese", "Arabic", "Portuguese"].map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        {/* Result */}
        {result && (
          <div className="animate-fade-in" style={{ marginTop: 16, padding: 14, borderRadius: 10, background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--color-primary-light)" }}>AI Result</span>
              <button onClick={copyResult} className="btn btn-ghost btn-sm" style={{ padding: "2px 8px", fontSize: 11, gap: 4 }}>
                {copied ? <><Check size={10} /> Copied</> : <><Copy size={10} /> Copy</>}
              </button>
            </div>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{result}</p>
            <button onClick={insertResult} className="btn btn-primary btn-sm" style={{ width: "100%", marginTop: 12, fontSize: 12 }}>
              <ArrowRight size={12} /> Replace Selection
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
