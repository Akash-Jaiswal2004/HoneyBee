/**
 * Dynamic URL helper for Honey Chain verification.
 * Automatically adapts to the active protocol, host, and port of the current environment.
 */

const STORAGE_KEY = 'honeychain_wifi_host';

/**
 * Returns the saved network host/IP from localStorage or env variable (if any).
 */
export function getSavedNetworkHost(): string {
  if (typeof window === 'undefined') return '';
  return (
    localStorage.getItem(STORAGE_KEY) ||
    (import.meta.env.VITE_NETWORK_HOST as string) ||
    ''
  );
}

/**
 * Saves a custom network host (e.g., Wi-Fi IP) into localStorage.
 */
export function setSavedNetworkHost(host: string): void {
  if (typeof window === 'undefined') return;
  const clean = host.trim();
  if (clean) {
    localStorage.setItem(STORAGE_KEY, clean);
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

/**
 * Auto-detect the LAN IP from the current browser environment.
 * When the site is accessed via a Wi-Fi / LAN IP (e.g. http://192.168.1.9:5173),
 * this returns that IP directly. When on localhost, returns empty string.
 */
export function getDetectedLanHost(): string {
  if (typeof window === 'undefined') return '';
  const hostname = window.location.hostname;
  // If already on a LAN IP, return it
  if (!isLocalhost() && hostname !== '') {
    return hostname;
  }
  return '';
}

/**
 * Returns the best available network host: saved > detected > fallback.
 */
export function getBestNetworkHost(): string {
  return getSavedNetworkHost() || getDetectedLanHost() || '';
}

/**
 * Constructs the verification URL for a batch.
 * - Always uses the current active port dynamically (e.g. 5173, 5175, etc.).
 * - If customHost is provided (e.g. Wi-Fi IP), formats it with the active port.
 * - If user is already accessing via a LAN IP or custom domain, uses window.location.origin directly.
 */
export function getBatchVerificationUrl(batchId: string, customHost?: string): string {
  if (typeof window === 'undefined') {
    return `/verify/${batchId}`;
  }

  const protocol = window.location.protocol;
  const currentPort = window.location.port;
  const portSuffix = currentPort ? `:${currentPort}` : '';

  if (customHost && customHost.trim()) {
    // Strip protocol and trailing slashes if user typed them
    const cleanHost = customHost.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    // If the host doesn't specify a port, attach the active environment port
    const targetHost = cleanHost.includes(':') ? cleanHost : `${cleanHost}${portSuffix}`;
    return `${protocol}//${targetHost}/verify/${batchId}`;
  }

  // Fallback: use current window origin (which dynamically includes current port)
  return `${window.location.origin}/verify/${batchId}`;
}

/**
 * Checks if current page is accessed via localhost or loopback IP.
 */
export function isLocalhost(): boolean {
  if (typeof window === 'undefined') return true;
  return (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '[::1]'
  );
}
