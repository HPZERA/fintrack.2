// CAKTO checkout integration
// Set VITE_CAKTO_CHECKOUT_URL in .env with your product checkout link
// e.g. https://pay.cakto.com.br/seu-produto

import { setCheckoutNonce } from '@/utils/security';

export const CAKTO_CHECKOUT_URL = import.meta.env.VITE_CAKTO_CHECKOUT_URL as string | undefined;

export const CAKTO_PLAN_PRICE = 29.90;

// Query param CAKTO appends on successful payment redirect
export const CAKTO_SUCCESS_PARAM = 'cakto_payment';

interface CheckoutOptions {
  email?: string;
  name?: string;
}

/**
 * Opens the CAKTO checkout in a new tab.
 * Sets a cryptographic nonce in localStorage so the return callback
 * can verify the checkout was actually opened (prevents URL forgery).
 */
export function openCaktoCheckout(options: CheckoutOptions = {}): boolean {
  if (!CAKTO_CHECKOUT_URL) return false;

  // Must be called before opening checkout — proof that this flow was initiated
  setCheckoutNonce();

  const url = new URL(CAKTO_CHECKOUT_URL);

  // Return URL so CAKTO redirects back after payment
  const returnUrl = new URL(window.location.origin + '/subscriptions');
  returnUrl.searchParams.set(CAKTO_SUCCESS_PARAM, 'success');
  url.searchParams.set('redirect_url', returnUrl.toString());

  if (options.email) url.searchParams.set('email', options.email);
  if (options.name) url.searchParams.set('name', options.name);

  window.open(url.toString(), '_blank', 'noopener,noreferrer');
  return true;
}

/**
 * Checks if the current URL contains a CAKTO success callback param.
 */
export function hasCaktoSuccessParam(): boolean {
  const params = new URLSearchParams(window.location.search);
  return params.get(CAKTO_SUCCESS_PARAM) === 'success';
}

/**
 * Removes the CAKTO success param from the URL without page reload.
 */
export function clearCaktoSuccessParam(): void {
  const url = new URL(window.location.href);
  url.searchParams.delete(CAKTO_SUCCESS_PARAM);
  window.history.replaceState({}, '', url.toString());
}
