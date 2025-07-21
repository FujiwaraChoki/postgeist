import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Save, Users, MessageSquare, Edit } from "lucide-react";
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
      content: "Always maintain a professional tone. Focus on educational content and actionable insights. Use minimal emojis (max 1 per post). Include questions to engage the audience. Keep posts under 250 characters."
    },
    {
      title: "Casual & Personal",
      content: "Write in a casual, friendly tone. Share personal experiences and behind-the-scenes moments. Use emojis naturally but don't overdo it. Be authentic and relatable. Mix serious content with light-hearted posts."
    },
    {
      title: "Technical & Detailed",
      content: "Focus on technical accuracy and detailed explanations. Include code snippets when relevant. Use technical terminology appropriately. Share learning resources and tools. Engage with the developer community."
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link
            to={`/user/${username}`}
            className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="mt-2 text-gray-600">Customize how content is generated for @{username}</p>
          </div>
        </div>
      </div>

      {/* Custom Instructions */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <MessageSquare className="h-5 w-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Custom Instructions</h3>
          </div>
          <button
            onClick={() => setShowExamples(!showExamples)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {showExamples ? "Hide Examples" : "Show Examples"}
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Provide specific instructions for how AI should generate content. These instructions will be considered when
          creating post ideas to better match your preferences.
        </p>

        {/* Examples Section */}
        {showExamples && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-3">Example Instructions</h4>
            <div className="space-y-3">
              {exampleInstructions.map((example, index) => (
                <div key={index} className="bg-white p-3 rounded border">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-gray-900 text-sm">{example.title}</h5>
                    <button
                      onClick={() => setCustomInstructions(example.content)}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Use This
                    </button>
                  </div>
                  <p className="text-xs text-gray-600">{example.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4">
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
              className="textarea min-h-32 pr-20"
              rows={8}
            />

            {/* Character Counter */}
            <div className="absolute bottom-3 right-3 text-xs text-gray-500">
              <span className={characterCount > recommendedLength ? "text-yellow-600" : "text-gray-500"}>
                {characterCount}
              </span>
              <span className="text-gray-400"> / {recommendedLength} recommended</span>
            </div>
          </div>

          {/* Status and Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {hasUnsavedChanges && (
                <div className="flex items-center text-sm text-yellow-600">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                  Unsaved changes
                </div>
              )}

              {saving && (
                <div className="flex items-center text-sm text-blue-600">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
                  Saving...
                </div>
              )}

              {!hasUnsavedChanges && !saving && customInstructions && (
                <div className="flex items-center text-sm text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Saved
                </div>
              )}

              {characterCount > recommendedLength && (
                <div className="text-xs text-yellow-600">Longer instructions may be less effective</div>
              )}
            </div>

            <div className="flex space-x-3">
              {customInstructions && (
                <button
                  onClick={() => {
                    setCustomInstructions("");
                    if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
                  }}
                  className="btn-secondary px-4 py-2"
                >
                  Clear
                </button>
              )}

              <button
                onClick={handleSaveInstructions}
                disabled={saving || !hasUnsavedChanges}
                className="btn-primary px-4 py-2"
              >
                {saving ? <Edit className="w-4 h-4 mr-2 animate-pulse" /> : <Save className="w-4 h-4 mr-2" />}
                Save Instructions
              </button>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2 text-sm">💡 Writing Effective Instructions</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Be specific about tone and style preferences</li>
            <li>• Mention any topics to emphasize or avoid</li>
            <li>• Include formatting preferences (emojis, length, etc.)</li>
            <li>• Specify engagement strategies (questions, calls-to-action)</li>
            <li>• Consider your target audience and platform</li>
            <li>• Keep instructions clear and actionable</li>
          </ul>
        </div>
      </div>

      {/* Communities */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Users className="h-5 w-5 text-green-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Communities</h3>
          </div>
          <button onClick={() => setShowAddCommunity(true)} className="btn-primary px-4 py-2">
            <Plus className="w-4 h-4 mr-2" />
            Add Community
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Define communities or topics that posts can be categorized into. The AI will consider these when generating
          content and assign appropriate community tags.
        </p>

        {/* Add Community Form */}
        {showAddCommunity && (
          <form onSubmit={handleAddCommunity} className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Community Name</label>
                <input
                  type="text"
                  value={newCommunity.name}
                  onChange={e => setNewCommunity(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Tech, Design, Personal"
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={newCommunity.description}
                  onChange={e => setNewCommunity(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of this community"
                  className="input"
                  required
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-4">
              <button
                type="button"
                onClick={() => {
                  setShowAddCommunity(false);
                  setNewCommunity({ name: "", description: "" });
                }}
                className="btn-secondary px-4 py-2"
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary px-4 py-2">
                Add Community
              </button>
            </div>
          </form>
        )}

        {/* Communities List */}
        {communities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Users className="mx-auto h-8 w-8 mb-2" />
            <p>No communities configured</p>
            <p className="text-sm">Add communities to categorize generated posts</p>
          </div>
        ) : (
          <div className="space-y-3">
            {communities.map((community, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">{community.name}</h4>
                  <p className="text-sm text-gray-600">{community.description}</p>
                </div>
                <button
                  onClick={() => handleDeleteCommunity(community.name)}
                  className="text-gray-400 hover:text-red-600 transition-colors"
                  title="Delete community"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="card bg-blue-50 border-blue-200">
        <h3 className="text-lg font-medium text-blue-900 mb-2">💡 Tips</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Custom instructions help the AI understand your specific preferences and style</li>
          <li>• Communities allow posts to be categorized for better organization</li>
          <li>• Changes take effect immediately for new post generation</li>
          <li>• Be specific in your instructions for better results</li>
        </ul>
      </div>
    </div>
  );
}
