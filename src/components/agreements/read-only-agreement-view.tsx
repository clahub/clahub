import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Card, CardContent } from "@/components/ui/card";

interface ReadOnlyAgreementViewProps {
  text: string;
}

export function ReadOnlyAgreementView({ text }: ReadOnlyAgreementViewProps) {
  return (
    <Card>
      <CardContent className="prose dark:prose-invert max-w-none pt-6">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
      </CardContent>
    </Card>
  );
}
