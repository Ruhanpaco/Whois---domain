declare module 'whois-json' {
  interface WhoisOptions {
    follow?: number;
    verbose?: boolean;
    server?: string;
    [key: string]: unknown;
  }

  interface WhoisResult {
    [key: string]: string | string[] | number | boolean | null | undefined;
  }

  function whois(domain: string, options?: WhoisOptions): Promise<WhoisResult>;
  export = whois;
} 