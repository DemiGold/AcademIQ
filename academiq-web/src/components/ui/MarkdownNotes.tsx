import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import remarkMath from "remark-math"; // 1. Import remark-math
import rehypeKatex from "rehype-katex"; // 2. Import rehype-katex
import { classNames } from "../../lib/utils";

interface MarkdownNotesProps {
  content: string;
  className?: string;
}

export default function MarkdownNotes({
  content,
  className,
}: MarkdownNotesProps) {
  return (
    <div className={classNames("prose max-w-none", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks, remarkMath]} // 3. Add remarkMath
        rehypePlugins={[rehypeKatex]} // 4. Add rehypeKatex
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