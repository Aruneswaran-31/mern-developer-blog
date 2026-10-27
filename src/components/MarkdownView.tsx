import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

const codeTheme = {
  ...oneDark,
  'pre[class*="language-"]': {
    ...oneDark['pre[class*="language-"]'],
    background: "transparent",
    margin: 0,
    padding: 0,
    fontSize: "inherit",
    lineHeight: 1.6,
  },
  'code[class*="language-"]': {
    ...oneDark['code[class*="language-"]'],
    background: "transparent",
    fontSize: "inherit",
    fontFamily:
      '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
  },
};

interface MarkdownViewProps {
  content: string;
  className?: string;
}

export default function MarkdownView({ content, className }: MarkdownViewProps) {
  return (
    <div className={`markdown-body ${className ?? ""}`}>
      <ReactMarkdown
        components={{
          code({ className: codeClass, children, ...rest }) {
            const match = /language-([\w-]+)/.exec(codeClass ?? "");
            const text = String(children).replace(/\n$/, "");

            if (!match) {
              return (
                <code className={codeClass} {...rest}>
                  {children}
                </code>
              );
            }

            return (
              <SyntaxHighlighter
                language={match[1]}
                style={codeTheme}
                PreTag="div"
                customStyle={{
                  margin: 0,
                  padding: 0,
                  background: "transparent",
                }}
              >
                {text}
              </SyntaxHighlighter>
            );
          },
          a({ children, ...rest }) {
            return (
              <a
                {...rest}
                target="_blank"
                rel="noreferrer noopener"
                className="break-words"
              >
                {children}
              </a>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
