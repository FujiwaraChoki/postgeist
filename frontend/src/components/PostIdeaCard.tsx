import { Copy, Hash, MessageCircle } from "lucide-react";
import { PostIdea } from "../types";
import { getCharacterCount } from "../lib/utils";

interface PostIdeaCardProps {
  idea: PostIdea;
  index: number;
  onCopy: () => void;
}

export default function PostIdeaCard({ idea, index, onCopy }: PostIdeaCardProps) {
  const { count, status } = getCharacterCount(idea.text);

  const getStatusColor = () => {
    switch (status) {
      case "good":
        return "text-green-600";
      case "warning":
        return "text-yellow-600";
      case "error":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center mb-2">
            <span className="inline-flex items-center justify-center w-6 h-6 bg-primary-100 text-primary-600 text-xs font-medium rounded-full mr-2">
              {index}
            </span>
            {idea.community && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                <Hash className="w-3 h-3 mr-1" />
                {idea.community}
              </span>
            )}
            <span className={`text-xs font-medium ${getStatusColor()}`}>{count}/280</span>
          </div>

          <p className="text-gray-900 mb-3 leading-relaxed">{idea.text}</p>

          {idea.reasoning && (
            <div className="bg-gray-50 p-3 rounded text-sm text-gray-600">
              <div className="flex items-center mb-1">
                <MessageCircle className="w-3 h-3 mr-1" />
                <span className="font-medium">Reasoning:</span>
              </div>
              {idea.reasoning}
            </div>
          )}
        </div>

        <button
          onClick={onCopy}
          className="ml-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
          title="Copy to clipboard"
        >
          <Copy className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
