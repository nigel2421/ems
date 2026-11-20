export const teamRequest = async (path = '', { method = 'GET', body, aspirantId, signal } = {}) => {
  const query = aspirantId ? `?aspirantId=${encodeURIComponent(aspirantId)}` : '';
  const response = await fetch(`/api/team${path}${query}`, {method,credentials:'include',headers:{'Content-Type':'application/json'},body:body ? JSON.stringify(body) : undefined,signal});
  const data = await response.json().catch(()=>({}));
  if (!response.ok) throw new Error(data.error || 'Unable to load your campaign workspace.');
  return data;
};
