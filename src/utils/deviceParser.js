// ====================================================================
// User Agent & Device Telemetry Utility
// Parses client User-Agent header into OS, Browser, & Device Type
// ====================================================================

export const parseUserAgent = (uaString = typeof navigator !== 'undefined' ? navigator.userAgent : '') => {
  const ua = uaString || '';

  // 1. Detect Operating System
  let os = 'Unknown OS';
  if (/windows nt 10/i.test(ua)) os = 'Windows 11/10';
  else if (/windows nt 6\.3/i.test(ua)) os = 'Windows 8.1';
  else if (/windows nt 6\.1/i.test(ua)) os = 'Windows 7';
  else if (/mac os x 10[._]\d+/i.test(ua)) os = 'macOS';
  else if (/iphone os \d+[._]\d+/i.test(ua)) os = 'iOS (iPhone)';
  else if (/ipad;/i.test(ua)) os = 'iPadOS';
  else if (/android \d+/i.test(ua)) os = 'Android OS';
  else if (/linux/i.test(ua)) os = 'Linux';

  // 2. Detect Browser Name & Major Version
  let browser = 'Unknown Browser';
  if (/edg\/(\d+)/i.test(ua)) {
    const match = ua.match(/edg\/(\d+\.\d+)/i);
    browser = `Microsoft Edge ${match ? match[1] : ''}`;
  } else if (/chrome\/(\d+)/i.test(ua) && !/edg\//i.test(ua)) {
    const match = ua.match(/chrome\/(\d+\.\d+)/i);
    browser = `Google Chrome ${match ? match[1] : ''}`;
  } else if (/safari\/(\d+)/i.test(ua) && !/chrome\//i.test(ua)) {
    const match = ua.match(/version\/(\d+\.\d+)/i);
    browser = `Apple Safari ${match ? match[1] : ''}`;
  } else if (/firefox\/(\d+)/i.test(ua)) {
    const match = ua.match(/firefox\/(\d+\.\d+)/i);
    browser = `Mozilla Firefox ${match ? match[1] : ''}`;
  }

  // 3. Detect Device Category
  let deviceType = 'Desktop';
  if (/mobi|iphone|android/i.test(ua)) {
    deviceType = 'Mobile';
  } else if (/ipad|tablet/i.test(ua)) {
    deviceType = 'Tablet';
  }

  return { browser, os, deviceType };
};

export const getDeviceTelemetry = () => {
  const uaMeta = parseUserAgent();

  // Simulated locations across Kenyan hubs & Regional HQs for testing
  const locations = [
    'Nairobi, Kenya',
    'Mombasa, Kenya',
    'Kisumu, Kenya',
    'Nakuru, Kenya',
    'Eldoret, Kenya',
    'Nyeri, Kenya'
  ];
  const selectedLocation = locations[Math.floor(Math.random() * locations.length)];

  // Generate plausible IP address
  const clientIP = `197.${Math.floor(Math.random() * 50) + 200}.${Math.floor(Math.random() * 254)}.${Math.floor(Math.random() * 254) + 1}`;

  return {
    ...uaMeta,
    ipAddress: clientIP,
    geoLocation: selectedLocation
  };
};

export const exportLoginLogsToCSV = (logs = []) => {
  if (!logs || logs.length === 0) return false;

  const headers = ['Log ID', 'Timestamp (ISO)', 'User Email', 'Role', 'Status', 'IP Address', 'Geo Location', 'Device Category', 'Operating System', 'Browser Version', 'Failure Reason'];
  
  const rows = logs.map(l => [
    `"${l.id || ''}"`,
    `"${l.timestamp || ''}"`,
    `"${l.email || ''}"`,
    `"${l.role || ''}"`,
    `"${l.status || ''}"`,
    `"${l.ipAddress || ''}"`,
    `"${l.geoLocation || ''}"`,
    `"${l.deviceType || ''}"`,
    `"${l.os || ''}"`,
    `"${l.browser || ''}"`,
    `"${l.failureReason || 'N/A'}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  
  if (typeof window !== 'undefined' && document) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `CI-EMS_Login_Audit_Logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return csvContent;
};
