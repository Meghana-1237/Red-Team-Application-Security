export interface User {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'admin';
  phone: string;
  address: string;
  creditCardMasked: string;
  creditCardRaw?: string; // Exposed in vulnerable mode
  passwordHash: string; // Plaintext or MD5 in vulnerable mode, bcrypt-style in secure mode
  sessionToken?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  rating: number;
  reviewsCount: number;
  image: string;
  description: string;
  stock: number;
  isRestricted?: boolean; // Hidden internal product exposed via SQLi
  sku: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  image: string;
}

export interface Order {
  id: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  total: number;
  status: 'Processing' | 'Shipped' | 'Delivered' | 'Flagged';
  shippingAddress: string;
  paymentMethod: string;
  createdAt: string;
}

export interface VulnerabilityConfig {
  a01_broken_access: boolean; // IDOR & Admin route access without role check
  a03_injection_sqli: boolean; // SQL injection in product search and auth
  a03_injection_xss: boolean; // Reflected XSS in search term
  a05_security_misconfig: boolean; // Leaked /api/debug/env and missing security headers
  a06_outdated_component: boolean; // lodash 4.17.15 Prototype Pollution CVE-2020-8203
  a07_auth_session_weakness: boolean; // Predictable session tokens & plaintext/weak hashes
  a09_logging_failure: boolean; // Sensitive data leakage in server logs
}

export interface SecurityFinding {
  id: string;
  owaspCategory: 'A01:2021-Broken Access Control' | 'A03:2021-Injection' | 'A05:2021-Security Misconfiguration' | 'A06:2021-Vulnerable and Outdated Components' | 'A07:2021-Identification and Authentication Failures' | 'A09:2021-Security Logging and Monitoring Failures';
  title: string;
  cwe: string;
  severity: 'High' | 'Medium' | 'Low' | 'Informational';
  zapPluginId: number;
  affectedUrl: string;
  parameter?: string;
  what: string;
  where: string;
  why: string;
  impact: string;
  evidence: string;
  remediationCode: string;
  isPatched: boolean;
}

export interface OutdatedComponentDoc {
  name: string;
  installedVersion: string;
  latestVersion: string;
  cve: string;
  cvssScore: number;
  severity: 'High' | 'Critical';
  vulnerabilityType: string;
  riskDescription: string;
  pocPayload: string;
  remediationSteps: string[];
}

export interface ZAPAlert {
  id: string;
  pluginId: number;
  name: string;
  risk: 'High' | 'Medium' | 'Low' | 'Informational';
  confidence: 'High' | 'Medium' | 'Low';
  url: string;
  method: 'GET' | 'POST';
  parameter: string;
  attack: string;
  evidence: string;
  cweId: number;
  wascId: number;
  description: string;
  solution: string;
  reference: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'SECURITY';
  source: string;
  message: string;
  containsSensitiveData?: boolean;
}
