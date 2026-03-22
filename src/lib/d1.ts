const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID!;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN!;
const DB_ID = process.env.D1_DATABASE_ID!;

interface D1Result<T = Record<string, unknown>> {
  results: T[];
  success: boolean;
  meta: {
    changes: number;
    last_row_id: number;
    rows_read: number;
    rows_written: number;
  };
}

interface D1Response<T = Record<string, unknown>> {
  result: D1Result<T>[];
  success: boolean;
  errors: { message: string }[];
}

export async function queryD1<T = Record<string, unknown>>(
  sql: string,
  params?: unknown[]
): Promise<T[]> {
  const body: { sql: string; params?: unknown[] } = { sql };
  if (params && params.length > 0) {
    body.params = params;
  }

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DB_ID}/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`D1 API error: ${res.status} ${text}`);
  }

  const data: D1Response<T> = await res.json();

  if (!data.success) {
    throw new Error(`D1 query error: ${data.errors.map(e => e.message).join(', ')}`);
  }

  return data.result[0]?.results ?? [];
}

export async function executeD1(
  sql: string,
  params?: unknown[]
): Promise<{ changes: number; last_row_id: number }> {
  const body: { sql: string; params?: unknown[] } = { sql };
  if (params && params.length > 0) {
    body.params = params;
  }

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DB_ID}/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`D1 API error: ${res.status} ${text}`);
  }

  const data: D1Response = await res.json();

  if (!data.success) {
    throw new Error(`D1 execute error: ${data.errors.map(e => e.message).join(', ')}`);
  }

  return {
    changes: data.result[0]?.meta?.changes ?? 0,
    last_row_id: data.result[0]?.meta?.last_row_id ?? 0,
  };
}
