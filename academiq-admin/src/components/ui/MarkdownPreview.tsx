import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";

interface MarkdownPreviewProps {
  content: string;
  /** Shown when content is empty or whitespace-only. */
  emptyText?: string;
}

export default function MarkdownPreview({
  content,
  emptyText = "Nothing to preview yet. Start typing in the Edit tab.",
}: MarkdownPreviewProps) {
  if (!content.trim()) {
    return (
      <div className="rounded-lg border border-dashed border-bg-border bg-bg-primary px-4 py-8 text-center text-sm text-text-muted">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="prose max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          a: ({ node: _node, ...props }) => (
            <a {...props} target="_blank" rel="noopener noreferrer" />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}