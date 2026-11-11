import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import { classNames } from "../../lib/utils";

interface MarkdownNotesProps {
  /** Raw markdown string. Plain text with line breaks also works. */
  content: string;
  /** Extra classes appended after the default prose classes. */
  className?: string;
}

export default function MarkdownNotes({
  content,
  className,
}: MarkdownNotesProps) {
  return (
    <div className={classNames("prose max-w-none", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          // External links open in a new tab. Internal anchors (rare in notes)
          // get the same treatment for simplicity — revisit if we ever ship
          // in-app links.
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