import { tool } from "ai";
import { z } from "zod";
import TurndownService from "turndown";

interface WebsiteData {
  title: string;
  description: string;
  content: string;
  headings: string[];
  links: string[];
  images: string[];
  metadata: {
    author?: string;
    keywords?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    twitterTitle?: string;
    twitterDescription?: string;
    canonical?: string;
  };
  status: number;
  contentType: string;
  error?: string;
}

export const websiteVisit = tool({
  description: "Visit a website and extract comprehensive content including title, description, headings, links, images, and metadata",
  parameters: z.object({
    url: z.string(),
    maxContentLength: z.number().optional().default(1000),
    timeout: z.number().optional().default(10000),
  }),
  execute: async ({ url, maxContentLength = 1000, timeout = 10000 }): Promise<WebsiteData> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; PostgeistBot/1.0; +https://github.com/FujiwaraChoki/postgeist)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
      });

      clearTimeout(timeoutId);

      const contentType = response.headers.get('content-type') || '';

      if (!response.ok) {
        return {
          title: '',
          description: '',
          content: '',
          headings: [],
          links: [],
          images: [],
          metadata: {},
          status: response.status,
          contentType,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      // Check if content is HTML
      if (!contentType.includes('text/html')) {
        return {
          title: '',
          description: '',
          content: `Non-HTML content (${contentType})`,
          headings: [],
          links: [],
          images: [],
          metadata: {},
          status: response.status,
          contentType,
          error: `Expected HTML content, got ${contentType}`,
        };
      }

      const html = await response.text();

      // Extract title
      const title = extractText(html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]) || 'No title';

      // Extract meta description
      const description = extractText(
        html.match(/<meta[^>]+name\s*=\s*["']description["'][^>]+content\s*=\s*["']([^"']+)["']/i)?.[1] ||
        html.match(/<meta[^>]+content\s*=\s*["']([^"']+)["'][^>]+name\s*=\s*["']description["']/i)?.[1]
      ) || '';

      // Extract headings using turndown
      const headings = extractHeadings(html);

      // Extract links using turndown
      const links = extractLinks(html, url);

      // Extract images
      const images = extractImages(html, url);

      // Extract metadata
      const metadata = extractMetadata(html);

      // Convert HTML to clean markdown content
      const markdownContent = extractContentAsMarkdown(html, maxContentLength);

      return {
        title,
        description,
        content: markdownContent,
        headings,
        links: links.slice(0, 20), // Limit to 20 links
        images: images.slice(0, 10), // Limit to 10 images
        metadata,
        status: response.status,
        contentType,
      };

    } catch (error) {
      clearTimeout(timeoutId);

      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = `Request timeout after ${timeout}ms`;
        } else {
          errorMessage = error.message;
        }
      }

      return {
        title: '',
        description: '',
        content: '',
        headings: [],
        links: [],
        images: [],
        metadata: {},
        status: 0,
        contentType: '',
        error: errorMessage,
      };
    }
  },
});

function extractText(text?: string): string {
  if (!text) return '';
  return text.replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

function extractContentAsMarkdown(html: string, maxLength: number): string {
  try {
    // Create a clean version of HTML for content extraction
    let cleanHtml = html
      // Remove script and style tags completely
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')
      // Remove navigation, header, footer, and sidebar elements
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '');

    // Try to extract main content areas first
    const mainContentRegex = /<(?:main|article|section|div[^>]*(?:class|id)[^>]*(?:content|main|article|post|entry)[^>]*)>([\s\S]*?)<\/(?:main|article|section|div)>/gi;
    const mainMatches = [...cleanHtml.matchAll(mainContentRegex)];

    if (mainMatches.length > 0) {
      // Use the main content areas
      cleanHtml = mainMatches.map(match => match[1]).join('\n\n');
    }

    // Convert to markdown using turndown
    let markdown = turndownService.turndown(cleanHtml);

    // Clean up the markdown
    markdown = markdown
      // Remove excessive whitespace
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      // Remove empty lines at the beginning and end
      .trim()
      // Remove excessive spaces
      .replace(/ +/g, ' ');

    // Truncate to max length while preserving markdown structure
    if (markdown.length > maxLength) {
      markdown = markdown.slice(0, maxLength);
      // Find the last complete line to avoid cutting off in the middle
      const lastNewline = markdown.lastIndexOf('\n');
      if (lastNewline > maxLength * 0.8) { // Only if we're not cutting too much
        markdown = markdown.slice(0, lastNewline);
      }
      markdown += '\n\n[Content truncated...]';
    }

    return markdown;
  } catch (error) {
    // Fallback to simple text extraction if turndown fails
    return extractMainContent(html, maxLength);
  }
}

