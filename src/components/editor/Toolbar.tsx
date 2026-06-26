"use client";

import { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListChecks,
  Quote,
  Minus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Highlighter,
  Undo2,
  Redo2,
} from "lucide-react";
import { useCallback } from "react";

interface ToolbarProps {
  editor: Editor;
}

export default function EditorToolbar({ editor }: ToolbarProps) {
  const setLink = useCallback(() => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl);

    if (url === null) return;

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  return (
    <div className="editor-toolbar">
      {/* History */}
      <div className="toolbar-group">
        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="toolbar-btn"
          title="Undo"
        >
          <Undo2 size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="toolbar-btn"
          title="Redo"
        >
          <Redo2 size={16} />
        </button>
      </div>

      <div className="toolbar-divider" />

      {/* Headings */}
      <div className="toolbar-group">
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`toolbar-btn ${editor.isActive("heading", { level: 1 }) ? "is-active" : ""}`}
          title="Heading 1"
        >
          <Heading1 size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`toolbar-btn ${editor.isActive("heading", { level: 2 }) ? "is-active" : ""}`}
          title="Heading 2"
        >
          <Heading2 size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`toolbar-btn ${editor.isActive("heading", { level: 3 }) ? "is-active" : ""}`}
          title="Heading 3"
        >
          <Heading3 size={16} />
        </button>
      </div>

      <div className="toolbar-divider" />

      {/* Text formatting */}
      <div className="toolbar-group">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`toolbar-btn ${editor.isActive("bold") ? "is-active" : ""}`}
          title="Bold (Ctrl+B)"
        >
          <Bold size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`toolbar-btn ${editor.isActive("italic") ? "is-active" : ""}`}
          title="Italic (Ctrl+I)"
        >
          <Italic size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`toolbar-btn ${editor.isActive("underline") ? "is-active" : ""}`}
          title="Underline (Ctrl+U)"
        >
          <UnderlineIcon size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`toolbar-btn ${editor.isActive("strike") ? "is-active" : ""}`}
          title="Strikethrough"
        >
          <Strikethrough size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={`toolbar-btn ${editor.isActive("code") ? "is-active" : ""}`}
          title="Inline Code"
        >
          <Code size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          className={`toolbar-btn ${editor.isActive("highlight") ? "is-active" : ""}`}
          title="Highlight"
        >
          <Highlighter size={16} />
        </button>
      </div>

      <div className="toolbar-divider" />

      {/* Lists */}
      <div className="toolbar-group">
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`toolbar-btn ${editor.isActive("bulletList") ? "is-active" : ""}`}
          title="Bullet List"
        >
          <List size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`toolbar-btn ${editor.isActive("orderedList") ? "is-active" : ""}`}
          title="Numbered List"
        >
          <ListOrdered size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          className={`toolbar-btn ${editor.isActive("taskList") ? "is-active" : ""}`}
          title="Task List"
        >
          <ListChecks size={16} />
        </button>
      </div>

      <div className="toolbar-divider" />

      {/* Block elements */}
      <div className="toolbar-group">
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`toolbar-btn ${editor.isActive("blockquote") ? "is-active" : ""}`}
          title="Blockquote"
        >
          <Quote size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="toolbar-btn"
          title="Horizontal Rule"
        >
          <Minus size={16} />
        </button>
        <button
          onClick={setLink}
          className={`toolbar-btn ${editor.isActive("link") ? "is-active" : ""}`}
          title="Insert Link"
        >
          <LinkIcon size={16} />
        </button>
      </div>

      <div className="toolbar-divider" />

      {/* Alignment */}
      <div className="toolbar-group">
        <button
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          className={`toolbar-btn ${editor.isActive({ textAlign: "left" }) ? "is-active" : ""}`}
          title="Align Left"
        >
          <AlignLeft size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          className={`toolbar-btn ${editor.isActive({ textAlign: "center" }) ? "is-active" : ""}`}
          title="Align Center"
        >
          <AlignCenter size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          className={`toolbar-btn ${editor.isActive({ textAlign: "right" }) ? "is-active" : ""}`}
          title="Align Right"
        >
          <AlignRight size={16} />
        </button>
      </div>
    </div>
  );
}
