"use client";

import type React from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  AlertCircle,
  Clock,
  Globe,
  HardDrive,
  Network,
  TrendingUp,
} from "lucide-react";
import Head from "next/head";
import { useState } from "react";

import { useMutation } from "@tanstack/react-query";

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

async function fetchAnalysis(url: string): Promise<AnalyzeResults> {
  return fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  }).then(async (res) => {
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Failed to analyze URL");
    }
    return res.json();
  });
}

export default function Home() {
  const [url, setUrl] = useState<string>("");
  const [error, setError] = useState<string>("");

  const {
    mutate,
    data,
    error: mutationError,
    isPending,
    isSuccess,
    reset,
  } = useMutation<AnalyzeResults, Error, string>({
    mutationFn: fetchAnalysis,
  });

  const analyzeUrl = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    reset(); // clear previous results/errors
    if (!url) {
      setError("URL is required");
      return;
    }
    mutate(url);
  };

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (
      Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
    );
  };

  const getPerformanceScore = (metric: string, value: number) => {
    switch (metric) {
      case "loadTime":
        if (value < 1000)
          return { label: "Excellent", variant: "default" as const };
        if (value < 3000)
          return { label: "Good", variant: "secondary" as const };
        return { label: "Needs Improvement", variant: "destructive" as const };
      case "pageSize":
        if (value < 1000000)
          return { label: "Excellent", variant: "default" as const };
        if (value < 3000000)
          return { label: "Good", variant: "secondary" as const };
        return { label: "Needs Improvement", variant: "destructive" as const };
      case "requests":
        if (value < 50)
          return { label: "Excellent", variant: "default" as const };
        if (value < 100)
          return { label: "Good", variant: "secondary" as const };
        return { label: "Needs Improvement", variant: "destructive" as const };
      default:
        return { label: "Unknown", variant: "outline" as const };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <Head>
        <title>URL Performance Analyzer</title>
        <meta
          name="description"
          content="Analyze webpage performance metrics"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="p-3 bg-primary/10 rounded-full mr-4">
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-400 bg-clip-text text-transparent">
              URL Performance Analyzer
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Analyze any webpage's performance metrics including load time, page
            size, and resource breakdown
          </p>
        </div>

        {/* Input Form */}
        <Card className="mb-8 shadow-lg border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Website Analysis
            </CardTitle>
            <CardDescription>
              Enter a URL to analyze its performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={analyzeUrl} className="space-y-4">
              <div className="flex gap-4">
                <Input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="flex-1"
                  required
                />
                <Button type="submit" disabled={isPending} className="px-8">
                  {isPending ? "Analyzing..." : "Analyze"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Error Display */}
        {mutationError && (
          <Alert variant="destructive" className="mb-8">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {mutationError instanceof Error
                ? mutationError.message
                : String(mutationError)}
            </AlertDescription>
          </Alert>
        )}

        {/* Results Display */}
        {data && (
          <div className="space-y-8">
            {/* Main Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-0 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-emerald-500/20 rounded-full">
                      <Clock className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                        Load Time
                      </p>
                      <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                        {data.loadTime}ms
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-blue-500/20 rounded-full">
                      <HardDrive className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                        Page Size
                      </p>
                      <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                        {formatSize(data.pageSize)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-purple-500/20 rounded-full">
                      <Network className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                        Requests
                      </p>
                      <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                        {data.requestCount}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Resource Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Resource Breakdown</CardTitle>
                  <CardDescription>
                    Detailed breakdown by resource type
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(data.resourceBreakdown).map(
                    ([type, data]) => (
                      <div
                        key={type}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      >
                        <span className="font-medium capitalize">{type}</span>
                        <div className="text-right">
                          <div className="font-semibold">
                            {data.count} requests
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatSize(data.size)}
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </CardContent>
              </Card>

              {/* Performance Scores */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance Scores</CardTitle>
                  <CardDescription>
                    Overall performance assessment
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Load Time</span>
                      <Badge
                        variant={
                          getPerformanceScore("loadTime", data.loadTime).variant
                        }
                      >
                        {getPerformanceScore("loadTime", data.loadTime).label}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Page Size</span>
                      <Badge
                        variant={
                          getPerformanceScore("pageSize", data.pageSize).variant
                        }
                      >
                        {getPerformanceScore("pageSize", data.pageSize).label}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Request Count</span>
                      <Badge
                        variant={
                          getPerformanceScore("requests", data.requestCount)
                            .variant
                        }
                      >
                        {
                          getPerformanceScore("requests", data.requestCount)
                            .label
                        }
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Analysis Info */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    <span className="font-medium">Analyzed URL:</span>
                    <span className="break-all">{data.url}</span>
                  </div>
                  <Separator
                    orientation="vertical"
                    className="hidden sm:block h-4"
                  />
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{new Date(data.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
