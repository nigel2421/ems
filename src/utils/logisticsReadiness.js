// ====================================================================
// CAMPAIGN INTELLIGENCE & ELECTION MANAGEMENT SYSTEM (CI-EMS 2.3)
// Logistics Readiness & D-Day Deadline Operations Engine
// ====================================================================

export const READINESS_DEADLINES = {
  D_90: { phase: 'D-90', label: 'Team Formation & Boundary Lock', targetPct: 40 },
  D_60: { phase: 'D-60', label: 'Agent Identification & Recruitment', targetPct: 60 },
  D_30: { phase: 'D-30', label: 'Agent Verification & Background Audits', targetPct: 75 },
  D_21: { phase: 'D-21', label: 'Field Agent Training & Simulation', targetPct: 85 },
  D_14: { phase: 'D-14', label: 'Polling Station Stream Assignment', targetPct: 90 },
  D_7: { phase: 'D-7', label: 'Deployment Confirmation & Logistics Lock', targetPct: 95 },
  D_3: { phase: 'D-3', label: 'Equipment & Power Kit Dispatch Verification', targetPct: 98 },
  D_1: { phase: 'D-1', label: 'Final Station Readiness & Check-In Test', targetPct: 100 },
  ELECTION_DAY: { phase: 'Election Day', label: 'Mission Activation & Operational Execution', targetPct: 100 }
};

export const READINESS_CATEGORIES = {
  AGENTS: 'AGENTS',
  EQUIPMENT: 'EQUIPMENT',
  DEPLOYMENT: 'DEPLOYMENT',
  COMMUNICATION: 'COMMUNICATION',
  TRAINING: 'TRAINING',
  POWER: 'POWER'
};

/**
  Calculates overall and category-level logistics readiness scores
 */
export const calculateReadinessScore = (metrics = {}) => {
  const categories = {
    agents: Number(metrics.agentsPct || 92),
    equipment: Number(metrics.equipmentPct || 88),
    deployment: Number(metrics.deploymentPct || 91),
    communication: Number(metrics.communicationPct || 96),
    training: Number(metrics.trainingPct || 94),
    power: Number(metrics.powerPct || 87)
  };

  const overall = Math.round(
    Object.values(categories).reduce((sum, val) => sum + val, 0) / Object.keys(categories).length
  );

  return {
    overall,
    categories,
    status: overall >= 95 ? 'OPTIMAL' : overall >= 85 ? 'ON_TRACK' : 'AT_RISK',
    gapPct: 100 - overall
  };
};

/**
  Evaluates actual readiness against D-Day deadline milestones
 */
export const evaluateReadinessDeadlines = (currentPhaseKey = 'D_7', metrics = {}) => {
  const milestone = READINESS_DEADLINES[currentPhaseKey] || READINESS_DEADLINES.D_7;
  const readiness = calculateReadinessScore(metrics);
  const isTargetMet = readiness.overall >= milestone.targetPct;

  return {
    phase: milestone.phase,
    label: milestone.label,
    targetPct: milestone.targetPct,
    actualPct: readiness.overall,
    isTargetMet,
    gapPct: Math.max(0, milestone.targetPct - readiness.overall),
    statusMessage: isTargetMet
      ? `On track for ${milestone.phase} (${readiness.overall}% vs target ${milestone.targetPct}%)`
      : `TARGET MISSED: ${milestone.phase} shortfall of ${milestone.targetPct - readiness.overall}%`
  };
};

/**
  Generates regional/jurisdictional logistics readiness summaries
 */
export const getRegionalReadinessSummary = (jurisdictions = []) => {
  if (!jurisdictions.length) {
    return [
      { name: 'Nairobi County', overall: 94, agentsPct: 98, equipmentPct: 92, status: 'ON_TRACK' },
      { name: 'Mombasa County', overall: 91, agentsPct: 93, equipmentPct: 89, status: 'ON_TRACK' },
      { name: 'Kisumu County', overall: 86, agentsPct: 88, equipmentPct: 84, status: 'AT_RISK' },
      { name: 'Nakuru County', overall: 96, agentsPct: 99, equipmentPct: 94, status: 'OPTIMAL' }
    ];
  }

  return jurisdictions.map(j => {
    const score = calculateReadinessScore(j);
    return {
      name: j.name || 'Jurisdiction',
      overall: score.overall,
      agentsPct: score.categories.agents,
      equipmentPct: score.categories.equipment,
      status: score.status
    };
  });
};
