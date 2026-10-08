import React, { useState } from 'react';
import { User, VulnerabilityConfig } from '../types';
import { storeService } from '../services/storeService';
import { Terminal, Play, ShieldAlert, ShieldCheck, Bug, Database, Key, Code, Layers, FileCode, CheckCircle, XCircle, ArrowRight } from 'lucide-react';

interface RedTeamWorkbenchProps {
  currentUser: User | null;
  config: VulnerabilityConfig;
  onNavigateToStore: () => void;
  onNavigateToAdmin: () => void;
}

interface AttackRecipe {
  id: string;
  name: string;
  owaspCategory: string;
  cwe: string;
  severity: 'High' | 'Medium' | 'Critical';
  description: string;
  endpoint: string;
  method: 'GET' | 'POST';
  defaultPayload: string;
  runAttack: (payload: string, config: VulnerabilityConfig, user: User | null) => AttackResult;
}

interface AttackResult {
  requestHttp: string;
  responseStatus: number;
  responseHttp: string;
  exploitSuccessful: boolean;
  impactSummary: string;
  evidenceData?: any;
}

export const RedTeamWorkbench: React.FC<RedTeamWorkbenchProps> = ({
  currentUser,
  config,
  onNavigateToStore,
  onNavigateToAdmin
}) => {
  const [selectedAttackId, setSelectedAttackId] = useState<string>('sqli_search');
  const [customPayload, setCustomPayload] = useState<string>("' OR 1=1 --");
  const [lastResult, setLastResult] = useState<AttackResult | null>(null);

  const attacks: AttackRecipe[] = [
    {
      id: 'sqli_search',
      name: 'SQL Injection: Catalog Restriction Bypass',
      owaspCategory: 'A03:2021-Injection',
      cwe: 'CWE-89: SQL Injection',
      severity: 'High',
      description: 'Inject boolean tautology into the product search query parameter to cancel the `isRestricted = 0` clause and dump confidential diagnostic tools.',
      endpoint: '/products/search?q={payload}',
      method: 'GET',
      defaultPayload: "' OR 1=1 --",
      runAttack: (payload, cfg) => {
        const res = storeService.searchProducts(payload, 'All', cfg);
        const req = `GET /products/search?q=${encodeURIComponent(payload)} HTTP/1.1\nHost: localhost:3000\nUser-Agent: RedTeam-CLI/2.4\nAccept: application/json`;
        
        if (cfg.a03_injection_sqli) {
          const restricted = res.products.filter(p => p.isRestricted);
          return {
            requestHttp: req,
            responseStatus: 200,
            responseHttp: `HTTP/1.1 200 OK\nContent-Type: application/json\n\n${JSON.stringify({
              executedQuery: res.executedQuery,
              totalReturned: res.products.length,
              restrictedItemsExfiltrated: restricted.map(r => ({ sku: r.sku, name: r.name, price: r.price }))
            }, null, 2)}`,
            exploitSuccessful: true,
            impactSummary: `Confidential restricted inventory exfiltrated! Dumped ${restricted.length} staff-only diagnostic tools bypassing row-level security.`,
            evidenceData: restricted
          };
        } else {
          return {
            requestHttp: req,
            responseStatus: 200,
            responseHttp: `HTTP/1.1 200 OK\nContent-Type: application/json\n\n${JSON.stringify({
              queryExecution: res.executedQuery,
              totalReturned: res.products.length,
              message: "Search handled securely using parameterized query."
            }, null, 2)}`,
            exploitSuccessful: false,
            impactSummary: 'Parameterized statement neutralized single quotes. Metacharacters treated as literal string search text. Restricted items remained protected.'
          };
        }
      }
    },
    {
      id: 'sqli_auth',
      name: 'SQL Injection: Authentication Bypass (Admin Takeover)',
      owaspCategory: 'A03:2021-Injection',
      cwe: 'CWE-89: SQL Injection',
      severity: 'Critical',
      description: 'Inject SQL comment syntax (`admin\' --`) into the email field to short-circuit password verification and gain root administrator privileges.',
      endpoint: '/api/auth/login',
      method: 'POST',
      defaultPayload: "admin' --",
      runAttack: (payload, cfg) => {
        const res = storeService.authenticate(payload, 'arbitrary_password', cfg);
        const req = `POST /api/auth/login HTTP/1.1\nHost: localhost:3000\nContent-Type: application/json\n\n{\n  "email": "${payload}",\n  "password": "arbitrary_password"\n}`;

        if (res.isSqliBypass && cfg.a03_injection_sqli) {
          return {
            requestHttp: req,
            responseStatus: 200,
            responseHttp: `HTTP/1.1 200 OK\nSet-Cookie: session=${res.token}; Path=/\nContent-Type: application/json\n\n${JSON.stringify({
              success: true,
              role: res.user?.role,
              sessionToken: res.token,
              user: res.user?.name,
              debugSql: res.executedQuery
            }, null, 2)}`,
            exploitSuccessful: true,
            impactSummary: `Full Administrative Account Takeover! The backend executed raw SQL without validating passwords, logging in as Marcus Vance (System Admin).`,
            evidenceData: res.user
          };
        } else {
          return {
            requestHttp: req,
            responseStatus: 401,
            responseHttp: `HTTP/1.1 401 Unauthorized\nContent-Type: application/json\n\n{\n  "error": "Invalid credentials provided",\n  "method": "Parameterized query comparison"\n}`,
            exploitSuccessful: false,
            impactSummary: 'Authentication bypass failed. Input was treated as a literal email string and matched zero accounts.'
          };
        }
      }
    },
    {
      id: 'idor_profile',
      name: 'Insecure Direct Object Reference (PII Exfiltration)',
      owaspCategory: 'A01:2021-Broken Access Control',
      cwe: 'CWE-639: IDOR',
      severity: 'High',
      description: 'Tamper with the `id` parameter on `/api/user/profile` to exfiltrate private profile data and raw unmasked credit cards of the corporate CIO (usr-777).',
      endpoint: '/api/user/profile?id=usr-777',
      method: 'GET',
      defaultPayload: 'usr-777',
      runAttack: (payload, cfg, user) => {
        const res = storeService.getUserProfile(payload, user, cfg);
        const req = `GET /api/user/profile?id=${payload} HTTP/1.1\nHost: localhost:3000\nCookie: session=${user?.sessionToken || 'SEC_SESSION_1001'}`;

        if (res.isIdorVulnerability && cfg.a01_broken_access) {
          return {
            requestHttp: req,
            responseStatus: 200,
            responseHttp: `HTTP/1.1 200 OK\nContent-Type: application/json\n\n${JSON.stringify(res.user, null, 2)}`,
            exploitSuccessful: true,
            impactSummary: `Horizontal privilege escalation confirmed! Exfiltrated CIO Evelyn Reed's physical address and raw unmasked credit card (${res.user?.creditCardRaw}).`,
            evidenceData: res.user
          };
        } else {
          return {
            requestHttp: req,
            responseStatus: 403,
            responseHttp: `HTTP/1.1 403 Forbidden\nContent-Type: application/json\n\n{\n  "error": "Access Denied: You do not have permission to view this profile."\n}`,
            exploitSuccessful: false,
            impactSummary: 'Access blocked by authorization middleware. Session identity strictly validated against resource owner.'
          };
        }
      }
    },
    {
      id: 'prototype_pollution',
      name: 'A06 Prototype Pollution via Outdated lodash 4.17.15',
      owaspCategory: 'A06:2021-Vulnerable and Outdated Components',
      cwe: 'CWE-1321: Prototype Pollution',
      severity: 'Critical',
      description: 'Transmit crafted JSON body containing `__proto__` to inject global properties into `Object.prototype`, achieving runtime privilege escalation (CVE-2020-8203).',
      endpoint: '/api/user/preferences',
      method: 'POST',
      defaultPayload: '{"__proto__": {"isAdmin": true, "bypassAudit": true}}',
      runAttack: (payload, cfg) => {
        const res = storeService.simulatePrototypePollution(payload, cfg);
        const req = `POST /api/user/preferences HTTP/1.1\nHost: localhost:3000\nContent-Type: application/json\n\n${payload}`;

        if (res.success && cfg.a06_outdated_component) {
          return {
            requestHttp: req,
            responseStatus: 200,
            responseHttp: `HTTP/1.1 200 OK\nContent-Type: application/json\n\n${JSON.stringify({
              status: "Preferences updated",
              prototypePollutionTriggered: true,
              cveReference: "CVE-2020-8203",
              injectedGlobalProperties: res.pollutedProperties
            }, null, 2)}`,
            exploitSuccessful: true,
            impactSummary: `Prototype Pollution Succeeded! Global Object.prototype is now infected with isAdmin=true. The current user now inherits administrative access across all endpoints.`,
            evidenceData: res.pollutedProperties
          };
        } else {
          return {
            requestHttp: req,
            responseStatus: 400,
            responseHttp: `HTTP/1.1 400 Bad Request\nContent-Type: application/json\n\n{\n  "error": "Dangerous prototype keys rejected by sanitizer (lodash 4.17.21 patched)"\n}`,
            exploitSuccessful: false,
            impactSummary: 'Prototype pollution blocked by updated library / key-filtering sanitizer. Object.prototype remained uncorrupted.'
          };
        }
      }
    },
    {
      id: 'debug_env_leak',
      name: 'Security Misconfiguration: /api/debug/env Secret Exfiltration',
      owaspCategory: 'A05:2021-Security Misconfiguration',
      cwe: 'CWE-200: Information Exposure',
      severity: 'High',
      description: 'Access unauthenticated development diagnostic route to harvest production database passwords, JWT private keys, and internal API tokens.',
      endpoint: '/api/debug/env',
      method: 'GET',
      defaultPayload: 'N/A (Direct endpoint request)',
      runAttack: (_, cfg) => {
        const res = storeService.getDebugEndpoint(cfg);
        const req = `GET /api/debug/env HTTP/1.1\nHost: localhost:3000\nUser-Agent: Mozilla/5.0`;

        if (res.status === 200 && cfg.a05_security_misconfig) {
          return {
            requestHttp: req,
            responseStatus: 200,
            responseHttp: `HTTP/1.1 200 OK\n${Object.entries(res.headers).map(([k, v]) => `${k}: ${v}`).join('\n')}\n\n${JSON.stringify(res.data, null, 2)}`,
            exploitSuccessful: true,
            impactSummary: `Critical Information Disclosure! Harvested DB_PASSWORD: "SuperSecretDatabasePass2026!" and PAYMENT_API_KEY. Missing CSP & security headers confirmed.`,
            evidenceData: res.data
          };
        } else {
          return {
            requestHttp: req,
            responseStatus: 403,
            responseHttp: `HTTP/1.1 403 Forbidden\nContent-Type: application/json\n\n${JSON.stringify(res.data, null, 2)}`,
            exploitSuccessful: false,
            impactSummary: 'Debug endpoint disabled in production configuration. Standard security headers (CSP, HSTS, X-Frame-Options) properly enforced.'
          };
        }
      }
    },
    {
      id: 'session_prediction',
      name: 'Session Hijacking: Sequential Token Enumeration (A07)',
      owaspCategory: 'A07:2021-Identification & Auth Failures',
      cwe: 'CWE-330: Insufficient Randomness',
      severity: 'Medium',
      description: 'Exploit deterministic counter tokens (SEC_SESSION_1001, 1002...) to guess and forge administrative session SEC_SESSION_0001.',
      endpoint: '/api/admin/system',
      method: 'GET',
      defaultPayload: 'Cookie: session=SEC_SESSION_0001',
      runAttack: (_, cfg) => {
        const req = `GET /api/admin/system HTTP/1.1\nHost: localhost:3000\nCookie: session=SEC_SESSION_0001`;

        if (cfg.a07_auth_session_weakness) {
          return {
            requestHttp: req,
            responseStatus: 200,
            responseHttp: `HTTP/1.1 200 OK\nContent-Type: application/json\n\n{\n  "authenticated": true,\n  "account": "admin@secureshop.local",\n  "role": "admin",\n  "entropyBits": 12,\n  "risk": "Deterministic Sequential Session Counter"\n}`,
            exploitSuccessful: true,
            impactSummary: `Session Hijacked! Predicted admin token SEC_SESSION_0001 without valid credentials, achieving unauthenticated root access.`,
            evidenceData: { token: 'SEC_SESSION_0001' }
          };
        } else {
          return {
            requestHttp: req,
            responseStatus: 401,
            responseHttp: `HTTP/1.1 401 Unauthorized\nContent-Type: application/json\n\n{\n  "error": "Invalid high-entropy token",\n  "entropyBits": 128,\n  "algorithm": "CSPRNG cryptographically random UUID"\n}`,
            exploitSuccessful: false,
            impactSummary: 'Session prediction failed. System employs 128-bit cryptographically secure random session tokens.'
          };
        }
      }
    }
  ];

  const currentAttack = attacks.find(a => a.id === selectedAttackId) || attacks[0];

  const handleSelectAttack = (attack: AttackRecipe) => {
    setSelectedAttackId(attack.id);
    setCustomPayload(attack.defaultPayload);
    setLastResult(null);
  };

  const handleExecuteAttack = () => {
    const result = currentAttack.runAttack(customPayload, config, currentUser);
    setLastResult(result);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Terminal className="w-6 h-6 text-rose-400" />
            <h1 className="text-2xl font-bold text-white tracking-tight">Red Team Attack Workbench</h1>
            <span className="text-xs px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-mono">
              Live Exploit Lab
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Simulate and validate security weaknesses against SecureShop in real-time under Vulnerable and Hardened configurations.
          </p>
        </div>

        {/* Global State Indicator */}
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold px-3 py-1 rounded border flex items-center gap-1.5 ${
            config.a03_injection_sqli 
              ? 'bg-rose-950/80 border-rose-800 text-rose-200' 
              : 'bg-emerald-950/80 border-emerald-800 text-emerald-200'
          }`}>
            {config.a03_injection_sqli ? (
              <>
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>Target State: Vulnerable (Lab Mode)</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Target State: Remediated (Secure Mode)</span>
              </>
            )}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Attack Recipe Selector */}
        <div className="lg:col-span-4 space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Select Attack Vector
          </h2>
          {attacks.map((atk) => (
            <button
              key={atk.id}
              onClick={() => handleSelectAttack(atk)}
              className={`w-full text-left p-3 rounded-xl border text-xs transition-all ${
                selectedAttackId === atk.id
                  ? 'bg-slate-800 border-indigo-500 shadow-sm text-white'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-slate-100">{atk.name}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                  atk.severity === 'Critical' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                  atk.severity === 'High' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                  'bg-blue-950 text-blue-300 border border-blue-800'
                }`}>
                  {atk.severity}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 line-clamp-1">{atk.owaspCategory}</div>
              <div className="text-[10px] font-mono text-slate-500 mt-1">{atk.endpoint}</div>
            </button>
          ))}
        </div>

        {/* Right: Attack Execution & Terminal Inspector */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            {/* Header info */}
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">{currentAttack.name}</h3>
                <span className="text-xs font-mono text-indigo-400">{currentAttack.cwe}</span>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {currentAttack.description}
              </p>
            </div>

            {/* Target Endpoint & Payload Box */}
            <div className="space-y-3 pt-2 border-t border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-mono text-slate-400 font-semibold">{currentAttack.method}</span>
                <span className="font-mono text-slate-200 bg-slate-950 px-2 py-1 rounded border border-slate-800 flex-1 truncate">
                  {currentAttack.endpoint}
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium block">Attack Payload / Parameter</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customPayload}
                    onChange={(e) => setCustomPayload(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg font-mono text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={handleExecuteAttack}
                    className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-lg transition-colors shadow-sm text-xs"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Run Attack</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Results Console */}
          {lastResult && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Verdict Banner */}
              <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                lastResult.exploitSuccessful
                  ? 'bg-rose-950/80 border-rose-600 text-rose-200'
                  : 'bg-emerald-950/80 border-emerald-600 text-emerald-200'
              }`}>
                {lastResult.exploitSuccessful ? (
                  <XCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-bold text-sm">
                    {lastResult.exploitSuccessful ? 'VULNERABILITY EXPLOITED (HTTP ' + lastResult.responseStatus + ')' : 'ATTACK BLOCKED (HTTP ' + lastResult.responseStatus + ')'}
                  </div>
                  <p className="text-xs mt-1 leading-relaxed">
                    {lastResult.impactSummary}
                  </p>
                </div>
              </div>

              {/* Raw Request / Response Inspector */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                  <span className="text-slate-500 text-[10px] uppercase font-sans font-semibold tracking-wider block">
                    Sent HTTP Request
                  </span>
                  <pre className="text-slate-300 overflow-x-auto whitespace-pre-wrap break-all text-[11px] leading-relaxed max-h-64">
                    {lastResult.requestHttp}
                  </pre>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                  <span className="text-slate-500 text-[10px] uppercase font-sans font-semibold tracking-wider block">
                    Received HTTP Response
                  </span>
                  <pre className={`overflow-x-auto whitespace-pre-wrap break-all text-[11px] leading-relaxed max-h-64 ${
                    lastResult.exploitSuccessful ? 'text-rose-300' : 'text-emerald-300'
                  }`}>
                    {lastResult.responseHttp}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
