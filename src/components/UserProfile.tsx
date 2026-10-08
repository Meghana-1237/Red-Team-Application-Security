import React, { useState } from 'react';
import { User, VulnerabilityConfig } from '../types';
import { storeService } from '../services/storeService';
import { ShieldAlert, ShieldCheck, User as UserIcon, CreditCard, MapPin, Mail, Phone, KeyRound, Terminal, AlertTriangle } from 'lucide-react';

interface UserProfileProps {
  currentUser: User | null;
  config: VulnerabilityConfig;
  onOpenAuth: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({
  currentUser,
  config,
  onOpenAuth
}) => {
  const [tamperedId, setTamperedId] = useState(currentUser?.id || 'usr-101');
  const [profileResult, setProfileResult] = useState<{
    user?: User;
    status: number;
    message: string;
    isIdorVulnerability: boolean;
  }>({
    user: currentUser || undefined,
    status: currentUser ? 200 : 401,
    message: currentUser ? 'Profile loaded' : 'Not authenticated',
    isIdorVulnerability: false
  });

  const handleFetchProfile = (targetId: string) => {
    setTamperedId(targetId);
    const res = storeService.getUserProfile(targetId, currentUser, config);
    setProfileResult(res);
  };

  if (!currentUser) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4 bg-slate-900 border border-slate-800 rounded-xl p-8">
        <UserIcon className="w-12 h-12 text-slate-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Authentication Required</h2>
        <p className="text-sm text-slate-400 max-w-sm mx-auto">
          Please sign in to view your profile and test Insecure Direct Object Reference (IDOR) access control.
        </p>
        <button
          onClick={onOpenAuth}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-lg transition-colors"
        >
          Sign In Now
        </button>
      </div>
    );
  }

  const displayedUser = profileResult.user || currentUser;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Customer Profile</h1>
          <p className="text-xs text-slate-400 mt-1">
            Authenticated Account & IDOR Access Control Verification Lab
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
            Session: {currentUser.sessionToken || 'SEC_SESSION_ACTIVE'}
          </span>
        </div>
      </div>

      {/* IDOR Exploit Testbed */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-rose-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              A01: Broken Access Control (IDOR Test Console)
            </h3>
          </div>
          <span className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
            config.a01_broken_access
              ? 'bg-rose-950/80 text-rose-300 border-rose-800'
              : 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
          }`}>
            {config.a01_broken_access ? 'Vulnerable to URL Tampering' : 'Protected (Role & Ownership Check)'}
          </span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Test horizontal privilege escalation by requesting different user IDs through the simulated endpoint query <code className="text-indigo-300 font-mono">GET /api/user/profile?id=...</code>
        </p>

        {/* Query tampering input */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono text-slate-500">/api/user/profile?id=</span>
          <input
            type="text"
            value={tamperedId}
            onChange={(e) => setTamperedId(e.target.value)}
            className="w-32 px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
          />
          <button
            onClick={() => handleFetchProfile(tamperedId)}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded transition-colors"
          >
            Execute Request
          </button>

          {/* Quick Target Presets */}
          <div className="flex items-center gap-1.5 ml-auto text-xs">
            <span className="text-slate-500 text-[11px]">Targets:</span>
            <button
              onClick={() => handleFetchProfile('usr-101')}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-mono text-[11px]"
            >
              usr-101 (Alice)
            </button>
            <button
              onClick={() => handleFetchProfile('usr-102')}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-mono text-[11px]"
            >
              usr-102 (Bob)
            </button>
            <button
              onClick={() => handleFetchProfile('usr-777')}
              className="px-2 py-1 bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 rounded font-mono text-[11px] font-semibold"
              title="Target corporate executive account"
            >
              usr-777 (Evelyn CIO)
            </button>
          </div>
        </div>

        {/* Live status banner */}
        {profileResult.isIdorVulnerability ? (
          <div className="p-3 bg-rose-950/80 border border-rose-600 rounded-lg text-xs text-rose-200 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-rose-100">IDOR Vulnerability Confirmed (HTTP 200 OK): </span>
              <span>Logged in as <b>{currentUser.email}</b>, but successfully viewed the private record of <b>{displayedUser.email}</b>! Sensitive credit card details exfiltrated.</span>
            </div>
          </div>
        ) : profileResult.status === 403 ? (
          <div className="p-3 bg-emerald-950/80 border border-emerald-600 rounded-lg text-xs text-emerald-200 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-emerald-100">Access Control Enforced (HTTP 403 Forbidden): </span>
              <span>Server verified request session identity against requested object ownership. Tampered request blocked.</span>
            </div>
          </div>
        ) : null}
      </div>

      {/* Profile Card */}
      {profileResult.status === 200 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-900/50">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xl">
                {displayedUser.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{displayedUser.name}</h2>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                  <span className="font-mono text-indigo-400">ID: {displayedUser.id}</span>
                  <span>·</span>
                  <span className="capitalize">{displayedUser.role}</span>
                  <span>·</span>
                  <span>Member since {displayedUser.createdAt}</span>
                </div>
              </div>
            </div>

            {displayedUser.id !== currentUser.id && (
              <div className="px-3 py-1 bg-rose-900/80 border border-rose-700 text-rose-200 text-xs font-semibold rounded flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>EXFILTRATED RECORD (NOT CURRENT USER)</span>
              </div>
            )}
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email Address</span>
                </span>
                <p className="text-sm font-semibold text-slate-200">{displayedUser.email}</p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" />
                  <span>Contact Phone</span>
                </span>
                <p className="text-sm text-slate-200">{displayedUser.phone}</p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Physical Shipping Address</span>
                </span>
                <p className="text-sm text-slate-200">{displayedUser.address}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                <span className="text-slate-400 font-semibold uppercase tracking-wider block text-[10px] flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Payment Method on File</span>
                </span>
                <div className="font-mono text-sm text-slate-200">
                  {displayedUser.creditCardMasked}
                </div>
                {/* Exposed raw card in vulnerable mode / IDOR */}
                {config.a01_broken_access && displayedUser.creditCardRaw && (
                  <div className="pt-2 border-t border-slate-800 space-y-1">
                    <span className="text-[10px] text-rose-400 font-mono font-semibold block">
                      [VULNERABLE LEAK: RAW PCI DATA EXPOSED]
                    </span>
                    <p className="text-xs font-mono text-rose-300 bg-rose-950/60 p-2 rounded border border-rose-900 break-all">
                      {displayedUser.creditCardRaw}
                    </p>
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-1">
                <span className="text-slate-400 font-semibold uppercase tracking-wider block text-[10px] flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  <span>Credential Vault Record</span>
                </span>
                <p className="text-xs font-mono text-slate-300">
                  Hash: {displayedUser.passwordHash}
                </p>
                <span className="text-[10px] text-slate-500 block">
                  {config.a07_auth_session_weakness ? 'Algorithm: Plaintext/MD5 (Insecure A07)' : 'Algorithm: bcrypt $2b$12 (Secure)'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
