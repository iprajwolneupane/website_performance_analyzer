import puppeteer from "puppeteer";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  // Validate URL
  try {
    new URL(url);
  } catch (error) {
    return res.status(400).json({ error: "Invalid URL format" });
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    // Track network requests
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
    const resourceBreakdown: Record<ResourceType, { count: number; size: number }> = {
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

        // Categorize resources
        if (resourceBreakdown[resourceType]) {
          resourceBreakdown[resourceType].count++;
          resourceBreakdown[resourceType].size += size;
        } else {
          resourceBreakdown.other.count++;
          resourceBreakdown.other.size += size;
        }
      } catch (error) {
        // Handle errors in response processing
        console.error("Error processing response:", error);
      }
    });

    // Measure load time
    const startTime = Date.now();
    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 30000,
    });
    const endTime = Date.now();
    const loadTime = endTime - startTime;

    // Calculate total page size
    const totalSize = requests.reduce((sum, request) => sum + request.size, 0);

    const results = {
      url: url,
      loadTime: loadTime,
      pageSize: totalSize,
      requestCount: requests.length,
      resourceBreakdown: resourceBreakdown,
      timestamp: new Date().toISOString(),
    };

    await browser.close();
    res.status(200).json(results);
  } catch (error) {
    if (browser) {
      await browser.close();
    }

    console.error("Error analyzing URL:", error);
    res.status(500).json({
      error:
        "Failed to analyze URL. Please check if the URL is accessible and try again.",
    });
  }
}
