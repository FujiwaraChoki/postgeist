import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Brain,
  MessageSquare,
  Settings,
  RefreshCw,
  Copy,
  Download,
  TrendingUp,
  Users,
  Target,
  Lightbulb,
  Hash,
  Clock,
  BarChart3,
  Calendar,
  Sparkles,
  ArrowLeft
} from "lucide-react";
import toast from "react-hot-toast";
import apiService from "../lib/api";
import type { UserData, PostIdea } from "../types";
import { formatDate, copyToClipboard } from "../lib/utils";
import LoadingSpinner from "../components/LoadingSpinner";
import PostIdeaCard from "../components/PostIdeaCard";

export default function UserProfile() {
  const { username } = useParams<{ username: string }>();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [postIdeas, setPostIdeas] = useState<PostIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [postCount, setPostCount] = useState(10);

  useEffect(() => {
    if (username) {
      loadUserData();
    }
  }, [username]);

  const loadUserData = async () => {
    if (!username) return;

    try {
      setLoading(true);
      const data = await apiService.getUser(username);
      setUserData(data);
    } catch (error) {
      toast.error(`Failed to load user data: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!username) return;

    try {
      setAnalyzing(true);
      const result = await apiService.analyzeUser(username);
      setUserData(prev => (prev ? { ...prev, analysis: result.analysis } : null));
      toast.success("Analysis completed successfully!");
    } catch (error) {
      toast.error(`Analysis failed: ${error}`);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleGenerate = async () => {
    if (!username || !userData?.analysis) return;

    try {
      setGenerating(true);
      const result = await apiService.generatePosts(username, { count: postCount });
      setPostIdeas(result.postIdeas);
      toast.success(`Generated ${result.count} post ideas!`);
    } catch (error) {
      toast.error(`Generation failed: ${error}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyPost = async (text: string) => {
    try {
      await copyToClipboard(text);
      toast.success("Post copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  if (loading) {
    return <LoadingSpinner message={`Loading @${username}...`} />;
  }

  if (!userData) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center">
            <Users className="h-10 w-10 text-red-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">User not found</h2>
          <p className="text-lg text-gray-600 mb-8">The user @{username} could not be found.</p>
          <Link
            to="/"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Enhanced Header with Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 via-white to-purple-50 border border-gray-200 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5"></div>
        <div className="relative p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="relative">
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-4 rounded-2xl shadow-lg">
                  <Users className="h-10 w-10 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div className="ml-6">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  @{userData.username}
                </h1>
                <div className="flex items-center mt-2 text-gray-600">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  <span className="font-medium">{userData.posts.length}</span>
                  <span className="mx-2">•</span>
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>Updated {formatDate(userData.lastUpdated)}</span>
                </div>
              </div>
            </div>
            <div className="flex space-x-3">
              <Link
                to={`/user/${username}/settings`}
                className="inline-flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm text-gray-700 font-medium rounded-xl border border-gray-200 hover:bg-white hover:shadow-md transition-all"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Link>
              <button
                onClick={handleAnalyze}
                disabled={analyzing || userData.posts.length === 0}
                className="inline-flex items-center px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 transition-all transform hover:scale-105 shadow-lg disabled:transform-none"
              >
                {analyzing ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Brain className="w-4 h-4 mr-2" />}
                {userData.analysis ? "Re-analyze" : "Analyze"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Analysis Results */}
      {userData.analysis ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Sparkles className="w-6 h-6 mr-2 text-purple-600" />
              Analysis Results
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Enhanced Summary */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200 shadow-lg hover:shadow-xl transition-all">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-200/30 to-transparent rounded-bl-full"></div>
              <div className="relative p-6">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 ml-3">Summary</h3>
                </div>
                <p className="text-gray-700 leading-relaxed">{userData.analysis.summary}</p>
              </div>
            </div>

            {/* Enhanced Key Themes */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-green-50 to-green-100/50 border border-green-200 shadow-lg hover:shadow-xl transition-all">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-200/30 to-transparent rounded-bl-full"></div>
              <div className="relative p-6">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-green-600 rounded-lg">
                    <Hash className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 ml-3">Key Themes</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {userData.analysis.key_themes.map((theme, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-300/50 hover:shadow-md transition-all"
                    >
                      {theme}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Enhanced Engagement Patterns */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200 shadow-lg hover:shadow-xl transition-all">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-200/30 to-transparent rounded-bl-full"></div>
              <div className="relative p-6">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-purple-600 rounded-lg">
                    <Target className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 ml-3">Engagement Patterns</h3>
                </div>
                <ul className="space-y-3">
                  {userData.analysis.engagement_patterns.map((pattern, index) => (
                    <li key={index} className="flex items-start text-gray-700">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span className="text-sm leading-relaxed">{pattern}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Enhanced Tone Analysis */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-orange-50 to-orange-100/50 border border-orange-200 shadow-lg hover:shadow-xl transition-all">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-orange-200/30 to-transparent rounded-bl-full"></div>
              <div className="relative p-6">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-orange-600 rounded-lg">
                    <MessageSquare className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 ml-3">Tone & Style</h3>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">{userData.analysis.tone}</p>
              </div>
            </div>

            {/* Enhanced Random Facts */}
            {userData.analysis.randomFacts && userData.analysis.randomFacts.length > 0 && (
              <div className="lg:col-span-2 relative overflow-hidden rounded-xl bg-gradient-to-br from-yellow-50 to-yellow-100/50 border border-yellow-200 shadow-lg hover:shadow-xl transition-all">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-200/30 to-transparent rounded-bl-full"></div>
                <div className="relative p-6">
                  <div className="flex items-center mb-6">
                    <div className="p-2 bg-yellow-600 rounded-lg">
                      <Lightbulb className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 ml-3">Random Facts</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {userData.analysis.randomFacts.slice(0, 10).map((fact, index) => (
                      <div
                        key={index}
                        className="bg-white/70 backdrop-blur-sm p-4 rounded-lg border border-yellow-300/50 hover:bg-white hover:shadow-md transition-all"
                      >
                        <div className="flex items-start">
                          <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-white text-xs font-bold mr-3 mt-0.5 flex-shrink-0">
                            {index + 1}
                          </div>
                          <span className="text-sm text-gray-700 leading-relaxed">{fact}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100/50 border border-gray-200 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5"></div>
          <div className="relative text-center py-16 px-8">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center">
              <Brain className="h-10 w-10 text-gray-500" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">No Analysis Available</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
              Analyze this user's posts to unlock insights and generate personalized content ideas.
            </p>
            <button
              onClick={handleAnalyze}
              disabled={analyzing || userData.posts.length === 0}
              className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 transition-all transform hover:scale-105 shadow-lg disabled:transform-none"
            >
              {analyzing ? <RefreshCw className="w-5 h-5 mr-2 animate-spin" /> : <Brain className="w-5 h-5 mr-2" />}
              Start Analysis
            </button>
          </div>
        </div>
      )}

      {/* Enhanced Post Generation */}
      {userData.analysis && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100/50 border border-indigo-200 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/5 to-purple-600/5"></div>
          <div className="relative p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl shadow-lg">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <h3 className="text-2xl font-semibold text-gray-900">Generate Post Ideas</h3>
                  <p className="text-gray-600 mt-1">Create personalized content based on your analysis</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <select
                  value={postCount}
                  onChange={e => setPostCount(Number(e.target.value))}
                  className="px-4 py-2 bg-white/80 backdrop-blur-sm border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                >
                  <option value={5}>5 posts</option>
                  <option value={10}>10 posts</option>
                  <option value={15}>15 posts</option>
                  <option value={20}>20 posts</option>
                </select>
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="inline-flex items-center px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 transition-all transform hover:scale-105 shadow-lg disabled:transform-none"
                >
                  {generating ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Lightbulb className="w-4 h-4 mr-2" />
                  )}
                  Generate
                </button>
              </div>
            </div>

            {postIdeas.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center mb-4">
                  <Sparkles className="w-5 h-5 text-indigo-600 mr-2" />
                  <span className="text-lg font-medium text-gray-900">Generated Ideas ({postIdeas.length})</span>
                </div>
                {postIdeas.map((idea, index) => (
                  <PostIdeaCard key={index} idea={idea} index={index + 1} onCopy={() => handleCopyPost(idea.text)} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
