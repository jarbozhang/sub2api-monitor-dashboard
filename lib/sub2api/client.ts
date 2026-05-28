export type Sub2ApiClientConfig = {
  baseUrl: string;
  adminApiKey: string;
};

export class Sub2ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "Sub2ApiError";
    this.status = status;
    this.body = body;
  }
}

export class Sub2ApiClient {
  private readonly baseUrl: string;
  private readonly adminApiKey: string;

  constructor(config: Sub2ApiClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, "");
    this.adminApiKey = config.adminApiKey;
  }

  async get<T>(path: string, params: Record<string, string | number | undefined>) {
    const url = new URL(path, `${this.baseUrl}/`);
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }

    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
      headers: {
        accept: "application/json",
        "x-api-key": this.adminApiKey,
      },
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Sub2ApiError("Sub2API request failed", response.status, payload);
    }

    if (!isSuccessEnvelope<T>(payload)) {
      throw new Sub2ApiError("Unexpected Sub2API response", response.status, payload);
    }

    return payload.data;
  }
}

function isSuccessEnvelope<T>(payload: unknown): payload is { code: 0; data: T } {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "code" in payload &&
    (payload as { code: unknown }).code === 0 &&
    "data" in payload
  );
}
