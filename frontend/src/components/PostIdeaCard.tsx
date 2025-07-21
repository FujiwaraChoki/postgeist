import { Copy, Hash, MessageCircle, Sparkles, Settings } from "lucide-react";
import type { PostIdea } from "../types";
import { getCharacterCount } from "../lib/utils";

interface PostIdeaCardProps {
  idea: PostIdea;
  index: number;
  onCopy: () => void;
  onTweak?: () => void;
}

export default function PostIdeaCard({ idea, index, onCopy, onTweak }: PostIdeaCardProps) {
  const { count, status } = getCharacterCount(idea.text);

  const getStatusColor = () => {
    switch (status) {
      case "good":
        return "text-green-600 bg-green-50 border-green-200";
      case "warning":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "error":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getIndexColor = () => {
    const colors = [
      "from-blue-500 to-blue-600",
      "from-purple-500 to-purple-600",
      "from-green-500 to-green-600",
      "from-yellow-500 to-yellow-600",
      "from-pink-500 to-pink-600",
      "from-indigo-500 to-indigo-600",
      "from-red-500 to-red-600",
      "from-teal-500 to-teal-600"
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="group relative overflow-hidden rounded-xl bg-white border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

      <div className="relative p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center mb-4">
              {/* Enhanced index badge */}
              <div
                className={`inline-flex items-center justify-center w-8 h-8 bg-gradient-to-r ${getIndexColor()} text-white text-sm font-bold rounded-lg mr-3 shadow-lg`}
              >
                {index}
              </div>

              {/* Community badge */}
              {idea.community && (
                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-300/50 mr-3 hover:shadow-md transition-all">
                  <Hash className="w-3 h-3 mr-1" />
                  {idea.community}
                </span>
              )}

              {/* Enhanced character count */}
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor()}`}
              >
                {count}/280
              </span>
            </div>

            {/* Post text with better typography */}
            <p className="text-gray-900 mb-4 leading-relaxed text-base font-medium">{idea.text}</p>

            {/* Enhanced reasoning section */}
            {idea.reasoning && (
              <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-gray-50 to-gray-100/50 border border-gray-200 p-4 hover:shadow-md transition-all">
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-gray-200/20 to-transparent rounded-bl-full"></div>
                <div className="relative">
                  <div className="flex items-center mb-2">
                    <div className="p-1.5 bg-gray-600 rounded-md mr-2">
                      <MessageCircle className="w-3 h-3 text-white" />
                    </div>
                    <span className="font-semibold text-gray-700 text-sm">Reasoning:</span>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">{idea.reasoning}</p>
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="ml-6 group-hover:ml-4 flex flex-col gap-2 transition-all duration-300">
            {/* Tweak button */}
            {onTweak && (
              <button
                onClick={onTweak}
                className="p-3 text-gray-400 hover:text-white hover:bg-gradient-to-r hover:from-orange-500 hover:to-red-600 rounded-xl transition-all duration-300 hover:shadow-lg transform hover:scale-110"
                title="Tweak this post with feedback"
              >
                <Settings className="w-5 h-5" />
              </button>
            )}

            {/* Copy button */}
            <button
              onClick={onCopy}
              className="p-3 text-gray-400 hover:text-white hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 rounded-xl transition-all duration-300 hover:shadow-lg transform hover:scale-110"
              title="Copy to clipboard"
            >
              <Copy className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Decorative element */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>
    </div>
  );
}
