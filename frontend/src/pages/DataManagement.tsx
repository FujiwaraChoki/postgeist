import { useState, useEffect } from "react";
import { Database, Download, HardDrive, Users, Calendar, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import apiService from "../lib/api";
import { DataStats } from "../types";
import { formatDate } from "../lib/utils";
import LoadingSpinner from "../components/LoadingSpinner";

export default function DataManagement() {
  const [stats, setStats] = useState<DataStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [authStatus, setAuthStatus] = useState<{ authenticated: boolean; credentials: boolean } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, authData] = await Promise.all([apiService.getDataStats(), apiService.getAuthStatus()]);
      setStats(statsData);
      setAuthStatus(authData);
    } catch (error) {
      toast.error(`Failed to load data: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExportAllData = async () => {
    try {
      // This would need to be implemented in the API to export all users' data
      toast("Export all data feature coming soon!");
    } catch (error) {
      toast.error(`Export failed: ${error}`);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading data statistics..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Data Management</h1>
        <p className="mt-2 text-gray-600">Monitor your data usage, storage, and system status</p>
      </div>

      {/* Authentication Status */}
      <div className="card">
        <div className="flex items-center mb-4">
          <AlertTriangle className={`h-5 w-5 mr-2 ${authStatus?.credentials ? "text-green-600" : "text-red-600"}`} />
          <h3 className="text-lg font-medium text-gray-900">Authentication Status</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            className={`p-4 rounded-lg ${authStatus?.credentials ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}
          >
            <div className="flex items-center">
              <div
                className={`w-3 h-3 rounded-full mr-3 ${authStatus?.credentials ? "bg-green-500" : "bg-red-500"}`}
              ></div>
              <div>
                <h4 className={`font-medium ${authStatus?.credentials ? "text-green-900" : "text-red-900"}`}>
                  Twitter Credentials
                </h4>
                <p className={`text-sm ${authStatus?.credentials ? "text-green-700" : "text-red-700"}`}>
                  {authStatus?.credentials ? "Configured" : "Missing or Invalid"}
                </p>
              </div>
            </div>
          </div>

          <div
            className={`p-4 rounded-lg ${authStatus?.authenticated ? "bg-green-50 border border-green-200" : "bg-yellow-50 border border-yellow-200"}`}
          >
            <div className="flex items-center">
              <div
                className={`w-3 h-3 rounded-full mr-3 ${authStatus?.authenticated ? "bg-green-500" : "bg-yellow-500"}`}
              ></div>
              <div>
                <h4 className={`font-medium ${authStatus?.authenticated ? "text-green-900" : "text-yellow-900"}`}>
                  Twitter Session
                </h4>
                <p className={`text-sm ${authStatus?.authenticated ? "text-green-700" : "text-yellow-700"}`}>
                  {authStatus?.authenticated ? "Active" : "Not Authenticated"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {!authStatus?.credentials && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="font-medium text-red-900 mb-2">Setup Required</h4>
            <p className="text-sm text-red-700 mb-3">
              Twitter credentials are required to scrape posts. Please set the following environment variables:
            </p>
            <ul className="text-sm text-red-700 space-y-1 font-mono">
              <li>• TWITTER_USERNAME</li>
              <li>• TWITTER_PASSWORD</li>
              <li>• TWITTER_EMAIL (optional)</li>
            </ul>
          </div>
        )}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats?.totalUsers || 0}</div>
          <div className="text-sm text-gray-500">Total Users</div>
        </div>

        <div className="card text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <HardDrive className="h-6 w-6 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats?.totalDataSize || "0 B"}</div>
          <div className="text-sm text-gray-500">Data Size</div>
        </div>

        <div className="card text-center">
          <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
            <Calendar className="h-6 w-6 text-purple-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {stats?.lastUpdated ? formatDate(stats.lastUpdated) : "Never"}
          </div>
          <div className="text-sm text-gray-500">Last Updated</div>
        </div>
      </div>

      {/* Data Actions */}
      <div className="card">
        <div className="flex items-center mb-4">
          <Database className="h-5 w-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Data Actions</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Export All Data</h4>
              <p className="text-sm text-gray-600">Download a complete backup of all user data and analyses</p>
            </div>
            <button onClick={handleExportAllData} className="btn-primary px-4 py-2">
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Data Directory</h4>
              <p className="text-sm text-gray-600">All data is stored locally in the Postgeist data directory</p>
            </div>
            <code className="px-3 py-1 bg-gray-200 rounded text-sm">~/.postgeist/</code>
          </div>
        </div>
      </div>

      {/* System Information */}
      <div className="card">
        <div className="flex items-center mb-4">
          <HardDrive className="h-5 w-5 text-gray-600 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">System Information</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-900">API Status:</span>
            <span className="ml-2 text-green-600">Active</span>
          </div>
          <div>
            <span className="font-medium text-gray-900">Version:</span>
            <span className="ml-2 text-gray-600">0.1.0</span>
          </div>
          <div>
            <span className="font-medium text-gray-900">Data Format:</span>
            <span className="ml-2 text-gray-600">JSON</span>
          </div>
          <div>
            <span className="font-medium text-gray-900">Backup:</span>
            <span className="ml-2 text-gray-600">Manual Export</span>
          </div>
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="card bg-blue-50 border-blue-200">
        <h3 className="text-lg font-medium text-blue-900 mb-2">🔒 Privacy & Data</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• All data is stored locally on your machine</li>
          <li>• No data is sent to external services except for AI analysis</li>
          <li>• Twitter credentials are used only for scraping posts</li>
          <li>• You can export or delete your data at any time</li>
          <li>• Analysis results are cached to minimize API calls</li>
        </ul>
      </div>
    </div>
  );
}
