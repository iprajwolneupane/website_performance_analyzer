import puppeteer from "puppeteer";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Validate URL
    try {
      new URL(url);
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });

      const page = await browser.newPage();

      type ResourceType =
        | "document"
        | "stylesheet"
        | "script"
        | "image"
        | "font"
        | "other";
      interface RequestInfo {
        url: string;
        method: string;
        status: number;
        size: number;
        resourceType: string;
      }
      const requests: RequestInfo[] = [];
      const resourceBreakdown: Record<
        ResourceType,
        { count: number; size: number }
      > = {
        document: { count: 0, size: 0 },
        stylesheet: { count: 0, size: 0 },
        script: { count: 0, size: 0 },
        image: { count: 0, size: 0 },
        font: { count: 0, size: 0 },
        other: { count: 0, size: 0 },
      };

      page.on("response", async (response) => {
        try {
          const request = response.request();
          const contentLength = response.headers()["content-length"];
          const size = contentLength ? parseInt(contentLength) : 0;

          const resourceType = request.resourceType() as ResourceType;
          requests.push({
            url: request.url(),
            method: request.method(),
            status: response.status(),
            size: size,
            resourceType: resourceType,
          });

          if (resourceBreakdown[resourceType]) {
            resourceBreakdown[resourceType].count++;
            resourceBreakdown[resourceType].size += size;
          } else {
            resourceBreakdown.other.count++;
            resourceBreakdown.other.size += size;
          }
        } catch (error) {
          console.error("Error processing response:", error);
        }
      });

      const startTime = Date.now();
      await page.goto(url, {
        waitUntil: "networkidle2",
        timeout: 30000,
      });
      const endTime = Date.now();
      const loadTime = endTime - startTime;

      const totalSize = requests.reduce(
        (sum, request) => sum + request.size,
        0
      );

      const results = {
        url: url,
        loadTime: loadTime,
        pageSize: totalSize,
        requestCount: requests.length,
        resourceBreakdown: resourceBreakdown,
        timestamp: new Date().toISOString(),
      };

      await browser.close();
      return NextResponse.json(results, { status: 200 });
    } catch (error) {
      if (browser) {
        await browser.close();
      }
      console.error("Error analyzing URL:", error);
      return NextResponse.json(
        {
          error:
            "Failed to analyze URL. Please check if the URL is accessible and try again.",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
