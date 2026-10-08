import { ZAPAlert, SecurityFinding, VulnerabilityConfig } from '../types';

export interface ScanRunResult {
  scanId: string;
  scanDate: string;
  targetUrl: string;
  zapVersion: string;
  scanType: 'Spider + Active DAST Scan';
  durationSeconds: number;
  urlsCrawled: string[];
  totalAlerts: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  infoCount: number;
  alerts: ZAPAlert[];
  findings: SecurityFinding[];
}

export const CRAWLED_URLS = [
  'http://localhost:3000/',
  'http://localhost:3000/products',
  'http://localhost:3000/products/search?q=',
  'http://localhost:3000/product/prod-001',
  'http://localhost:3000/cart',
  'http://localhost:3000/checkout',
  'http://localhost:3000/login',
  'http://localhost:3000/register',
  'http://localhost:3000/api/user/profile?id=usr-101',
  'http://localhost:3000/api/orders/ORD-1001',
  'http://localhost:3000/admin',
  'http://localhost:3000/api/admin/users',
  'http://localhost:3000/api/debug/env'
];

export function runZAPScan(config: VulnerabilityConfig): ScanRunResult {
  const alerts: ZAPAlert[] = [];
  const findings: SecurityFinding[] = [];

  // 1. A03 - SQL Injection
  if (config.a03_injection_sqli) {
    alerts.push({
      id: 'zap-sqli-01',
      pluginId: 40018,
      name: 'SQL Injection - Tautology / Boolean Based',
      risk: 'High',
      confidence: 'High',
      url: 'http://localhost:3000/products/search?q=',
      method: 'GET',
      parameter: 'q',
      attack: "' OR 1=1 --",
      evidence: "SELECT * FROM products WHERE isRestricted = 0 AND (name LIKE '%' OR 1=1 --%)",
      cweId: 89,
      wascId: 19,
      description: 'SQL injection may be possible. The input parameter \'q\' was directly concatenated into the database query string without prior sanitization or parameterized binding, returning unauthorized hidden table rows.',
      solution: 'Use parameterized queries (prepared statements) or an Object Relational Mapper (ORM) for all database operations. Never concatenate user-supplied input into dynamic SQL strings.',
      reference: 'https://owasp.org/www-community/attacks/SQL_Injection'
    });

    findings.push({
      id: 'find-sqli',
      owaspCategory: 'A03:2021-Injection',
      title: 'SQL Injection in Product Catalog Search Engine',
      cwe: 'CWE-89: Improper Neutralization of Special Elements used in an SQL Command',
      severity: 'High',
      zapPluginId: 40018,
      affectedUrl: 'http://localhost:3000/products/search?q=',
      parameter: 'q',
      what: 'OWASP ZAP identified a High-severity SQL Injection flaw on the search parameter \'q\'. The application engine evaluated the raw SQL statement without binding constraints.',
      where: 'URL: /products/search?q= | Parameter: q | Component: StoreService.searchProducts() / SQL parser engine',
      why: 'The backend builds queries using dynamic string interpolation: `SELECT * FROM products WHERE ... name LIKE \'${query}%\'`. User metacharacters like single-quote (\') prematurely terminate the literal boundary and alter SQL syntax structure.',
      impact: 'An unauthenticated attacker can dump internal database tables, bypass row-level access restrictions to view classified diagnostic kits, and bypass authentication by sending `admin\' --` in login endpoints.',
      evidence: "GET /products/search?q=%27+OR+1%3D1+-- HTTP/1.1\nHost: localhost:3000\n\nHTTP/1.1 200 OK\nResponse contains restricted internal records: \"[RESTRICTED] Hardware Firmware Flasher & Master Key Kit\" (SKU: INTERNAL-CONFIDENTIAL-099).",
      remediationCode: `// BEFORE (Vulnerable Dynamic SQL):
const sql = \`SELECT * FROM products WHERE isRestricted = 0 AND name LIKE '%\${query}%'\`;

// AFTER (Secure Parameterized Query):
const sql = \`SELECT * FROM products WHERE isRestricted = 0 AND name ILIKE $1\`;
await db.query(sql, [\`%\${query}%\`]);`,
      isPatched: false
    });
  }

  // 2. A03 - Reflected Cross-Site Scripting (XSS)
  if (config.a03_injection_xss) {
    alerts.push({
      id: 'zap-xss-01',
      pluginId: 40012,
      name: 'Cross Site Scripting (Reflected)',
      risk: 'High',
      confidence: 'High',
      url: 'http://localhost:3000/products/search?q=',
      method: 'GET',
      parameter: 'q',
      attack: '<script>alert("ZAP-XSS")</script>',
      evidence: '<script>alert("ZAP-XSS")</script>',
      cweId: 79,
      wascId: 8,
      description: 'Reflected Cross-site Scripting (XSS) occurs when user-supplied input is immediately returned in an HTTP response without adequate validation or context-aware output encoding.',
      solution: 'Ensure all user input is sanitized and HTML-entity encoded before rendering into the DOM. Implement Content-Security-Policy with strict nonces.',
      reference: 'https://owasp.org/www-community/attacks/xss/'
    });

    findings.push({
      id: 'find-xss',
      owaspCategory: 'A03:2021-Injection',
      title: 'Reflected Cross-Site Scripting (XSS) in Search Results Banner',
      cwe: 'CWE-79: Improper Neutralization of Input During Web Page Generation',
      severity: 'High',
      zapPluginId: 40012,
      affectedUrl: 'http://localhost:3000/products/search?q=',
      parameter: 'q',
      what: 'OWASP ZAP identified Reflected XSS when sending HTML and JavaScript payloads into the search query parameter, which the application reflected directly into innerHTML without sanitization.',
      where: 'URL: /products/search?q= | Parameter: q | Component: Search Results Component (dangerouslySetInnerHTML / unescaped reflection)',
      why: 'User query input was directly rendered into the DOM using raw HTML injection instead of text nodes or sanitized React JSX nodes.',
      impact: 'Attackers can trick users into clicking phishing links that execute malicious script in the victim\'s session, stealing session cookies, capturing keystrokes, and hijacking authenticated accounts.',
      evidence: "GET /products/search?q=%3Cscript%3Ealert(%22ZAP-XSS%22)%3C%2Fscript%3E HTTP/1.1\n\nHTTP/1.1 200 OK\nContent-Type: text/html\n\n<div>Search results for: <script>alert(\"ZAP-XSS\")</script></div>",
      remediationCode: `// BEFORE (Vulnerable unescaped DOM insertion):
<div dangerouslySetInnerHTML={{ __html: \`Showing results for: \${searchQuery}\` }} />

// AFTER (Secure React standard text rendering / DOMPurify):
<div>Showing results for: <span className="font-semibold">{searchQuery}</span></div>`,
      isPatched: false
    });
  }

  // 3. A01 - Broken Access Control (IDOR & Admin Route)
  if (config.a01_broken_access) {
    alerts.push({
      id: 'zap-idor-01',
      pluginId: 10044,
      name: 'Insecure Direct Object Reference (IDOR) / Broken Access Control',
      risk: 'High',
      confidence: 'High',
      url: 'http://localhost:3000/api/user/profile?id=',
      method: 'GET',
      parameter: 'id',
      attack: 'id=usr-777',
      evidence: 'evelyn.cio@secureshop.local',
      cweId: 639,
      wascId: 2,
      description: 'The server accepts user-supplied identifiers (id=usr-777, orderId=ORD-7777) to retrieve sensitive records without validating if the requester owns the target resource or possesses authorized administrative privileges.',
      solution: 'Implement robust server-side authorization checks verifying that the authenticated session identity matches the requested resource owner, or enforce indirect reference mapping.',
      reference: 'https://owasp.org/Top10/A01_2021-Broken_Access_Control/'
    });

    findings.push({
      id: 'find-idor',
      owaspCategory: 'A01:2021-Broken Access Control',
      title: 'Insecure Direct Object References (IDOR) on User Profile & Order APIs',
      cwe: 'CWE-639: Authorization Bypass Through User-Controlled Key',
      severity: 'High',
      zapPluginId: 10044,
      affectedUrl: 'http://localhost:3000/api/user/profile?id= & /api/orders/:id',
      parameter: 'id, orderId',
      what: 'OWASP ZAP identified Broken Access Control: changing the URL parameter from usr-101 to usr-777 dumped sensitive profile data (including home address and raw credit card number) of the corporate CIO.',
      where: 'Endpoints: /api/user/profile?id={userId} and /api/orders/{orderId} | Controller: StoreService.getUserProfile & getOrderById',
      why: 'The backend controller trusted the client-supplied user ID parameter without verifying the session token of the requesting user against the database owner record.',
      impact: 'Horizontal privilege escalation: Any logged-in customer or external guest can harvest personal identifiable information (PII), shipping addresses, and payment data of every registered user across the platform.',
      evidence: "GET /api/user/profile?id=usr-777 HTTP/1.1\nCookie: session=SEC_SESSION_1001 (Alice)\n\nHTTP/1.1 200 OK\n{\n  \"id\": \"usr-777\",\n  \"name\": \"Evelyn Reed (CIO)\",\n  \"creditCardRaw\": \"3782-8224-6310-8888 (AMEX EXP 12/29 CVV 4410)\"\n}",
      remediationCode: `// BEFORE (Vulnerable IDOR):
app.get('/api/user/profile', (req, res) => {
  const user = db.findUserById(req.query.id);
  res.json(user); // No permission check!
});

// AFTER (Secure Ownership Verification):
app.get('/api/user/profile', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin' && req.user.id !== req.query.id) {
    return res.status(403).json({ error: 'Access Denied: Forbidden' });
  }
  const user = db.findUserById(req.query.id);
  res.json(sanitizeUser(user));
});`,
      isPatched: false
    });
  }

  // 4. A05 - Security Misconfiguration
  if (config.a05_security_misconfig) {
    alerts.push({
      id: 'zap-misconfig-01',
      pluginId: 10038,
      name: 'Content Security Policy (CSP) Header Not Set',
      risk: 'Medium',
      confidence: 'High',
      url: 'http://localhost:3000/',
      method: 'GET',
      parameter: 'Header',
      attack: 'N/A',
      evidence: 'Missing Content-Security-Policy response header',
      cweId: 16,
      wascId: 15,
      description: 'Content Security Policy (CSP) is an HTTP header that allows site operators to restrict the resources (scripts, images, styles) that the browser is allowed to load for a given page, mitigating XSS and clickjacking.',
      solution: 'Configure the web server to send an effective Content-Security-Policy header restricting script execution to authorized domains and cryptographic nonces.',
      reference: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP'
    });

    alerts.push({
      id: 'zap-misconfig-02',
      pluginId: 10021,
      name: 'Information Disclosure - Debug Endpoint / Stack Trace Exposed',
      risk: 'Medium',
      confidence: 'High',
      url: 'http://localhost:3000/api/debug/env',
      method: 'GET',
      parameter: 'URI path',
      attack: '/api/debug/env',
      evidence: '"DB_PASSWORD": "SuperSecretDatabasePass2026!"',
      cweId: 200,
      wascId: 13,
      description: 'The web application exposes internal diagnostic/debug endpoints and unhandled stack traces disclosing internal infrastructure hostnames, credentials, and API secret keys.',
      solution: 'Disable development and debug routes in production configurations. Enforce strict environment separation and centralized secret management.',
      reference: 'https://owasp.org/Top10/A05_2021-Security_Misconfiguration/'
    });

    findings.push({
      id: 'find-misconfig',
      owaspCategory: 'A05:2021-Security Misconfiguration',
      title: 'Exposed Internal Debug Diagnostic Endpoint & Missing HTTP Security Headers',
      cwe: 'CWE-200: Exposure of Sensitive Information to an Unauthorized Actor',
      severity: 'Medium',
      zapPluginId: 10021,
      affectedUrl: 'http://localhost:3000/api/debug/env & Root HTTP Headers',
      parameter: 'Header & URL',
      what: 'OWASP ZAP discovered active information disclosure on /api/debug/env leaking database passwords and internal API secrets, combined with completely missing CSP, X-Frame-Options, and HSTS headers.',
      where: 'Endpoint: /api/debug/env and Express response middleware headers',
      why: 'Development debug flags were mistakenly left enabled in the production build without authentication or IP whitelisting, and no security header middleware (such as helmet) was configured.',
      impact: 'Attackers gain blueprint information of the internal database infrastructure, enabling direct pivot attacks with compromised credentials, and facilitating clickjacking/MIME-sniffing exploits.',
      evidence: "GET /api/debug/env HTTP/1.1\n\nHTTP/1.1 200 OK\n{\n  \"DB_HOST\": \"10.0.4.12:5432\",\n  \"DB_PASSWORD\": \"SuperSecretDatabasePass2026!\",\n  \"INTERNAL_MASTER_KEY\": \"MASTER_DEV_OVERRIDE_ENABLED\"\n}",
      remediationCode: `// BEFORE (Vulnerable debug route exposed):
app.get('/api/debug/env', (req, res) => res.json(process.env));

// AFTER (Secure Helmet headers + disabled debug endpoint):
import helmet from 'helmet';
app.use(helmet());

app.get('/api/debug/env', (req, res) => {
  res.status(403).json({ error: 'Forbidden in production' });
});`,
      isPatched: false
    });
  }

  // 5. A06 - Vulnerable and Outdated Component
  if (config.a06_outdated_component) {
    alerts.push({
      id: 'zap-outdated-01',
      pluginId: 10055,
      name: 'Vulnerable and Outdated Third-Party Library (lodash 4.17.15 Prototype Pollution)',
      risk: 'High',
      confidence: 'High',
      url: 'http://localhost:3000/package.json',
      method: 'GET',
      parameter: 'lodash@4.17.15',
      attack: 'CVE-2020-8203',
      evidence: '"lodash": "4.17.15"',
      cweId: 1321,
      wascId: 44,
      description: 'The application imports an outdated version of lodash (4.17.15) vulnerable to Prototype Pollution (CVE-2020-8203, CVSS 7.4). Path operations allow injecting properties directly onto Object.prototype.',
      solution: 'Upgrade the lodash dependency to version 4.17.21 or later using "npm update lodash" and integrate automated dependency vulnerability audits (npm audit / Snyk).',
      reference: 'https://nvd.nist.gov/vuln/detail/CVE-2020-8203'
    });

    findings.push({
      id: 'find-outdated',
      owaspCategory: 'A06:2021-Vulnerable and Outdated Components',
      title: 'Prototype Pollution via Outdated Component: lodash@4.17.15 (CVE-2020-8203)',
      cwe: 'CWE-1321: Improperly Controlled Modification of Object Prototype Attributes',
      severity: 'High',
      zapPluginId: 10055,
      affectedUrl: 'http://localhost:3000 (Node.js runtime / package dependencies)',
      parameter: 'JSON body parser',
      what: 'OWASP ZAP dependency auditing identified the inclusion of lodash version 4.17.15, which carries a known published vulnerability (CVE-2020-8203) with CVSS 7.4.',
      where: 'Application dependency manifest: package.json (lodash@4.17.15) & object merge utilities',
      why: 'Legacy code relied on unpatched utility functions that fail to sanitize recursive object keys such as "__proto__" and "constructor.prototype" when copying nested structures.',
      impact: 'An attacker transmitting crafted JSON payloads like {"__proto__": {"isAdmin": true}} pollutes the global prototype chain, bypassing authorization logic across unrelated modules.',
      evidence: "POST /api/user/preferences HTTP/1.1\nContent-Type: application/json\n\n{\"__proto__\": {\"isAdmin\": true}}\n\nResult: Object.prototype.isAdmin === true across all downstream application checks.",
      remediationCode: `// Step 1: Update package.json
// "lodash": "^4.17.21"

// Step 2: Input Sanitization Defense-in-Depth
function safeMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue; // Filter dangerous prototype keys
    }
    target[key] = source[key];
  }
  return target;
}`,
      isPatched: false
    });
  }

  // 6. A07 - Authentication / Session Weakness
  if (config.a07_auth_session_weakness) {
    alerts.push({
      id: 'zap-auth-01',
      pluginId: 10053,
      name: 'Weak / Predictable Session Token & Unsalted Password Storage',
      risk: 'Medium',
      confidence: 'High',
      url: 'http://localhost:3000/login',
      method: 'POST',
      parameter: 'Set-Cookie / sessionToken',
      attack: 'Sequential token enumeration (SEC_SESSION_1001 -> SEC_SESSION_1002)',
      evidence: 'SEC_SESSION_1001',
      cweId: 330,
      wascId: 37,
      description: 'Session identifiers are generated sequentially (SEC_SESSION_1001, SEC_SESSION_1002) rather than using a cryptographically secure pseudorandom number generator (CSPRNG), allowing session hijacking.',
      solution: 'Generate session tokens using a CSPRNG with at least 128 bits of entropy (e.g., crypto.randomBytes(32)) and hash passwords using Argon2 or bcrypt with high work factor.',
      reference: 'https://owasp.org/Top10/A07_2021-Identification_and_Authentication_Failures/'
    });

    findings.push({
      id: 'find-auth',
      owaspCategory: 'A07:2021-Identification and Authentication Failures',
      title: 'Predictable Sequential Session Identifiers & Plaintext Credential Storage',
      cwe: 'CWE-330: Use of Insufficiently Random Values in Session Token Generation',
      severity: 'Medium',
      zapPluginId: 10053,
      affectedUrl: 'http://localhost:3000/login & Session Management Engine',
      parameter: 'sessionToken',
      what: 'OWASP ZAP analysis detected that issued authentication tokens follow a deterministic sequential pattern (SEC_SESSION_1001, 1002, 1003) and user database records store unhashed plaintext passwords.',
      where: 'Controller: StoreService.authenticate & Session Generator',
      why: 'The session manager increments an integer counter rather than generating high-entropy cryptographically secure random bytes.',
      impact: 'Attackers can brute-force or predict active session tokens of legitimate users and administrative staff without needing to know passwords, executing account takeovers.',
      evidence: "Login as Alice -> Cookie: session=SEC_SESSION_1001\nLogin as Bob   -> Cookie: session=SEC_SESSION_1002\nAttacker predicts Admin token -> Cookie: session=SEC_SESSION_0001 (Valid Admin Session!).",
      remediationCode: `// BEFORE (Predictable Counter):
let counter = 1000;
const token = \`SEC_SESSION_\${counter++}\`;

// AFTER (Cryptographically Secure CSPRNG):
import crypto from 'crypto';
const token = crypto.randomBytes(32).toString('hex');
// Passwords hashed with bcrypt:
const hash = await bcrypt.hash(password, 12);`,
      isPatched: false
    });
  }

  // 7. A09 - Logging & Monitoring Weakness
  if (config.a09_logging_failure) {
    alerts.push({
      id: 'zap-log-01',
      pluginId: 10098,
      name: 'Sensitive Data Exposure in Application Logging Stream',
      risk: 'Low',
      confidence: 'High',
      url: 'http://localhost:3000/api/admin/logs',
      method: 'GET',
      parameter: 'Log message content',
      attack: 'Log inspection',
      evidence: 'RAW_PASSWORD_DUMP: "alice_password123"',
      cweId: 532,
      wascId: 13,
      description: 'The application logs sensitive plaintext credentials, session tokens, and full unmasked payment card details directly to persistent log files.',
      solution: 'Implement automated log masking/redaction filters. Never log passwords, tokens, full PAN numbers, or CVVs.',
      reference: 'https://owasp.org/Top10/A09_2021-Security_Logging_and_Monitoring_Failures/'
    });

    findings.push({
      id: 'find-logging',
      owaspCategory: 'A09:2021-Security Logging and Monitoring Failures',
      title: 'Exposure of Plaintext Passwords & Credit Card Data in Server Event Logs',
      cwe: 'CWE-532: Insertion of Sensitive Information into Log File',
      severity: 'Low',
      zapPluginId: 10098,
      affectedUrl: 'http://localhost:3000/api/admin/logs & Console Stream',
      parameter: 'Server logger payload',
      what: 'Security audit of the logging facility revealed raw passwords, session keys, and unmasked credit card numbers with CVVs printed directly to the system log output.',
      where: 'Component: StoreService.addLog & Authentication / Checkout event interceptors',
      why: 'Event logging calls pass unmodified user request bodies directly into string templates without applying field redaction policies.',
      impact: 'Any internal staff member, support contractor, or compromise of the logging pipeline (e.g., Elasticsearch, Datadog) results in widespread credential and PCI-DSS data compromise.',
      evidence: "[AUTH_CONTROLLER] User authentication success: alice@secureshop.local | RAW_PASSWORD_DUMP: \"alice_password123\"\n[PAYMENT_GATEWAY] Processed checkout. Captured card: \"4242-8891-2309-4242\", CVV=\"391\"",
      remediationCode: `// BEFORE (Raw Sensitive Logging):
logger.info(\`User login: \${user.email} with password: \${password}\`);

// AFTER (Sanitized & Redacted Audit Log):
function maskCard(card) { return '•••• •••• •••• ' + card.slice(-4); }
logger.info({
  event: 'AUTH_SUCCESS',
  userId: user.id,
  timestamp: new Date().toISOString()
  // Sensitive parameters omitted
});`,
      isPatched: false
    });
  }

  const highCount = alerts.filter(a => a.risk === 'High').length;
  const mediumCount = alerts.filter(a => a.risk === 'Medium').length;
  const lowCount = alerts.filter(a => a.risk === 'Low').length;
  const infoCount = alerts.filter(a => a.risk === 'Informational').length;

  return {
    scanId: `ZAP-${Date.now().toString().slice(-6)}`,
    scanDate: new Date().toLocaleString(),
    targetUrl: 'http://localhost:3000',
    zapVersion: '2.15.0',
    scanType: 'Spider + Active DAST Scan',
    durationSeconds: 14.8,
    urlsCrawled: CRAWLED_URLS,
    totalAlerts: alerts.length,
    highCount,
    mediumCount,
    lowCount,
    infoCount,
    alerts,
    findings
  };
}
