import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { classNames } from "../../lib/utils";

interface MarkdownNotesProps {
  content: string;
  className?: string;
}

export default function MarkdownNotes({
  content,
  className,
}: MarkdownNotesProps) {
  // Convert standard LaTeX delimiters to Markdown Math delimiters
  const formattedContent = content
    .replace(/\\\[/g, "$$$$")
    .replace(/\\\]/g, "$$$$")
    .replace(/\\\(/g, "$")
    .replace(/\\\)/g, "$");

  return (
    <div className={classNames("prose max-w-none", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          a: ({ node: _node, ...props }) => (
            <a {...props} target="_blank" rel="noopener noreferrer" />
          ),
        }}
      >
        {formattedContent}
      </ReactMarkdown>
    </div>
  );
}