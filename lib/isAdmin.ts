/**
 * Checks if a given email is present in the ADMIN_EMAILS environment variable allow-list.
 */
export function isAdminEmail(email?: string | null): boolean {
  if (!email || typeof email !== 'string') return false;

  const adminEmailsRaw = process.env.ADMIN_EMAILS || '';
  if (!adminEmailsRaw.trim()) return false;

  const adminEmails = adminEmailsRaw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  return adminEmails.includes(email.trim().toLowerCase());
}
