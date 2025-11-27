/**
 * Code template for HTTP Request action step
 * This is a string template used for code generation - keep as string export
 */
export default `export async function httpRequestStep(input: {
  endpoint: string;
  httpMethod: string;
  httpHeaders?: string;
  httpBody?: string;
}) {
  "use step";
  
  const headers = input.httpHeaders ? JSON.parse(input.httpHeaders) : {};
  const body = input.httpMethod !== "GET" && input.httpBody 
    ? input.httpBody 
    : undefined;
  
  const response = await fetch(input.endpoint, {
    method: input.httpMethod,
    headers,
    body,
  });
  
  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return await response.json();
  }
  return await response.text();
}`;
