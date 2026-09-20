// ====================================================================
// CAMPAIGN INTELLIGENCE & ELECTION MANAGEMENT SYSTEM (CI-EMS 2.6)
// Independent Clock Anomaly Tracker
// ====================================================================

export const CLOCK_THROTTLES_MS = {
  ACCEPTABLE_DRIFT: 60 * 1000, // 1 minute
  WARNING_DRIFT: 5 * 60 * 1000, // 5 minutes
  CRITICAL_DRIFT: 15 * 60 * 1000 // 15 minutes
};

export const CONFIDENCE_LEVELS = {
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
  UNTRUSTED: 'UNTRUSTED'
};

/**
  Evaluates device time against server time to detect time drift / tampering
 */
export const evaluateClockAnomaly = ({
  deviceTimeISO,
  serverReceivedTimeISO = new Date().toISOString(),
  trustedNtpTimeISO = null
}) => {
  const deviceMs = new Date(deviceTimeISO).getTime();
  const serverMs = new Date(serverReceivedTimeISO).getTime();
  const trustedMs = trustedNtpTimeISO ? new Date(trustedNtpTimeISO).getTime() : serverMs;

  if (isNaN(deviceMs)) {
    return {
      clockOffsetMs: null,
      confidence: CONFIDENCE_LEVELS.UNTRUSTED,
      isDriftDetected: true,
      anomalyLevel: 'CRITICAL',
      reason: 'Invalid device timestamp format'
    };
  }

  // Calculate clock offset (positive means device clock is ahead, negative means behind)
  const clockOffsetMs = deviceMs - trustedMs;
  const absOffsetMs = Math.abs(clockOffsetMs);

  let confidence = CONFIDENCE_LEVELS.HIGH;
  let anomalyLevel = 'NORMAL';
  let isDriftDetected = false;

  if (absOffsetMs > CLOCK_THROTTLES_MS.CRITICAL_DRIFT) {
    confidence = CONFIDENCE_LEVELS.UNTRUSTED;
    anomalyLevel = 'CRITICAL';
    isDriftDetected = true;
  } else if (absOffsetMs > CLOCK_THROTTLES_MS.WARNING_DRIFT) {
    confidence = CONFIDENCE_LEVELS.LOW;
    anomalyLevel = 'WARNING';
    isDriftDetected = true;
  } else if (absOffsetMs > CLOCK_THROTTLES_MS.ACCEPTABLE_DRIFT) {
    confidence = CONFIDENCE_LEVELS.MEDIUM;
    anomalyLevel = 'MINOR';
    isDriftDetected = true;
  }

  return {
    device_time: deviceTimeISO,
    server_received_time: serverReceivedTimeISO,
    trusted_server_time: new Date(trustedMs).toISOString(),
    clock_offset_ms: clockOffsetMs,
    clock_offset_seconds: Math.round(clockOffsetMs / 1000),
    timestamp_confidence: confidence,
    anomaly_level: anomalyLevel,
    is_drift_detected: isDriftDetected,
    evaluation_timestamp: new Date().toISOString()
  };
};
