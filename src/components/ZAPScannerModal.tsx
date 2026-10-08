import React, { useState } from 'react';
import { VulnerabilityConfig, ZAPAlert } from '../types';
import { runZAPScan, ScanRunResult, CRAWLED_URLS } from '../services/zapScanner';
import { Bug, Play, ShieldAlert, ShieldCheck, CheckCircle2, AlertTriangle, AlertCircle, Info, ExternalLink, RefreshCw, FileText, Check } from 'lucide-react';

interface ZAPScannerModalProps {
  config: VulnerabilityConfig;
  onOpenReport: () => void;
  onToggleToRemediated: () => void;
  onToggleToVulnerable: () => void;
}

export const ZAPScannerModal: React.FC<ZAPScannerModalProps> = ({
  config,
  onOpenReport,
  onToggleToRemediated,
  onToggleToVulnerable
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(100);
  const [currentScan, setCurrentScan] = useState<ScanRunResult>(() => runZAPScan(config));
  const [selectedAlert, setSelectedAlert] = useState<ZAPAlert | null>(
    () => runZAPScan(config).alerts[0] || null
  );

  const handleStartScan = () => {
    setIsRunning(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsRunning(false);
          const freshResult = runZAPScan(config);
          setCurrentScan(freshResult);
          setSelectedAlert(freshResult.alerts[0] || null);
          return 100;
        }
        return prev + 25;
      });
    }, 250);
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'High':
        return 'text-rose-400 bg-rose-950/80 border-rose-800';
      case 'Medium':
        return 'text-amber-400 bg-amber-950/80 border-amber-800';
      case 'Low':
        return 'text-blue-400 bg-blue-950/80 border-blue-800';
      default:
        return 'text-slate-400 bg-slate-800 border-slate-700';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Bug className="w-6 h-6 text-amber-400" />
            <h1 className="text-2xl font-bold text-white tracking-tight">OWASP ZAP 2.15.0 DAST Test Bench</h1>
            <span className="text-xs px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-mono">
              Phase 2 Scanner
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Automated dynamic application security testing (DAST) crawler and active vulnerability scanner.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenReport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-lg transition-colors shadow-sm"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Generate Lab Report</span>
          </button>
        </div>
      </div>

      {/* Scan Config & Runner Control Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-500 block">Target Scope URL</span>
            <span className="font-mono text-white font-semibold">http://localhost:3000</span>
          </div>
          <div>
            <span className="text-slate-500 block">ZAP Engine Version</span>
            <span className="font-mono text-white font-semibold">v2.15.0 (Cross-Platform)</span>
          </div>
          <div>
            <span className="text-slate-500 block">Scan Profile</span>
            <span className="text-white font-semibold">Spider + Active Attack</span>
          </div>
          <div>
            <span className="text-slate-500 block">Last Scan Timestamp</span>
            <span className="font-mono text-slate-300">{currentScan.scanDate}</span>
          </div>
        </div>

        {/* Action button & progress */}
        <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handleStartScan}
              disabled={isRunning}
              className={`flex items-center gap-2 px-4 py-2 font-semibold text-xs rounded-lg transition-colors shadow-sm ${
                isRunning
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  : 'bg-amber-600 hover:bg-amber-500 text-slate-950'
              }`}
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Scanning Application... ({progress}%)</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Execute OWASP ZAP Scan</span>
                </>
              )}
            </button>

            <span className="text-xs text-slate-400">
              {isRunning ? 'Spidering endpoints & firing active payloads...' : `${currentScan.urlsCrawled.length} endpoints analyzed`}
            </span>
          </div>

          {/* Quick remediation re-test toggles */}
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => { onToggleToRemediated(); handleStartScan(); }}
              className="px-2.5 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 rounded font-medium transition-colors"
              title="Apply all patches and rerun scan"
            >
              Fix & Retest (Verify Remediation)
            </button>
            <button
              onClick={() => { onToggleToVulnerable(); handleStartScan(); }}
              className="px-2.5 py-1.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 rounded font-medium transition-colors"
              title="Restore lab weaknesses"
            >
              Reset to Vulnerable
            </button>
          </div>
        </div>

        {isRunning && (
          <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-amber-500 h-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      {/* Alert Severity Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-rose-400 text-xs font-semibold">
            <span>High Severity</span>
            <AlertCircle className="w-4 h-4" />
          </div>
          <div className="text-3xl font-bold text-white mt-2">{currentScan.highCount}</div>
          <p className="text-[11px] text-slate-500 mt-1">SQLi, IDOR, Outdated Components</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-amber-400 text-xs font-semibold">
            <span>Medium Severity</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="text-3xl font-bold text-white mt-2">{currentScan.mediumCount}</div>
          <p className="text-[11px] text-slate-500 mt-1">CSP missing, Debug leaked, Auth weak</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-blue-400 text-xs font-semibold">
            <span>Low Severity</span>
            <Info className="w-4 h-4" />
          </div>
          <div className="text-3xl font-bold text-white mt-2">{currentScan.lowCount}</div>
          <p className="text-[11px] text-slate-500 mt-1">Sensitive data logging</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Total Alerts</span>
            <Bug className="w-4 h-4" />
          </div>
          <div className="text-3xl font-bold text-white mt-2">{currentScan.totalAlerts}</div>
          <p className="text-[11px] text-slate-500 mt-1">
            {currentScan.totalAlerts === 0 ? 'Clean security posture' : 'Remediation required'}
          </p>
        </div>
      </div>

      {/* Visual Scan Telemetry Artifact */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Bug className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-white">OWASP ZAP Dynamic Scanning Telemetry Stream</span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">Live Session Image Capture</span>
        </div>
        <div className="relative aspect-[21/9] bg-black overflow-hidden">
          <img
            src="/src/assets/images/zap_security_dashboard_1791436160143.jpg"
            alt="OWASP ZAP Live Telemetry Dashboard"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute bottom-2 left-3 bg-slate-950/80 backdrop-blur-sm px-2.5 py-1 rounded border border-slate-700 text-[11px] text-slate-200">
            Target Host: <span className="font-mono text-amber-300">http://localhost:3000</span> · Active Scans: Completed (100%)
          </div>
        </div>
      </div>

      {/* Scan Results Layout: Alert Tree (Left) & Alert Detail (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Alert List */}
        <div className="lg:col-span-5 space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            ZAP Alert Tree ({currentScan.alerts.length})
          </h2>

          {currentScan.alerts.length === 0 ? (
            <div className="bg-slate-900 border border-emerald-800/60 rounded-xl p-8 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <h3 className="text-sm font-bold text-white">Zero Vulnerabilities Detected!</h3>
              <p className="text-xs text-slate-400">
                Remediation verified! All previously identified injection, broken access, and configuration weaknesses have been mitigated.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1">
              {currentScan.alerts.map((alert) => (
                <button
                  key={alert.id}
                  onClick={() => setSelectedAlert(alert)}
                  className={`w-full text-left p-3 rounded-xl border text-xs transition-all ${
                    selectedAlert?.id === alert.id
                      ? 'bg-slate-800 border-amber-500 text-white shadow-sm'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-100 line-clamp-1">{alert.name}</span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${getRiskColor(alert.risk)}`}>
                      {alert.risk}
                    </span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 truncate">{alert.url}</div>
                  <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
                    <span>Plugin ID: {alert.pluginId}</span>
                    <span>CWE-{alert.cweId}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Selected Alert Detail (Answering assignment requirements) */}
        <div className="lg:col-span-7">
          {selectedAlert ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 text-xs">
              {/* Header */}
              <div className="border-b border-slate-800 pb-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base font-bold text-white">{selectedAlert.name}</h3>
                  <span className={`px-2 py-0.5 rounded text-xs font-mono border ${getRiskColor(selectedAlert.risk)}`}>
                    Risk: {selectedAlert.risk}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-slate-400 text-[11px] mt-1.5">
                  <span>Plugin: {selectedAlert.pluginId}</span>
                  <span>·</span>
                  <span>Confidence: {selectedAlert.confidence}</span>
                  <span>·</span>
                  <span>CWE-{selectedAlert.cweId}</span>
                </div>
              </div>

              {/* Target Location Metadata */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950 border border-slate-800 rounded-lg font-mono text-[11px]">
                <div>
                  <span className="text-slate-500 block font-sans">Target URL:</span>
                  <span className="text-indigo-300 break-all">{selectedAlert.url}</span>
                </div>
                <div>
                  <span className="text-slate-500 block font-sans">HTTP Method:</span>
                  <span className="text-white">{selectedAlert.method}</span>
                </div>
                <div>
                  <span className="text-slate-500 block font-sans">Vulnerable Parameter:</span>
                  <span className="text-rose-300">{selectedAlert.parameter || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block font-sans">Attack String:</span>
                  <span className="text-amber-300 break-all">{selectedAlert.attack}</span>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] block">
                  Alert Description
                </span>
                <p className="text-slate-300 leading-relaxed">{selectedAlert.description}</p>
              </div>

              {/* Evidence */}
              <div className="space-y-1">
                <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] block">
                  Scan Evidence
                </span>
                <div className="p-2.5 bg-black/60 rounded border border-slate-800 font-mono text-[11px] text-rose-300 break-all">
                  {selectedAlert.evidence}
                </div>
              </div>

              {/* Solution */}
              <div className="space-y-1">
                <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] block">
                  Remediation Guidance
                </span>
                <p className="text-slate-300 leading-relaxed bg-slate-950 p-2.5 rounded border border-slate-800">
                  {selectedAlert.solution}
                </p>
              </div>

              {/* Reference */}
              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
                <span>Reference Standard: {selectedAlert.reference}</span>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400 text-xs">
              Select an alert from the tree to view complete vulnerability parameters and evidence.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
