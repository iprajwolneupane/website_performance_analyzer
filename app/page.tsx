"use client";
import { useState } from "react";
import Head from "next/head";

// Types for API response
interface ResourceBreakdownItem {
  count: number;
  size: number;
}

interface ResourceBreakdown {
  document: ResourceBreakdownItem;
  stylesheet: ResourceBreakdownItem;
  script: ResourceBreakdownItem;
  image: ResourceBreakdownItem;
  font: ResourceBreakdownItem;
  other: ResourceBreakdownItem;
  // Allow for any additional keys (for future-proofing)
  [key: string]: ResourceBreakdownItem;
}

interface AnalyzeResults {
  url: string;
  loadTime: number;
  pageSize: number;
  requestCount: number;
  resourceBreakdown: ResourceBreakdown;
  timestamp: string;
}

export default function Home() {
  const [url, setUrl] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [results, setResults] = useState<AnalyzeResults | null>(null);
  const [error, setError] = useState<string>("");

  const analyzeUrl = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    setError("");
    setResults(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze URL");
      }

      setResults(data as AnalyzeResults);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Head>
        <title>URL Performance Analyzer</title>
        <meta
          name="description"
          content="Analyze webpage performance metrics"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              URL Performance Analyzer
            </h1>
            <p className="text-lg text-gray-600">
              Analyze any webpage's load time, page size, and request count
            </p>
          </div>

          {/* Input Form */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <form onSubmit={analyzeUrl} className="space-y-4">
              <div>
                <label
                  htmlFor="url"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Website URL
                </label>
                <input
                  type="url"
                  id="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Analyzing..." : "Analyze Performance"}
              </button>
            </form>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
              <div className="flex">
                <div className="text-red-600">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Results Display */}
          {results && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Analysis Results
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Load Time */}
                <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
                  <div className="flex items-center">
                    <svg
                      className="w-8 h-8 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div>
                      <p className="text-sm opacity-90">Load Time</p>
                      <p className="text-2xl font-bold">{results.loadTime}ms</p>
                    </div>
                  </div>
                </div>

                {/* Page Size */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                  <div className="flex items-center">
                    <svg
                      className="w-8 h-8 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                    <div>
                      <p className="text-sm opacity-90">Page Size</p>
                      <p className="text-2xl font-bold">
                        {formatSize(results.pageSize)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Number of Requests */}
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
                  <div className="flex items-center">
                    <svg
                      className="w-8 h-8 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                      />
                    </svg>
                    <div>
                      <p className="text-sm opacity-90">Requests</p>
                      <p className="text-2xl font-bold">
                        {results.requestCount}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Breakdown */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Resource Breakdown
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-700 mb-2">
                      By Resource Type
                    </h4>
                    <div className="space-y-2">
                      {Object.entries(results.resourceBreakdown).map(
                        ([type, data]) => (
                          <div
                            key={type}
                            className="flex justify-between items-center"
                          >
                            <span className="text-sm text-gray-600 capitalize">
                              {type}
                            </span>
                            <span className="text-sm font-medium">
                              {data.count} ({formatSize(data.size)})
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-700 mb-2">
                      Performance Score
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          Load Time Score
                        </span>
                        <span
                          className={`text-sm font-medium ${
                            results.loadTime < 1000
                              ? "text-green-600"
                              : results.loadTime < 3000
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {results.loadTime < 1000
                            ? "Excellent"
                            : results.loadTime < 3000
                            ? "Good"
                            : "Needs Improvement"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          Size Score
                        </span>
                        <span
                          className={`text-sm font-medium ${
                            results.pageSize < 1000000
                              ? "text-green-600"
                              : results.pageSize < 3000000
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {results.pageSize < 1000000
                            ? "Excellent"
                            : results.pageSize < 3000000
                            ? "Good"
                            : "Needs Improvement"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          Requests Score
                        </span>
                        <span
                          className={`text-sm font-medium ${
                            results.requestCount < 50
                              ? "text-green-600"
                              : results.requestCount < 100
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {results.requestCount < 50
                            ? "Excellent"
                            : results.requestCount < 100
                            ? "Good"
                            : "Needs Improvement"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* URL Info */}
              <div className="border-t pt-6 mt-6">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Analyzed URL: {results.url}</span>
                  <span>
                    Analysis completed at:{" "}
                    {new Date(results.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
