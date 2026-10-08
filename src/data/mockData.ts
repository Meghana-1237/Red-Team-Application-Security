import { Product, User, Order, OutdatedComponentDoc, LogEntry } from '../types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-001',
    sku: 'SEC-KEY-001',
    name: 'Hardware Security Key (FIDO2 / U2F)',
    category: 'Authentication',
    price: 49.99,
    rating: 4.8,
    reviewsCount: 142,
    image: '/src/assets/images/security_hardware_key_1791436111927.jpg',
    description: 'NFC and USB-C dual-protocol multi-factor hardware authenticator designed to eliminate phishing and credential stuffing attacks.',
    stock: 85,
    isRestricted: false
  },
  {
    id: 'prod-002',
    sku: 'SEC-SSD-002',
    name: 'Encrypted NVMe SSD 1TB (XTS-AES 256)',
    category: 'Storage',
    price: 189.50,
    rating: 4.9,
    reviewsCount: 88,
    image: '/src/assets/images/encrypted_ssd_drive_1791436125218.jpg',
    description: 'Hardware-encrypted solid state drive with dedicated cryptographic co-processor and real-time biometric access verification.',
    stock: 42,
    isRestricted: false
  },
  {
    id: 'prod-003',
    sku: 'SEC-RT-003',
    name: 'Hardened Micro-Router with WireGuard',
    category: 'Networking',
    price: 129.00,
    rating: 4.7,
    reviewsCount: 64,
    image: '/src/assets/images/privacy_router_device_1791436148058.jpg',
    description: 'Portable privacy router featuring pre-installed OpenWrt, kill-switch DNS leaks protection, and physical toggle switches.',
    stock: 19,
    isRestricted: false
  },
  {
    id: 'prod-004',
    sku: 'SEC-CAM-004',
    name: 'Biometric Web-Camera with Physical Shutter',
    category: 'Peripherals',
    price: 79.95,
    rating: 4.6,
    reviewsCount: 110,
    image: '/src/assets/images/security_hardware_key_1791436111927.jpg',
    description: '4K Ultra-HD camera with infrared facial recognition sensors and an electro-mechanical privacy shutter.',
    stock: 55,
    isRestricted: false
  },
  {
    id: 'prod-005',
    sku: 'SEC-SCR-005',
    name: 'Micro-Louver Polarized Privacy Filter (16")',
    category: 'Privacy',
    price: 44.00,
    rating: 4.5,
    reviewsCount: 93,
    image: '/src/assets/images/privacy_router_device_1791436148058.jpg',
    description: 'Optical screen shield blocking lateral vision beyond 30 degrees while reducing blue light and glare.',
    stock: 120,
    isRestricted: false
  },
  {
    id: 'prod-006',
    sku: 'SEC-BAG-006',
    name: 'Faraday Shielding Signal Blocker Bag',
    category: 'Privacy',
    price: 34.50,
    rating: 4.7,
    reviewsCount: 204,
    image: '/src/assets/images/encrypted_ssd_drive_1791436125218.jpg',
    description: 'Military-grade dual-weave RF attenuation pouch blocking cellular, WiFi, GPS, RFID, and Bluetooth signals.',
    stock: 67,
    isRestricted: false
  },
  // RESTRICTED INTERNAL ITEM (Normally excluded from public catalog: `WHERE isRestricted = 0`):
  {
    id: 'prod-999-RESTRICTED',
    sku: 'INTERNAL-CONFIDENTIAL-099',
    name: '[RESTRICTED] Hardware Firmware Flasher & Master Key Kit',
    category: 'Internal Diagnostics',
    price: 999.00,
    rating: 5.0,
    reviewsCount: 3,
    image: '/src/assets/images/privacy_router_device_1791436148058.jpg',
    description: 'INTERNAL SECURESHOP TOOL: Diagnostic debug adapter with master crypto keys. RESTRICTED TO CERTIFIED SECURITY LAB PERSONNEL ONLY.',
    stock: 3,
    isRestricted: true
  }
];