function extractHeadings(html: string): string[] {
  const headings: string[] = [];
  const headingRegex = /<h[1-6][^>]*>([^<]+)<\/h[1-6]>/gi;
  let match;

  while ((match = headingRegex.exec(html)) !== null && headings.length < 15) {
    const heading = extractText(match[1]);
    if (heading && heading.length > 0 && heading.length < 200) {
      headings.push(heading);
    }
  }

  return headings;
}

function extractLinks(html: string, baseUrl: string): string[] {
  const links: string[] = [];
  const linkRegex = /<a[^>]+href\s*=\s*["']([^"']+)["'][^>]*>([^<]*)<\/a>/gi;
  let match;

  while ((match = linkRegex.exec(html)) !== null && links.length < 30) {
    let href = match[1];
    const linkText = extractText(match[2]);

    if (!href || href.startsWith('#') || href.startsWith('javascript:')) continue;

    // Convert relative URLs to absolute
    try {
      if (href.startsWith('/')) {
        const urlObj = new URL(baseUrl);
        href = `${urlObj.protocol}//${urlObj.host}${href}`;
      } else if (href.startsWith('./') || !href.includes('://')) {
        href = new URL(href, baseUrl).href;
      }

      if (href && href.startsWith('http') && linkText.trim() && linkText.length < 100) {
        links.push(`${linkText}: ${href}`);
      }
    } catch {
      // Skip malformed URLs
      continue;
    }
  }

  return links;
}

function extractImages(html: string, baseUrl: string): string[] {
  const images: string[] = [];
  const imgRegex = /<img[^>]+src\s*=\s*["']([^"']+)["'][^>]*(?:alt\s*=\s*["']([^"']*)["'])?[^>]*>/gi;
  let match;

  while ((match = imgRegex.exec(html)) !== null && images.length < 15) {
    let src = match[1];
    const alt = extractText(match[2]) || '';

    if (!src) continue;

    // Convert relative URLs to absolute
    try {
      if (src.startsWith('/')) {
        const urlObj = new URL(baseUrl);
        src = `${urlObj.protocol}//${urlObj.host}${src}`;
      } else if (src.startsWith('./') || (!src.includes('://') && !src.startsWith('data:'))) {
        src = new URL(src, baseUrl).href;
      }

      if (src && (src.startsWith('http') || src.startsWith('data:'))) {
        images.push(alt ? `${alt}: ${src}` : src);
      }
    } catch {
      // Skip malformed URLs
      continue;
    }
  }

  return images;
}

function extractMetadata(html: string): WebsiteData['metadata'] {
  const metadata: WebsiteData['metadata'] = {};

  // Extract various meta tags
  const metaPatterns = {
    author: /<meta[^>]+name\s*=\s*["']author["'][^>]+content\s*=\s*["']([^"']+)["']/i,
    keywords: /<meta[^>]+name\s*=\s*["']keywords["'][^>]+content\s*=\s*["']([^"']+)["']/i,
    ogTitle: /<meta[^>]+property\s*=\s*["']og:title["'][^>]+content\s*=\s*["']([^"']+)["']/i,
    ogDescription: /<meta[^>]+property\s*=\s*["']og:description["'][^>]+content\s*=\s*["']([^"']+)["']/i,
    ogImage: /<meta[^>]+property\s*=\s*["']og:image["'][^>]+content\s*=\s*["']([^"']+)["']/i,
    twitterTitle: /<meta[^>]+name\s*=\s*["']twitter:title["'][^>]+content\s*=\s*["']([^"']+)["']/i,
    twitterDescription: /<meta[^>]+name\s*=\s*["']twitter:description["'][^>]+content\s*=\s*["']([^"']+)["']/i,
    canonical: /<link[^>]+rel\s*=\s*["']canonical["'][^>]+href\s*=\s*["']([^"']+)["']/i,
  };

  for (const [key, pattern] of Object.entries(metaPatterns)) {
    const match = html.match(pattern);
    if (match?.[1]) {
      metadata[key as keyof typeof metadata] = extractText(match[1]);
    }
  }

  return metadata;
}

function extractMainContent(html: string, maxLength: number): string {
  // Fallback method for when turndown fails
  let content = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, ' ')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, ' ')
    .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, ' ');

  // Try to extract main content areas
  const mainContentRegex = /<(?:main|article|section|div[^>]*class[^>]*(?:content|main|article)[^>]*)>[\s\S]*?<\/(?:main|article|section|div)>/gi;
  const mainMatches = content.match(mainContentRegex);

  if (mainMatches && mainMatches.length > 0) {
    content = mainMatches.join(' ');
  }

  // Remove all HTML tags
  content = content.replace(/<[^>]*>/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Truncate to max length
  if (content.length > maxLength) {
    content = content.slice(0, maxLength) + '...';
  }

  return content;
}
