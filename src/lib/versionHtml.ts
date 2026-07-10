// Server-only utility: decode a stored Yjs document snapshot into a safe HTML
// string for read-only previews. TipTap's Collaboration extension stores the
// ProseMirror document as a Y.XmlFragment named "default"; we walk that fragment
// and emit a whitelisted set of HTML tags. All text is escaped, so the output is
// safe to render with dangerouslySetInnerHTML.

import * as Y from "yjs";

// ProseMirror node name -> simple wrapping HTML tag.
const BLOCK_TAGS: Record<string, string> = {
  paragraph: "p",
  blockquote: "blockquote",
  bulletList: "ul",
  orderedList: "ol",
  listItem: "li",
  taskList: "ul",
  taskItem: "li",
};

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Only allow benign URL schemes for links/images.
function safeUrl(url: unknown): string | null {
  if (typeof url !== "string") return null;
  const trimmed = url.trim();
  if (/^(https?:\/\/|mailto:|data:image\/)/i.test(trimmed)) return trimmed;
  return null;
}

function serializeText(node: Y.XmlText): string {
  const delta = node.toDelta() as Array<{
    insert?: unknown;
    attributes?: Record<string, unknown>;
  }>;

  return delta
    .map((op) => {
      if (typeof op.insert !== "string") return "";
      let text = escapeHtml(op.insert).replace(/\n/g, "<br>");
      const attrs = op.attributes || {};

      if (attrs.code) text = `<code>${text}</code>`;
      if (attrs.bold) text = `<strong>${text}</strong>`;
      if (attrs.italic) text = `<em>${text}</em>`;
      if (attrs.underline) text = `<u>${text}</u>`;
      if (attrs.strike) text = `<s>${text}</s>`;
      if (attrs.highlight) text = `<mark>${text}</mark>`;
      if (attrs.link) {
        const raw =
          typeof attrs.link === "object" && attrs.link !== null
            ? (attrs.link as { href?: unknown }).href
            : attrs.link;
        const href = safeUrl(raw);
        if (href) {
          text = `<a href="${escapeHtml(href)}" target="_blank" rel="noreferrer noopener">${text}</a>`;
        }
      }
      return text;
    })
    .join("");
}

function serializeElement(node: Y.XmlElement): string {
  const name = node.nodeName;
  const children = node.toArray().map(serializeNode).join("");

  if (name === "heading") {
    const level = Math.min(6, Math.max(1, Number(node.getAttribute("level")) || 1));
    return `<h${level}>${children}</h${level}>`;
  }
  if (name === "codeBlock") {
    return `<pre><code>${children}</code></pre>`;
  }
  if (name === "horizontalRule") return "<hr>";
  if (name === "hardBreak") return "<br>";
  if (name === "image") {
    const src = safeUrl(node.getAttribute("src"));
    if (!src) return "";
    const alt = escapeHtml(String(node.getAttribute("alt") ?? ""));
    return `<img src="${escapeHtml(src)}" alt="${alt}" />`;
  }

  const tag = BLOCK_TAGS[name];
  if (tag) return `<${tag}>${children}</${tag}>`;

  // Unknown node type: preserve its content without an extra wrapper.
  return children;
}

function serializeNode(node: Y.XmlElement | Y.XmlText | Y.XmlHook): string {
  if (node instanceof Y.XmlText) return serializeText(node);
  if (node instanceof Y.XmlElement) return serializeElement(node);
  return "";
}

/**
 * Convert a Yjs state snapshot (full document update) into safe HTML.
 * Returns an empty string when the snapshot is empty or cannot be decoded.
 */
export function yDocSnapshotToHtml(snapshot: Uint8Array): string {
  if (!snapshot || snapshot.length === 0) return "";
  const doc = new Y.Doc();
  try {
    Y.applyUpdate(doc, snapshot);
    const fragment = doc.getXmlFragment("default");
    return fragment.toArray().map(serializeNode).join("");
  } catch {
    return "";
  } finally {
    doc.destroy();
  }
}

/** Render plain-text content as escaped paragraph HTML (fallback preview). */
export function plainTextToHtml(text: string): string {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (paragraphs.length === 0) return "";
  return paragraphs
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
}
