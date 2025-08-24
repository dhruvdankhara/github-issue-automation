import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import { cn } from "../lib/utils";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({
  content,
  className,
}: MarkdownRendererProps) {
  return (
    <div className={cn("prose prose-sm max-w-none", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight, rehypeRaw]}
        components={{
          // Custom component overrides for better styling
          code: ({ inline, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || "");

            if (inline) {
              return (
                <code
                  className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm font-mono text-gray-800 dark:text-gray-200"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            return (
              <div className="relative">
                {match && (
                  <div className="absolute top-2 right-2 text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                    {match[1]}
                  </div>
                )}
                <pre className="bg-gray-50 dark:bg-gray-900 border rounded-md overflow-x-auto">
                  <code className={className} {...props}>
                    {children}
                  </code>
                </pre>
              </div>
            );
          },

          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-gray-700 dark:text-gray-300 italic">
              {children}
            </blockquote>
          ),

          table: ({ children }) => (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-600">
                {children}
              </table>
            </div>
          ),

          th: ({ children }) => (
            <th className="border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 px-4 py-2 text-left font-semibold">
              {children}
            </th>
          ),

          td: ({ children }) => (
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">
              {children}
            </td>
          ),

          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
            >
              {children}
            </a>
          ),

          img: ({ src, alt }) => (
            <img
              src={src}
              alt={alt}
              className="max-w-full h-auto rounded-md border"
              loading="lazy"
            />
          ),

          h1: ({ children }) => (
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
              {children}
            </h1>
          ),

          h2: ({ children }) => (
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3 pb-1 border-b border-gray-200 dark:border-gray-700">
              {children}
            </h2>
          ),

          h3: ({ children }) => (
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {children}
            </h3>
          ),

          ul: ({ children }) => (
            <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
              {children}
            </ul>
          ),

          ol: ({ children }) => (
            <ol className="list-decimal list-inside space-y-1 text-gray-700 dark:text-gray-300">
              {children}
            </ol>
          ),

          li: ({ children }) => <li className="ml-4">{children}</li>,

          p: ({ children }) => (
            <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
              {children}
            </p>
          ),

          hr: () => (
            <hr className="my-6 border-t border-gray-300 dark:border-gray-600" />
          ),

          // Task lists (GitHub flavored markdown)
          input: ({ type, checked, disabled }) => {
            if (type === "checkbox") {
              return (
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={disabled}
                  className="mr-2 accent-blue-600"
                  readOnly
                />
              );
            }
            return <input type={type} checked={checked} disabled={disabled} />;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
