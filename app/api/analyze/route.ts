import * as cheerio from 'cheerio';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Validate URL
    try {
      new URL(url);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    const startTime = Date.now();

    // Fetch the page content
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        Connection: 'keep-alive',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const endTime = Date.now();
    const loadTime = endTime - startTime;

    // Load HTML into Cheerio
    const $ = cheerio.load(html);

    // Calculate HTML size
    const htmlSize = Buffer.byteLength(html, 'utf8');

    // Analyze resources using Cheerio
    const resourceAnalysis = analyzeResourcesWithCheerio($, url);

    // Calculate total estimated page size
    const totalPageSize = htmlSize + resourceAnalysis.totalEstimatedSize;

    const results = {
      url: url,
      loadTime: loadTime,
      pageSize: totalPageSize,
      requestCount: resourceAnalysis.totalRequests,
      resourceBreakdown: resourceAnalysis.breakdown,
      htmlSize: htmlSize,
      title: $('title').text() || 'No title found',
      metaDescription:
        $('meta[name=\"description\"]').attr('content') || 'No description found',
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('Error analyzing URL:', error);
    return NextResponse.json(
      {
        error:
          'Failed to analyze URL. Please check if the URL is accessible and try again.',
      },
      { status: 500 }
    );
  }
}

// --- Helper functions (same as your original, but type-safe) ---

function analyzeResourcesWithCheerio(
  $: cheerio.CheerioAPI,
  baseUrl: string
): {
  breakdown: Record<
    'document' | 'stylesheet' | 'script' | 'image' | 'font' | 'other',
    { count: number; size: number }
  >;
  totalRequests: number;
  totalEstimatedSize: number;
} {
  const breakdown = {
    document: { count: 1, size: 0 },
    stylesheet: { count: 0, size: 0 },
    script: { count: 0, size: 0 },
    image: { count: 0, size: 0 },
    font: { count: 0, size: 0 },
    other: { count: 0, size: 0 },
  };

  let totalEstimatedSize = 0;

  // Analyze CSS files
  const cssLinks = $('link[rel=\"stylesheet\"], link[rel=\"preload\"][as=\"style\"]');
  cssLinks.each((i, elem) => {
    const href = $(elem).attr('href');
    if (href) {
      breakdown.stylesheet.count++;
      const estimatedSize = estimateCSSSize(href);
      breakdown.stylesheet.size += estimatedSize;
      totalEstimatedSize += estimatedSize;
    }
  });

  // Analyze inline styles
  const inlineStyles = $('style');
  inlineStyles.each((i, elem) => {
    const content = $(elem).html();
    if (content) {
      breakdown.stylesheet.count++;
      const size = Buffer.byteLength(content, 'utf8');
      breakdown.stylesheet.size += size;
      totalEstimatedSize += size;
    }
  });

  // Analyze JavaScript files
  const scriptTags = $('script[src]');
  scriptTags.each((i, elem) => {
    const src = $(elem).attr('src');
    if (src) {
      breakdown.script.count++;
      const estimatedSize = estimateJSSize(src);
      breakdown.script.size += estimatedSize;
      totalEstimatedSize += estimatedSize;
    }
  });

  // Analyze inline scripts
  const inlineScripts = $('script:not([src])');
  inlineScripts.each((i, elem) => {
    const content = $(elem).html();
    if (content && content.trim()) {
      breakdown.script.count++;
      const size = Buffer.byteLength(content, 'utf8');
      breakdown.script.size += size;
      totalEstimatedSize += size;
    }
  });

  // Analyze images
  const images = $('img, picture source, [style*=\"background-image\"]');
  images.each((i, elem) => {
    const src =
      $(elem).attr('src') ||
      $(elem).attr('srcset') ||
      extractBackgroundImage($(elem).attr('style'));
    if (src) {
      breakdown.image.count++;
      const estimatedSize = estimateImageSize(src);
      breakdown.image.size += estimatedSize;
      totalEstimatedSize += estimatedSize;
    }
  });

  // Analyze fonts
  const fontLinks = $('link[rel=\"preload\"][as=\"font\"], link[href*=\"font\"]');
  fontLinks.each((i, elem) => {
    const href = $(elem).attr('href');
    if (href) {
      breakdown.font.count++;
      const estimatedSize = estimateFontSize(href);
      breakdown.font.size += estimatedSize;
      totalEstimatedSize += estimatedSize;
    }
  });

  // Check for web font CSS (Google Fonts, etc.)
  const webFontCSS = $('link[href*=\"fonts.googleapis.com\"], link[href*=\"fonts.google.com\"], link[href*=\"typekit.net\"]');
  webFontCSS.each((i, elem) => {
    breakdown.font.count += 2; // Estimate 2 fonts per web font CSS
    const estimatedSize = 60000; // Estimate 60KB for web font family
    breakdown.font.size += estimatedSize;
    totalEstimatedSize += estimatedSize;
  });

  // Analyze other resources
  const otherResources = $('link[rel=\"icon\"], link[rel=\"manifest\"], embed, object, audio, video');
  otherResources.each((i, elem) => {
    const href = $(elem).attr('href') || $(elem).attr('src');
    if (href) {
      breakdown.other.count++;
      const estimatedSize = estimateOtherResourceSize(href);
      breakdown.other.size += estimatedSize;
      totalEstimatedSize += estimatedSize;
    }
  });

  const totalRequests = Object.values(breakdown).reduce(
    (sum, item) => sum + item.count,
    0
  );

  return {
    breakdown,
    totalRequests,
    totalEstimatedSize,
  };
}

function extractBackgroundImage(style?: string | null) {
  if (!style) return null;
  const match = style.match(/background-image:\\s*url\\(['\"]?([^'\"]+)['\"]?\\)/i);
  return match ? match[1] : null;
}

function estimateCSSSize(href: string) {
  if (href.includes('bootstrap') || href.includes('tailwind')) return 150000;
  if (href.includes('font-awesome') || href.includes('material-icons')) return 75000;
  if (href.includes('.min.css')) return 25000;
  return 40000;
}

function estimateJSSize(src: string) {
  if (src.includes('react') || src.includes('vue') || src.includes('angular')) return 200000;
  if (src.includes('jquery')) return 85000;
  if (src.includes('lodash') || src.includes('moment')) return 70000;
  if (src.includes('.min.js')) return 30000;
  return 50000;
}

function estimateImageSize(src: string) {
  const ext = src.split('.').pop()?.toLowerCase();
  if (ext === 'svg') return 5000;
  if (ext === 'png') return 80000;
  if (ext === 'jpg' || ext === 'jpeg') return 60000;
  if (ext === 'webp') return 40000;
  if (ext === 'gif') return 100000;
  return 75000;
}

function estimateFontSize(href: string) {
  const ext = href.split('.').pop()?.toLowerCase();
  if (ext === 'woff2') return 25000;
  if (ext === 'woff') return 35000;
  if (ext === 'ttf') return 60000;
  return 30000;
}

function estimateOtherResourceSize(href: string) {
  if (href.includes('favicon')) return 5000;
  if (href.includes('manifest')) return 2000;
  return 20000;
}
