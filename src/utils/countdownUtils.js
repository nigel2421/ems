/**
 * Calculates exact remaining days, hours, minutes, seconds until a given target date.
 */
export function calculateTimeRemaining(targetInput) {
  const targetTime = new Date(targetInput).getTime();
  const nowTime = Date.now();
  const diff = targetTime - nowTime;

  if (isNaN(targetTime) || diff <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalMs: 0,
      isCompleted: true
    };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return {
    days,
    hours,
    minutes,
    seconds,
    totalMs: diff,
    isCompleted: false
  };
}

// Default Election Day Target: August 10th 2027 06:00:00 (Polling Stations Open)
export const DEFAULT_ELECTION_DATE = "2027-08-10T06:00:00";

// Key Campaign & Election Milestones
export const ELECTION_MILESTONES = [
  {
    id: 'm1',
    title: 'Voter Register Verification',
    date: '2027-05-15T00:00:00',
    description: 'Final audit & publication of voters register across all polling centers.'
  },
  {
    id: 'm2',
    title: 'Candidate Nominations & Clearance',
    date: '2027-06-10T00:00:00',
    description: 'Official clearance of Presidential, Gubernatorial, Senatorial & Parliamentary aspirants.'
  },
  {
    id: 'm3',
    title: 'Campaign Silence Period',
    date: '2027-08-08T06:00:00',
    description: 'Mandatory 48-hour cessation of public campaign rallies prior to voting.'
  },
  {
    id: 'm4',
    title: 'Election Day & Poll Opening',
    date: DEFAULT_ELECTION_DATE,
    description: 'Polling stations open nationwide at 06:00 AM. Live Form 34A transmission begins.'
  },
  {
    id: 'm5',
    title: 'Form 34B Declaration & Result Finalization',
    date: '2027-08-15T23:59:59',
    description: 'Constituency tallying completion & official presidential result announcement.'
  }
];
