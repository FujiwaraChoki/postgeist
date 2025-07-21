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
  Clock
} from "lucide-react";
import toast from "react-hot-toast";
import apiService from "../lib/api";
import { UserData, PostIdea } from "../types";
import { formatDate, copyToClipboard, getCharacterCount } from "../lib/utils";
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
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">User not found</h2>
        <p className="mt-2 text-gray-600">The user @{username} could not be found.</p>
        <Link to="/" className="mt-4 inline-block btn-primary px-4 py-2">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="bg-primary-100 p-3 rounded-full">
              <Users className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-4">
              <h1 className="text-2xl font-bold text-gray-900">@{userData.username}</h1>
              <p className="text-gray-600">
                {userData.posts.length} posts • Last updated {formatDate(userData.lastUpdated)}
              </p>
            </div>
          </div>
          <div className="flex space-x-3">
            <Link to={`/user/${username}/settings`} className="btn-secondary px-4 py-2">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Link>
            <button
              onClick={handleAnalyze}
              disabled={analyzing || userData.posts.length === 0}
              className="btn-primary px-4 py-2"
            >
              {analyzing ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Brain className="w-4 h-4 mr-2" />}
              {userData.analysis ? "Re-analyze" : "Analyze"}
            </button>
          </div>
        </div>
      </div>

      {/* Analysis Results */}
      {userData.analysis ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Summary */}
          <div className="card">
            <div className="flex items-center mb-4">
              <TrendingUp className="h-5 w-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Summary</h3>
            </div>
            <p className="text-gray-700">{userData.analysis.summary}</p>
          </div>

          {/* Key Themes */}
          <div className="card">
            <div className="flex items-center mb-4">
              <Hash className="h-5 w-5 text-green-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Key Themes</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {userData.analysis.key_themes.map((theme, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                >
                  {theme}
                </span>
              ))}
            </div>
          </div>

          {/* Engagement Patterns */}
          <div className="card">
            <div className="flex items-center mb-4">
              <Target className="h-5 w-5 text-purple-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Engagement Patterns</h3>
            </div>
            <ul className="space-y-2">
              {userData.analysis.engagement_patterns.map((pattern, index) => (
                <li key={index} className="text-gray-700 text-sm">
                  • {pattern}
                </li>
              ))}
            </ul>
          </div>

          {/* Tone Analysis */}
          <div className="card">
            <div className="flex items-center mb-4">
              <MessageSquare className="h-5 w-5 text-orange-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Tone & Style</h3>
            </div>
            <p className="text-gray-700 text-sm">{userData.analysis.tone}</p>
          </div>

          {/* Random Facts */}
          {userData.analysis.randomFacts && userData.analysis.randomFacts.length > 0 && (
            <div className="card lg:col-span-2">
              <div className="flex items-center mb-4">
                <Lightbulb className="h-5 w-5 text-yellow-600 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">Random Facts</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {userData.analysis.randomFacts.slice(0, 10).map((fact, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded text-sm text-gray-700">
                    {fact}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="card text-center py-12">
          <Brain className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No Analysis Available</h3>
          <p className="mt-1 text-sm text-gray-500">
            Analyze this user's posts to see insights and generate content ideas.
          </p>
          <div className="mt-6">
            <button
              onClick={handleAnalyze}
              disabled={analyzing || userData.posts.length === 0}
              className="btn-primary px-4 py-2"
            >
              {analyzing ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Brain className="w-4 h-4 mr-2" />}
              Start Analysis
            </button>
          </div>
        </div>
      )}

      {/* Post Generation */}
      {userData.analysis && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <MessageSquare className="h-5 w-5 text-primary-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Generate Post Ideas</h3>
            </div>
            <div className="flex items-center space-x-3">
              <select
                value={postCount}
                onChange={e => setPostCount(Number(e.target.value))}
                className="input py-1 text-sm"
              >
                <option value={5}>5 posts</option>
                <option value={10}>10 posts</option>
                <option value={15}>15 posts</option>
                <option value={20}>20 posts</option>
              </select>
              <button onClick={handleGenerate} disabled={generating} className="btn-primary px-4 py-2">
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
              {postIdeas.map((idea, index) => (
                <PostIdeaCard key={index} idea={idea} index={index + 1} onCopy={() => handleCopyPost(idea.text)} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
