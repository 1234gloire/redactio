export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Manus injects OAuth variables in its hosted runtime. Our VPS deployment uses
// the local login flow, so keep OAuth optional instead of breaking page render.
export const getLoginUrl = (returnPath?: string) => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;

  if (oauthPortalUrl && appId) {
    const redirectUri = `${window.location.origin}/api/oauth/callback`;
    const state = btoa(redirectUri);
    const url = new URL("/app-auth", oauthPortalUrl);
    url.searchParams.set("appId", appId);
    url.searchParams.set("redirectUri", redirectUri);
    url.searchParams.set("state", state);
    url.searchParams.set("type", "signIn");
    if (returnPath) {
      url.searchParams.set("returnPath", returnPath);
    }
    return url.toString();
  }

  const url = new URL("/login", window.location.origin);
  if (returnPath) {
    url.searchParams.set("returnPath", returnPath);
  }
  return `${url.pathname}${url.search}`;
};
