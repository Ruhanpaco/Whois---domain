import { NextResponse } from 'next/server';
import axios from 'axios';
import { updateDomainHistoryLookupCount } from '@/lib/statistics';

interface DomainHistoryEvent {
  action: string;
  date: string;
  description: string;
  registrar?: string;
}

interface DomainHistoryResponse {
  domain: string;
  events: DomainHistoryEvent[];
  activationCount: number;
  deactivationCount: number;
  transferCount: number;
  ownershipChanges: number;
  currentRegistrar?: string;
  registrant?: string;
  statuses?: string[];
  nameservers?: string[];
  usingFallback?: boolean;
  warning?: string | null;
}

interface RdapEvent {
  eventAction?: string;
  eventDate?: string;
  eventActor?: string;
}

interface RdapNameserver {
  ldhName?: string;
}

interface RdapEntity {
  roles?: string[];
  vcardArray?: unknown;
}

interface RdapResponse {
  events?: RdapEvent[];
  nameservers?: (RdapNameserver | string)[];
  entities?: RdapEntity[];
  registrarName?: string;
  registrar?: { name?: string };
  objectClassName?: string;
  status?: string[];
}

const fallbackHistory = (domain: string): DomainHistoryResponse => {
  const now = new Date();
  const oneYear = 365 * 24 * 60 * 60 * 1000;

  const events: DomainHistoryEvent[] = [
    {
      action: 'registration',
      date: new Date(now.getTime() - oneYear * 3).toISOString(),
      description: 'Initial domain registration recorded.',
    },
    {
      action: 'renewal',
      date: new Date(now.getTime() - oneYear * 2).toISOString(),
      description: 'Domain renewed to maintain active status.',
    },
    {
      action: 'update',
      date: new Date(now.getTime() - oneYear).toISOString(),
      description: 'Contact or nameserver information updated.',
    },
  ];

  return {
    domain,
    events,
    activationCount: 1,
    deactivationCount: 0,
    transferCount: 0,
    ownershipChanges: 0,
    currentRegistrar: 'Unavailable (using fallback data)',
    registrant: 'Unavailable (using fallback data)',
    statuses: ['active'],
    nameservers: [],
    usingFallback: true,
    warning: 'Primary RDAP lookup unavailable. Displaying fallback history.',
  };
};

const getRegistrantName = (entities: RdapEntity[] = []): string | undefined => {
  for (const entity of entities) {
    if (!entity.roles || !Array.isArray(entity.roles)) continue;
    if (entity.roles.includes('registrant')) {
      const vcardArray = entity.vcardArray;
      if (!Array.isArray(vcardArray) || vcardArray.length < 2) continue;

      const details = vcardArray[1];
      if (!Array.isArray(details)) continue;

      for (const item of details) {
        if (Array.isArray(item) && item[0] === 'fn' && item.length >= 4) {
          return typeof item[3] === 'string' ? item[3] : undefined;
        }
      }
    }
  }
  return undefined;
};

const describeEvent = (action: string): string => {
  const descriptions: Record<string, string> = {
    registration: 'Domain registered for the first time.',
    reregistration: 'Domain registration restored or re-established.',
    renewal: 'Domain registration renewed to keep it active.',
    expiration: 'Registration expired; the domain may have been inactive.',
    deletion: 'Domain deleted from the registry.',
    transfer: 'Ownership transferred to another registrar or registrant.',
    update: 'Domain information updated (contacts, nameservers, etc.).',
    reactivation: 'Domain reactivated after a period of inactivity.',
    deactivation: 'Domain deactivated and likely not resolving.',
  };

  return descriptions[action] || 'Domain lifecycle event recorded.';
};

const buildHistoryFromRdap = (domain: string, rdapData: RdapResponse, warning: string | null = null): DomainHistoryResponse => {
  const eventsRaw: RdapEvent[] = Array.isArray(rdapData?.events) ? rdapData.events : [];

  const events: DomainHistoryEvent[] = eventsRaw
    .filter((event: RdapEvent) => event?.eventDate)
    .map((event: RdapEvent) => ({
      action: event.eventAction || 'event',
      date: event.eventDate,
      description: describeEvent(event.eventAction),
      registrar: event?.eventActor,
    }))
    .sort((a: DomainHistoryEvent, b: DomainHistoryEvent) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const activationCount = events.filter(event => ['registration', 'reregistration', 'reactivation', 'restoration'].includes(event.action)).length;
  const deactivationCount = events.filter(event => ['deactivation', 'expiration', 'deletion'].includes(event.action)).length;
  const transferCount = events.filter(event => event.action === 'transfer').length;

  const nameservers = Array.isArray(rdapData?.nameservers)
    ? rdapData.nameservers.map((ns: RdapNameserver | string) => (typeof ns === 'string' ? ns : ns?.ldhName)).filter(Boolean)
    : [];

  const registrant = getRegistrantName(rdapData?.entities);
  const registrar = rdapData?.registrarName || rdapData?.registrar?.name || rdapData?.objectClassName;

  return {
    domain,
    events,
    activationCount,
    deactivationCount,
    transferCount,
    ownershipChanges: transferCount,
    currentRegistrar: registrar,
    registrant,
    statuses: rdapData?.status,
    nameservers,
    usingFallback: false,
    warning,
  };
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get('domain');

  if (!domain) {
    return NextResponse.json({ error: 'Domain parameter is required' }, { status: 400 });
  }

  try {
    let historyResponse: DomainHistoryResponse;
    let warning: string | null = null;

    try {
      const rdapLookup = await axios.get(`https://rdap.org/domain/${encodeURIComponent(domain)}`, {
        timeout: 8000,
        headers: {
          'User-Agent': 'Whois-Domain-History-Agent/1.0',
        },
      });

      historyResponse = buildHistoryFromRdap(domain, rdapLookup.data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Error fetching RDAP history for ${domain}:`, message);
      warning = 'Primary RDAP lookup failed. Using fallback history data.';
      historyResponse = fallbackHistory(domain);
      historyResponse.warning = warning;
    }

    await updateDomainHistoryLookupCount();

    return NextResponse.json(historyResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error building domain history for ${domain}:`, message);
    const fallback = fallbackHistory(domain);
    return NextResponse.json(fallback, { status: 200 });
  }
}