export const INITIAL_USERS: User[] = [
  {
    id: 'usr-101',
    name: 'Alice Smith',
    email: 'alice@secureshop.local',
    role: 'customer',
    phone: '+1 (555) 019-2834',
    address: '42 Pine Street, Apt 3B, Seattle, WA 98101',
    creditCardMasked: '•••• •••• •••• 4242',
    creditCardRaw: '4242-8891-2309-4242 (EXP 11/28 CVV 391)',
    passwordHash: 'alice_password123', // Plaintext in vulnerable mode
    sessionToken: 'SEC_SESSION_1001', // Predictable sequential token in vulnerable mode
    createdAt: '2026-08-14'
  },
  {
    id: 'usr-102',
    name: 'Bob Taylor',
    email: 'bob@secureshop.local',
    role: 'customer',
    phone: '+1 (555) 018-9921',
    address: '108 Evergreen Terrace, Portland, OR 97201',
    creditCardMasked: '•••• •••• •••• 9812',
    creditCardRaw: '5105-1029-4481-9812 (EXP 04/27 CVV 812)',
    passwordHash: 'b0b_secret_pass',
    sessionToken: 'SEC_SESSION_1002',
    createdAt: '2026-09-02'
  },
  {
    id: 'usr-001',
    name: 'Marcus Vance (System Administrator)',
    email: 'admin@secureshop.local',
    role: 'admin',
    phone: '+1 (555) 010-0001',
    address: 'SecureShop HQ, 100 Cyber Way, Suite 400, San Francisco, CA',
    creditCardMasked: '•••• •••• •••• 1111',
    creditCardRaw: '4111-1111-1111-1111 (EXP 01/30 CVV 999)',
    passwordHash: 'admin2026!',
    sessionToken: 'SEC_SESSION_0001',
    createdAt: '2026-01-10'
  },
  {
    id: 'usr-777',
    name: 'Evelyn Reed (Chief Information Officer)',
    email: 'evelyn.cio@secureshop.local',
    role: 'customer',
    phone: '+1 (555) 014-7777',
    address: 'Penthouse 12, Embarcadero Towers, San Francisco, CA',
    creditCardMasked: '•••• •••• •••• 8888',
    creditCardRaw: '3782-8224-6310-8888 (AMEX EXP 12/29 CVV 4410)',
    passwordHash: 'evelyn_executive_topsecret',
    sessionToken: 'SEC_SESSION_7777',
    createdAt: '2026-02-15'
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ORD-1001',
    userId: 'usr-101',
    customerName: 'Alice Smith',
    customerEmail: 'alice@secureshop.local',
    items: [
      {
        productId: 'prod-001',
        productName: 'Hardware Security Key (FIDO2 / U2F)',
        price: 49.99,
        quantity: 2,
        image: '/src/assets/images/security_hardware_key_1791436111927.jpg'
      }
    ],
    total: 99.98,
    status: 'Delivered',
    shippingAddress: '42 Pine Street, Apt 3B, Seattle, WA 98101',
    paymentMethod: 'Visa ending 4242',
    createdAt: '2026-09-18'
  },
  {
    id: 'ORD-1002',
    userId: 'usr-102',
    customerName: 'Bob Taylor',
    customerEmail: 'bob@secureshop.local',
    items: [
      {
        productId: 'prod-003',
        productName: 'Hardened Micro-Router with WireGuard',
        price: 129.00,
        quantity: 1,
        image: '/src/assets/images/privacy_router_device_1791436148058.jpg'
      }
    ],
    total: 129.00,
    status: 'Shipped',
    shippingAddress: '108 Evergreen Terrace, Portland, OR 97201',
    paymentMethod: 'Mastercard ending 9812',
    createdAt: '2026-09-24'
  },
  {
    id: 'ORD-7777',
    userId: 'usr-777',
    customerName: 'Evelyn Reed (CIO)',
    customerEmail: 'evelyn.cio@secureshop.local',
    items: [
      {
        productId: 'prod-002',
        productName: 'Encrypted NVMe SSD 1TB (XTS-AES 256)',
        price: 189.50,
        quantity: 3,
        image: '/src/assets/images/encrypted_ssd_drive_1791436125218.jpg'
      },
      {
        productId: 'prod-999-RESTRICTED',
        productName: '[RESTRICTED] Hardware Firmware Flasher & Master Key Kit',
        price: 999.00,
        quantity: 1,
        image: '/src/assets/images/privacy_router_device_1791436148058.jpg'
      }
    ],
    total: 1567.50,
    status: 'Processing',
    shippingAddress: 'Penthouse 12, Embarcadero Towers, San Francisco, CA (CONFIDENTIAL COURIER)',
    paymentMethod: 'Corporate AMEX ending 8888',
    createdAt: '2026-10-05'
  }
];

export const OUTDATED_DEPENDENCY_DOC: OutdatedComponentDoc = {
  name: 'lodash',
  installedVersion: '4.17.15',
  latestVersion: '4.17.21',
  cve: 'CVE-2020-8203',
  cvssScore: 7.4,
  severity: 'High',
  vulnerabilityType: 'Prototype Pollution via lodash.zipObjectDeep / lodash.set',
  riskDescription: 'Versions of lodash prior to 4.17.19 are vulnerable to Prototype Pollution. An attacker can inject malicious properties into Object.prototype via improper object path parsing (e.g., {"__proto__": {"isAdmin": true}}), causing privilege escalation, application state tampering, or denial of service across the entire Node.js runtime.',
  pocPayload: '{"__proto__": {"role": "admin", "bypassAudit": true}}',
  remediationSteps: [
    'Update dependency in package.json: "lodash": "^4.17.21"',
    'Execute "npm update lodash" or "npm audit fix"',
    'Sanitize incoming JSON keys to disallow __proto__, constructor, and prototype properties.',
    'Use Object.create(null) for unpollutable dictionaries.'
  ]
};

export const INITIAL_LOGS: LogEntry[] = [
  {
    id: 'log-001',
    timestamp: '2026-10-07 20:14:02',
    level: 'INFO',
    source: 'HTTP_SERVER',
    message: 'Express application worker initialized on port 3000. Environment: production (NODE_ENV unset)'
  },
  {
    id: 'log-002',
    timestamp: '2026-10-07 20:15:33',
    level: 'SECURITY',
    source: 'AUTH_CONTROLLER',
    message: 'User authentication success: alice@secureshop.local | RAW_PASSWORD_DUMP: "alice_password123" | SESSION_ISSUED: SEC_SESSION_1001',
    containsSensitiveData: true
  },
  {
    id: 'log-003',
    timestamp: '2026-10-07 20:18:11',
    level: 'INFO',
    source: 'CART_SERVICE',
    message: 'Item prod-001 added to cart for user usr-101. Quantity: 2'
  },
  {
    id: 'log-004',
    timestamp: '2026-10-07 20:20:45',
    level: 'SECURITY',
    source: 'PAYMENT_GATEWAY',
    message: 'Processed checkout for ORD-1001. Captured card details: Card="4242-8891-2309-4242", Exp="11/28", CVV="391"',
    containsSensitiveData: true
  },
  {
    id: 'log-005',
    timestamp: '2026-10-07 20:22:19',
    level: 'WARN',
    source: 'SQL_PARSER',
    message: 'Executed raw search query string: "SELECT * FROM products WHERE isRestricted = 0 AND name LIKE \'%key%\'"'
  }
];
