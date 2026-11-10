import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// ====================================================================
// CI-EMS MULTILINGUAL LOCALIZATION DICTIONARIES (EN & SW)
// Bilingual English & Kiswahili interface tokens for election command
// ====================================================================

export const DICTIONARY = {
  en: {
    // Navigation & Headers
    'nav.dashboard': 'Overview Dashboard',
    'nav.operations': 'Operations Konsole',
    'nav.tallying': 'Presidential Tallying',
    'nav.verification': 'Document Verification',
    'nav.map_room': 'Electoral Map Room',
    'nav.agent_management': 'Field Agent Corps',
    'nav.logistics': 'Logistics & Supply',
    'nav.security': 'Security Command',
    'nav.user_directory': 'Personnel Directory',
    'nav.audit_logs': 'Cryptographic Audit Trail',
    'nav.system_health': 'System Health & Telemetry',
    'nav.readiness': 'Election Readiness',
    'nav.settings': 'System Settings',
    'nav.logout': 'Sign Out',
    'nav.admin_console': 'CI-EMS Admin Console',
    'nav.kenya_elections': 'Kenya General Election',

    // Dashboard Overview Metric Cards
    'metrics.registered_voters': 'Registered Voters',
    'metrics.registered_voters_desc': 'Audited IEBC Voter Register across 47 Counties',
    'metrics.polling_stations': 'Polling Stations',
    'metrics.polling_stations_desc': 'Operational stream hubs with GPS coordinates',
    'metrics.active_accounts': 'Active Personnel Accounts',
    'metrics.active_accounts_desc': 'Authorized Returning Officers, Agents & Analysts',
    'metrics.pending_tallies': 'Pending Tallies',
    'metrics.pending_tallies_desc': 'Awaiting cryptographic signature & Form 34A verification',

    // Actions & Controls
    'actions.refresh': 'Refresh Live Data',
    'actions.export': 'Export Report',
    'actions.filter': 'Filter Results',
    'actions.search': 'Search...',
    'actions.save': 'Save Changes',
    'actions.cancel': 'Cancel',
    'actions.submit': 'Submit',
    'actions.approve': 'Approve',
    'actions.reject': 'Reject',
    'actions.stay_active': 'Stay Active',
    'actions.log_in': 'Sign In',
    'actions.manage_users': 'Manage Accounts',
    'actions.view_all': 'View All',
    'actions.run_diagnostics': 'Run Live Diagnostics',

    // Statuses & Telemetry
    'status.healthy': 'System Healthy',
    'status.degraded': 'Degraded',
    'status.pending': 'Pending',
    'status.verified': 'Verified',
    'status.flagged': 'Flagged',
    'status.rejected': 'Rejected',
    'status.live': 'LIVE FEED',
    'status.offline': 'OFFLINE',
    'status.secure': 'SECURE SSL',
    'status.idle_warning': 'Session Expiring Soon',
    'status.idle_description': 'You have been inactive. For electoral security, you will be automatically logged out.',

    // Roles
    'role.national_returning_officer': 'National Returning Officer',
    'role.county_returning_officer': 'County Returning Officer',
    'role.constituency_returning_officer': 'Constituency Returning Officer',
    'role.presiding_officer': 'Presiding Officer',
    'role.polling_clerk': 'Polling Clerk',
    'role.security_admin': 'Security Admin',
    'role.super_admin': 'Super Administrator',
    'role.observer': 'Accredited Observer'
  },
  sw: {
    // Navigation & Headers
    'nav.dashboard': 'Dashibodi ya Jumla',
    'nav.operations': 'Kituo cha Operesheni',
    'nav.tallying': 'Uhesabuji wa Kura za Urais',
    'nav.verification': 'Uthibitishaji wa Fomu',
    'nav.map_room': 'Chumba cha Ramani ya Uchaguzi',
    'nav.agent_management': 'Usimamizi wa Maafisa',
    'nav.logistics': 'Usafirishaji na Vifaa',
    'nav.security': 'Usalama wa Mfumo',
    'nav.user_directory': 'Orodha ya Watumiaji',
    'nav.audit_logs': 'Kumbukumbu za Kiuchunguzi',
    'nav.system_health': 'Hali ya Mfumo na Mawasiliano',
    'nav.readiness': 'Utayari wa Uchaguzi',
    'nav.settings': 'Mipangilio ya Mfumo',
    'nav.logout': 'Toka Kwenye Mfumo',
    'nav.admin_console': 'Dashibodi ya Msimamizi Mkuu',
    'nav.kenya_elections': 'Uchaguzi Mkuu wa Kenya',

    // Dashboard Overview Metric Cards
    'metrics.registered_voters': 'Wapiga Kura Waliosajiliwa',
    'metrics.registered_voters_desc': 'Daftari rasmi la IEBC katika Kaunti zote 47',
    'metrics.polling_stations': 'Vituo vya Kupigia Kura',
    'metrics.polling_stations_desc': 'Vituo vya kura vyenye anwani kamili za GPS',
    'metrics.active_accounts': 'Akaunti za Maafisa Walioidhinishwa',
    'metrics.active_accounts_desc': 'Maafisa Wasimamizi, Mawakala na Wachambuzi',
    'metrics.pending_tallies': 'Kura Zinazosubiri Uthibitisho',
    'metrics.pending_tallies_desc': 'Zinasubiri sahihi ya kidijitali na Fomu 34A',

    // Actions & Controls
    'actions.refresh': 'Sasisha Data Moja kwa Moja',
    'actions.export': 'Pakua Ripoti',
    'actions.filter': 'Chuja Matokeo',
    'actions.search': 'Tafuta...',
    'actions.save': 'Hifadhi Mabadiliko',
    'actions.cancel': 'Ghairi',
    'actions.submit': 'Wasilisha',
    'actions.approve': 'Idhinisha',
    'actions.reject': 'Kataa',
    'actions.stay_active': 'Endelea Kwenye Mfumo',
    'actions.log_in': 'Ingia Kwenye Mfumo',
    'actions.manage_users': 'Simamia Akaunti',
    'actions.view_all': 'Tazama Zote',
    'actions.run_diagnostics': 'Kagua Hali ya Mfumo',

    // Statuses & Telemetry
    'status.healthy': 'Mfumo Uko Salama',
    'status.degraded': 'Kuna Hitilafu Ndogo',
    'status.pending': 'Inasubiri',
    'status.verified': 'Imethibitishwa',
    'status.flagged': 'Ina Maswali',
    'status.rejected': 'Imekataliwa',
    'status.live': 'MATANGAZO YA MOJA KWA MOJA',
    'status.offline': 'HAIPATIKANI',
    'status.secure': 'ULINZI MADHUBUTI SSL',
    'status.idle_warning': 'Muda Wako Unakaribia Kuisha',
    'status.idle_description': 'Umekuwa bila shughuli. Kwa usalama wa uchaguzi, utatolewa nje ya mfumo kiotomatiki.',

    // Roles
    'role.national_returning_officer': 'Msimamizi Mkuu wa Kitaifa wa Uchaguzi',
    'role.county_returning_officer': 'Msimamizi wa Uchaguzi wa Kaunti',
    'role.constituency_returning_officer': 'Msimamizi wa Uchaguzi wa Eneo Bunge',
    'role.presiding_officer': 'Afisa Msimamizi wa Kituo',
    'role.polling_clerk': 'Karani wa Kupiga Kura',
    'role.security_admin': 'Msimamizi wa Usalama',
    'role.super_admin': 'Msimamizi Mkuu',
    'role.observer': 'Mwangalizi Aliyeidhinishwa'
  }
};

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    try {
      return localStorage.getItem('ems_language') || 'en';
    } catch (e) {
      return 'en';
    }
  });

  const setLanguage = useCallback((lang) => {
    if (['en', 'sw'].includes(lang)) {
      setLanguageState(lang);
      try {
        localStorage.setItem('ems_language', lang);
      } catch (e) {
        // Storage fallback
      }
    }
  }, []);

  const t = useCallback((key, fallback) => {
    const dict = DICTIONARY[language] || DICTIONARY.en;
    if (dict && dict[key]) {
      return dict[key];
    }
    // Fallback to English dictionary if key missing in selected language
    if (DICTIONARY.en && DICTIONARY.en[key]) {
      return DICTIONARY.en[key];
    }
    return fallback !== undefined ? fallback : key;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, supportedLanguages: ['en', 'sw'] }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    // Provide a resilient fallback if component is rendered outside LanguageProvider
    return {
      language: 'en',
      setLanguage: () => {},
      t: (key, fallback) => fallback !== undefined ? fallback : (DICTIONARY.en[key] || key),
      supportedLanguages: ['en', 'sw']
    };
  }
  return context;
};

export default LanguageContext;
