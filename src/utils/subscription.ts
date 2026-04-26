export interface SubscriptionClient {
  starhome_expiration_date?: string | null;
  days_remaining: number;
}

export const getDaysRemaining = (client: SubscriptionClient): number => {
  if (client.starhome_expiration_date) {
    const expDate = new Date(client.starhome_expiration_date);
    const today = new Date();
    const diffMs = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }
  return client.days_remaining;
};

export const getExpirationStatus = (days: number): 'ok' | 'warning' | 'critical' => {
  if (days > 10) return 'ok';
  if (days > 3) return 'warning';
  return 'critical';
};

export const getStatusColor = (status: 'ok' | 'warning' | 'critical'): string => {
  switch (status) {
    case 'ok': return 'text-emerald-400';
    case 'warning': return 'text-yellow-400';
    case 'critical': return 'text-red-400';
  }
};
