/**
 * Executable step function for HTTP Request action
 */
import "server-only";

import { getErrorMessage } from "../utils";

type HttpRequestResult =
  | { success: true; data: unknown; status: number }
  | { success: false; error: string; status?: number };

export async function httpRequestStep(input: {
  endpoint: string;
  httpMethod: string;
  httpHeaders?: string;
  httpBody?: string;
}): Promise<HttpRequestResult> {
  "use step";

  try {
    if (!input.endpoint) {
      return {
        success: false,
        error: "HTTP request failed: URL is required",
      };
    }

    // Parse headers from JSON string
    let headers: Record<string, string> = {};
    if (input.httpHeaders) {
      try {
        headers = JSON.parse(input.httpHeaders);
      } catch {
        // If parsing fails, use empty headers
      }
    }

    // Parse body from JSON string
    let body: string | undefined;
    if (input.httpMethod !== "GET" && input.httpBody) {
      try {
        const parsedBody = JSON.parse(input.httpBody);
        if (Object.keys(parsedBody).length > 0) {
          body = JSON.stringify(parsedBody);
        }
      } catch {
        if (input.httpBody.trim() && input.httpBody.trim() !== "{}") {
          body = input.httpBody;
        }
      }
    }

    const response = await fetch(input.endpoint, {
      method: input.httpMethod,
      headers,
      body,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      return {
        success: false,
        error: `HTTP request failed with status ${response.status}: ${errorText}`,
        status: response.status,
      };
    }

    // Try to parse as JSON, fall back to text
    const contentType = response.headers.get("content-type");
    let data: unknown;
    if (contentType?.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    return { success: true, data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: `HTTP request failed: ${getErrorMessage(error)}`,
    };
  }
}
