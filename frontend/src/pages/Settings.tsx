import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Users,
  MessageSquare,
  Edit,
  Sparkles,
  BookOpen,
  Target,
  CheckCircle,
  AlertCircle,
  Lightbulb
} from "lucide-react";
import toast from "react-hot-toast";
import apiService from "../lib/api";
import type { Community } from "../types";
import LoadingSpinner from "../components/LoadingSpinner";

export default function Settings() {
  const { username } = useParams<{ username: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customInstructions, setCustomInstructions] = useState("");
  const [originalInstructions, setOriginalInstructions] = useState("");
  const [communities, setCommunities] = useState<Community[]>([]);
  const [showAddCommunity, setShowAddCommunity] = useState(false);
  const [newCommunity, setNewCommunity] = useState({ name: "", description: "" });
  const [showExamples, setShowExamples] = useState(false);
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (username) {
      loadSettings();
    }
  }, [username]);

  // Cleanup auto-save timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }
    };
  }, [autoSaveTimeout]);

  const loadSettings = async () => {
    if (!username) return;

    try {
      setLoading(true);
      const data = await apiService.getSettings(username);
      setCustomInstructions(data.customInstructions || "");
      setOriginalInstructions(data.customInstructions || "");
      setCommunities(data.availableCommunities || []);
    } catch (error) {
      toast.error(`Failed to load settings: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveInstructions = async () => {
    if (!username) return;

    try {
      setSaving(true);
      await apiService.updateInstructions(username, customInstructions);
      setOriginalInstructions(customInstructions);
      toast.success("Custom instructions updated successfully!");
    } catch (error) {
      toast.error(`Failed to update instructions: ${error}`);
    } finally {
      setSaving(false);
    }
  };

  const handleInstructionsChange = (value: string) => {
    setCustomInstructions(value);

    // Clear existing timeout
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }

    // Set new timeout for auto-save (3 seconds after user stops typing)
    const timeout = setTimeout(() => {
      if (value !== originalInstructions && value.trim() !== "") {
        handleSaveInstructions();
      }
    }, 3000);

    setAutoSaveTimeout(timeout);
  };

  const hasUnsavedChanges = customInstructions !== originalInstructions;
  const characterCount = customInstructions.length;
  const recommendedLength = 500;

  const exampleInstructions = [
    {
      title: "Professional & Educational",
      content: "Always maintain a professional tone. Focus on educational content and actionable insights. Use minimal emojis (max 1 per post). Include questions to engage the audience. Keep posts under 250 characters.",
      color: "from-blue-500 to-blue-600",
      bgColor: "from-blue-50 to-blue-100/50",
      borderColor: "border-blue-200"
    },
    {
      title: "Casual & Personal",
      content: "Write in a casual, friendly tone. Share personal experiences and behind-the-scenes moments. Use emojis naturally but don't overdo it. Be authentic and relatable. Mix serious content with light-hearted posts.",
      color: "from-green-500 to-green-600",
      bgColor: "from-green-50 to-green-100/50",
      borderColor: "border-green-200"
    },
    {
      title: "Technical & Detailed",
      content: "Focus on technical accuracy and detailed explanations. Include code snippets when relevant. Use technical terminology appropriately. Share learning resources and tools. Engage with the developer community.",
      color: "from-purple-500 to-purple-600",
      bgColor: "from-purple-50 to-purple-100/50",
      borderColor: "border-purple-200"
    }
  ];

  const handleAddCommunity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !newCommunity.name.trim() || !newCommunity.description.trim()) return;

    try {
      const result = await apiService.addCommunity(username, newCommunity);
      setCommunities(result.communities);
      setNewCommunity({ name: "", description: "" });
      setShowAddCommunity(false);
      toast.success("Community added successfully!");
    } catch (error) {
      toast.error(`Failed to add community: ${error}`);
    }
  };

  const handleDeleteCommunity = async (communityName: string) => {
    if (!username) return;

    if (!confirm(`Are you sure you want to delete the "${communityName}" community?`)) {
      return;
    }

    try {
      const result = await apiService.deleteCommunity(username, communityName);
      setCommunities(result.communities);
      toast.success("Community deleted successfully!");
    } catch (error) {
      toast.error(`Failed to delete community: ${error}`);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading settings..." />;
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Enhanced Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-50 via-white to-purple-50 border border-gray-200 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/5 to-purple-600/5"></div>
        <div className="relative p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link
                to={`/user/${username}`}
                className="mr-6 p-3 text-gray-600 hover:text-white hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-600 rounded-xl transition-all duration-300 transform hover:scale-110 shadow-lg hover:shadow-xl"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Settings
                </h1>
                <p className="mt-2 text-lg text-gray-600">
                  Customize how content is generated for <span className="font-semibold text-indigo-600">@{username}</span>
                </p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                <Target className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Custom Instructions */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200 shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-indigo-600/5"></div>
        <div className="relative p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg mr-4">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-gray-900">Custom Instructions</h3>
                <p className="text-gray-600 mt-1">Define your unique content style and preferences</p>
              </div>
            </div>
            <button
              onClick={() => setShowExamples(!showExamples)}
              className="inline-flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm text-blue-700 font-medium rounded-xl border border-blue-300/50 hover:bg-white hover:shadow-md transition-all"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              {showExamples ? "Hide Examples" : "Show Examples"}
            </button>
          </div>

          <p className="text-gray-600 mb-6 leading-relaxed">
            Provide specific instructions for how AI should generate content. These instructions will be considered when
            creating post ideas to better match your preferences and voice.
          </p>

          {/* Enhanced Examples Section */}
          {showExamples && (
            <div className="mb-8 relative overflow-hidden rounded-xl bg-gradient-to-br from-white to-gray-50 border border-gray-200 shadow-md">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <Lightbulb className="h-5 w-5 text-yellow-600 mr-2" />
                  <h4 className="font-semibold text-gray-900">Example Instructions</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {exampleInstructions.map((example, index) => (
                    <div
                      key={index}
                      className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${example.bgColor} border ${example.borderColor} shadow-sm hover:shadow-md transition-all group`}
                    >
                      <div className="p-5">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-semibold text-gray-900 text-sm">{example.title}</h5>
                          <button
                            onClick={() => setCustomInstructions(example.content)}
                            className={`px-3 py-1 bg-gradient-to-r ${example.color} text-white text-xs font-medium rounded-lg hover:shadow-md transition-all transform hover:scale-105`}
                          >
                            Use This
                          </button>
                        </div>
                        <p className="text-xs text-gray-700 leading-relaxed">{example.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-6">
            <div className="relative">
              <textarea
                value={customInstructions}
                onChange={e => handleInstructionsChange(e.target.value)}
                placeholder="Enter custom instructions for content generation...

Examples:
• Always maintain a professional tone
• Use minimal emojis (max 1 per post)
• Focus on educational content
• Include questions to engage audience
• Keep posts under 250 characters
• Share personal experiences when relevant"
                className="w-full min-h-40 p-4 bg-white/80 backdrop-blur-sm border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none pr-24"
                rows={8}
              />

              {/* Enhanced Character Counter */}
              <div className="absolute bottom-4 right-4">
                <div className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium border ${
                  characterCount > recommendedLength
                    ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                    : "bg-gray-50 text-gray-600 border-gray-200"
                }`}>
                  <span className="font-bold">{characterCount}</span>
                  <span className="text-gray-400 mx-1">/</span>
                  <span>{recommendedLength} recommended</span>
                </div>
              </div>
            </div>

            {/* Enhanced Status and Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                {hasUnsavedChanges && (
                  <div className="flex items-center text-sm text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Unsaved changes
                  </div>
                )}

                {saving && (
                  <div className="flex items-center text-sm text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-200">
                    <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-blue-300 border-t-blue-600"></div>
                    Saving...
                  </div>
                )}

                {!hasUnsavedChanges && !saving && customInstructions && (
                  <div className="flex items-center text-sm text-green-600 bg-green-50 px-3 py-1.5 rounded-full border border-green-200">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Saved
                  </div>
                )}

                {characterCount > recommendedLength && (
                  <div className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
                    Longer instructions may be less effective
                  </div>
                )}
              </div>

              <div className="flex space-x-3">
                {customInstructions && (
                  <button
                    onClick={() => {
                      setCustomInstructions("");
                      if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
                    }}
                    className="inline-flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm text-gray-700 font-medium rounded-xl border border-gray-200 hover:bg-white hover:shadow-md transition-all"
                  >
                    Clear
                  </button>
                )}

                <button
                  onClick={handleSaveInstructions}
                  disabled={saving || !hasUnsavedChanges}
                  className="inline-flex items-center px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 transition-all transform hover:scale-105 shadow-lg disabled:transform-none disabled:shadow-none"
                >
                  {saving ? (
                    <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Instructions
                </button>
              </div>
            </div>
          </div>

          {/* Enhanced Tips */}
          <div className="mt-8 relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-50 to-gray-100/50 border border-gray-200 shadow-sm">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-gray-600 rounded-lg mr-3">
                  <Lightbulb className="h-4 w-4 text-white" />
                </div>
                <h4 className="font-semibold text-gray-900">💡 Writing Effective Instructions</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  "Be specific about tone and style preferences",
                  "Mention any topics to emphasize or avoid",
                  "Include formatting preferences (emojis, length, etc.)",
                  "Specify engagement strategies (questions, calls-to-action)",
                  "Consider your target audience and platform",
                  "Keep instructions clear and actionable"
                ].map((tip, index) => (
                  <div key={index} className="flex items-start text-sm text-gray-600">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Communities */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-50 to-emerald-100/50 border border-green-200 shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-r from-green-600/5 to-emerald-600/5"></div>
        <div className="relative p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl shadow-lg mr-4">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-gray-900">Communities</h3>
                <p className="text-gray-600 mt-1">Organize your content into categories and topics</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddCommunity(true)}
              className="inline-flex items-center px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all transform hover:scale-105 shadow-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Community
            </button>
          </div>

          <p className="text-gray-600 mb-6 leading-relaxed">
            Define communities or topics that posts can be categorized into. The AI will consider these when generating
            content and assign appropriate community tags.
          </p>

          {/* Enhanced Add Community Form */}
          {showAddCommunity && (
            <form onSubmit={handleAddCommunity} className="mb-8 relative overflow-hidden rounded-xl bg-white/80 backdrop-blur-sm border border-green-300/50 shadow-md">
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Community Name</label>
                    <input
                      type="text"
                      value={newCommunity.name}
                      onChange={e => setNewCommunity(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Tech, Design, Personal"
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                    <input
                      type="text"
                      value={newCommunity.description}
                      onChange={e => setNewCommunity(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Brief description of this community"
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddCommunity(false);
                      setNewCommunity({ name: "", description: "" });
                    }}
                    className="inline-flex items-center px-4 py-2 bg-white text-gray-700 font-medium rounded-xl border border-gray-200 hover:bg-gray-50 hover:shadow-md transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all transform hover:scale-105 shadow-lg"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Community
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Enhanced Communities List */}
          {communities.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center">
                <Users className="h-8 w-8 text-gray-500" />
              </div>
              <p className="text-lg font-medium text-gray-900 mb-2">No communities configured</p>
              <p className="text-gray-600">Add communities to categorize generated posts</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {communities.map((community, index) => (
                <div
                  key={index}
                  className="group relative overflow-hidden rounded-xl bg-white/80 backdrop-blur-sm border border-green-200 shadow-sm hover:shadow-md transition-all hover:-translate-y-1"
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-2">{community.name}</h4>
                        <p className="text-sm text-gray-600 leading-relaxed">{community.description}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteCommunity(community.name)}
                        className="ml-3 p-2 text-gray-400 hover:text-white hover:bg-red-500 rounded-lg transition-all transform hover:scale-110"
                        title="Delete community"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Tips */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-100/50 border border-purple-200 shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-indigo-600/5"></div>
        <div className="relative p-8">
          <div className="flex items-center mb-6">
            <div className="p-3 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl shadow-lg mr-4">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900">💡 Tips</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              "Custom instructions help the AI understand your specific preferences and style",
              "Communities allow posts to be categorized for better organization",
              "Changes take effect immediately for new post generation",
              "Be specific in your instructions for better results"
            ].map((tip, index) => (
              <div key={index} className="flex items-start">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-4 flex-shrink-0"></div>
                <span className="text-gray-700 leading-relaxed">{tip}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
