import { Product, User, Order, LogEntry, VulnerabilityConfig, SecurityFinding } from '../types';
import { INITIAL_PRODUCTS, INITIAL_USERS, INITIAL_ORDERS, INITIAL_LOGS, OUTDATED_DEPENDENCY_DOC } from '../data/mockData';

// Initial default configuration: ALL VULNERABILITIES ACTIVE (Lab Mode)
export const DEFAULT_VULNERABILITY_CONFIG: VulnerabilityConfig = {
  a01_broken_access: true,
  a03_injection_sqli: true,
  a03_injection_xss: true,
  a05_security_misconfig: true,
  a06_outdated_component: true,
  a07_auth_session_weakness: true,
  a09_logging_failure: true
};

class StoreService {
  private products: Product[] = [...INITIAL_PRODUCTS];
  private users: User[] = [...INITIAL_USERS];
  private orders: Order[] = [...INITIAL_ORDERS];
  private logs: LogEntry[] = [...INITIAL_LOGS];
  private nextSessionId = 1003;
  private pollutedPrototypeProps: Record<string, any> = {};

  // Execute Search with SQL Injection simulation
  public searchProducts(query: string, category: string, config: VulnerabilityConfig): {
    products: Product[];
    executedQuery: string;
    isVulnerableHit: boolean;
    explanation?: string;
  } {
    const trimmed = query.trim();

    if (config.a03_injection_sqli) {
      // VULNERABLE MODE: String concatenation SQL query
      const rawSql = `SELECT * FROM products WHERE isRestricted = 0 AND (name LIKE '%${query}%' OR description LIKE '%${query}%')`;

      // Check for SQL Injection patterns like:
      // ' OR 1=1 --
      // ' OR '1'='1
      // ' UNION SELECT ...
      // admin' --
      const sqliPattern = /('|--|#|\/\*|\bOR\b\s+['\d\w]+=['\d\w]+|\bOR\b\s+1=1|\bUNION\b\s+\bSELECT\b)/i;

      if (sqliPattern.test(trimmed)) {
        // SQL Injection triggered! Returns ALL records including RESTRICTED internal products
        this.addLog(
          'WARN',
          'SQL_ENGINE',
          `[SQLi EXPLOIT DETECTED] Raw SQL query unescaped: "${rawSql}". Evaluation returned unrestricted table dump.`
        );

        return {
          products: [...this.products], // Leaks all items including restricted
          executedQuery: rawSql,
          isVulnerableHit: true,
          explanation: 'SQL Injection Succeeded: Tautology bypass (\' OR 1=1 --) overrode the `isRestricted = 0` constraint, dumping confidential diagnostic tools!'
        };
      }

      // Normal vulnerable query execution
      const filtered = this.products.filter(p => {
        if (p.isRestricted) return false;
        if (category && category !== 'All' && p.category !== category) return false;
        if (!trimmed) return true;
        return p.name.toLowerCase().includes(trimmed.toLowerCase()) ||
               p.description.toLowerCase().includes(trimmed.toLowerCase());
      });

      return {
        products: filtered,
        executedQuery: rawSql,
        isVulnerableHit: false
      };
    } else {
      // SECURE MODE: Parameterized prepared statement
      const preparedSql = `SELECT * FROM products WHERE isRestricted = 0 AND (name ILIKE $1 OR description ILIKE $1)`;
      
      const filtered = this.products.filter(p => {
        if (p.isRestricted) return false;
        if (category && category !== 'All' && p.category !== category) return false;
        if (!trimmed) return true;
        return p.name.toLowerCase().includes(trimmed.toLowerCase()) ||
               p.description.toLowerCase().includes(trimmed.toLowerCase());
      });

      return {
        products: filtered,
        executedQuery: `${preparedSql} -- params: ["%${trimmed.replace(/'/g, "''")}%"] (SANITIZED)`,
        isVulnerableHit: false,
        explanation: 'Secure Parameterized Query: Input treated strictly as literal data payload. Metacharacters like single-quotes are automatically neutralized.'
      };
    }
  }

  // User Authentication
  public authenticate(emailOrPayload: string, password: string, config: VulnerabilityConfig): {
    success: boolean;
    user?: User;
    message: string;
    token?: string;
    executedQuery: string;
    isSqliBypass?: boolean;
  } {
    if (config.a03_injection_sqli) {
      // VULNERABLE SQL INJECTION LOGIN CHECK
      const rawSql = `SELECT * FROM users WHERE email = '${emailOrPayload}' AND password = '${password}' LIMIT 1`;
      
      // Check for SQLi auth bypass: admin' -- or ' OR 1=1 --
      if (emailOrPayload.includes("'--") || emailOrPayload.includes("' --") || emailOrPayload.toLowerCase().includes("' or 1=1") || emailOrPayload.toLowerCase().includes("' or '1'='1")) {
        const targetAdmin = this.users.find(u => u.role === 'admin') || this.users[0];
        const token = config.a07_auth_session_weakness
          ? `SEC_SESSION_0001`
          : `auth_sec_${crypto.randomUUID()}`;

        this.addLog(
          'SECURITY',
          'AUTH_ENGINE',
          config.a09_logging_failure
            ? `[AUTH BYPASS] SQLi exploited on email="${emailOrPayload}" with pass="${password}". Elevated to user "${targetAdmin.email}" (ADMIN). Token: ${token}`
            : `Authentication bypass detected on query. Incident audited.`
        );

        return {
          success: true,
          user: targetAdmin,
          token,
          executedQuery: rawSql,
          isSqliBypass: true,
          message: 'Authenticated via SQL Injection tautology bypass!'
        };
      }

      const found = this.users.find(u => u.email.toLowerCase() === emailOrPayload.toLowerCase() && u.passwordHash === password);
      if (found) {
        const token = config.a07_auth_session_weakness
          ? `SEC_SESSION_${this.nextSessionId++}`
          : `sec_token_${crypto.randomUUID()}`;

        this.addLog(
          'INFO',
          'AUTH_SERVICE',
          config.a09_logging_failure
            ? `Login success for ${found.email} with password: "${password}". Issued sequential session: ${token}`
            : `Login success for ${found.email}. Session token issued.`
        );

        return {
          success: true,
          user: found,
          token,
          executedQuery: rawSql,
          message: 'Login successful'
        };
      }

      this.addLog(
        'WARN',
        'AUTH_SERVICE',
        config.a09_logging_failure
          ? `Failed login attempt for email="${emailOrPayload}" password="${password}"`
          : `Failed login attempt recorded.`
      );

      return {
        success: false,
        message: 'Invalid email or password',
        executedQuery: rawSql
      };
    } else {
      // SECURE AUTHENTICATION: Prepared statement + constant-time comparison
      const preparedSql = `SELECT * FROM users WHERE email = $1 LIMIT 1`;
      const found = this.users.find(u => u.email.toLowerCase() === emailOrPayload.toLowerCase() && u.passwordHash === password);
      
      if (found) {
        const token = `token_secure_${crypto.randomUUID().replace(/-/g, '')}`;
        this.addLog('INFO', 'AUTH_SERVICE', `User authenticated successfully: ${found.email}. Safe audit logged.`);
        return {
          success: true,
          user: found,
          token,
          executedQuery: `${preparedSql} (Prepared Statement)`,
          message: 'Login successful'
        };
      }

      return {
        success: false,
        message: 'Invalid credentials provided',
        executedQuery: `${preparedSql} (Prepared Statement)`
      };
    }
  }

  // User Profile Access (IDOR Vulnerability A01)
  public getUserProfile(targetUserId: string, currentSessionUser: User | null, config: VulnerabilityConfig): {
    user?: User;
    status: number;
    message: string;
    isIdorVulnerability: boolean;
  } {
    const target = this.users.find(u => u.id === targetUserId);
    if (!target) {
      return { status: 404, message: 'User not found', isIdorVulnerability: false };
    }

    if (config.a01_broken_access) {
      // VULNERABLE IDOR: Returns whatever user is queried by ID without checking if current user is owner or admin!
      const isIdor = currentSessionUser?.id !== targetUserId && currentSessionUser?.role !== 'admin';
      if (isIdor) {
        this.addLog(
          'WARN',
          'ACCESS_CONTROLLER',
          `[IDOR EXPLOIT] User ${currentSessionUser?.email || 'Anonymous'} accessed private profile of ${target.email} (ID: ${target.id}) via URL query parameter tampering.`
        );
      }
      return {
        user: target,
        status: 200,
        message: isIdor ? 'IDOR Access Succeeded: Retrieved other user account data without authorization!' : 'Profile retrieved',
        isIdorVulnerability: isIdor
      };
    } else {
      // SECURE MODE: Strict access verification
      if (!currentSessionUser) {
        return { status: 401, message: '401 Unauthorized: Authentication required to view user profile.', isIdorVulnerability: false };
      }
      if (currentSessionUser.id !== targetUserId && currentSessionUser.role !== 'admin') {
        this.addLog('SECURITY', 'ACCESS_CONTROLLER', `Access Denied: User ${currentSessionUser.email} attempted unauthorized access to user profile ${targetUserId}`);
        return {
          status: 403,
          message: '403 Forbidden: You do not have permission to access another user\'s profile records.',
          isIdorVulnerability: false
        };
      }
      return {
        user: target,
        status: 200,
        message: 'Profile retrieved securely',
        isIdorVulnerability: false
      };
    }
  }

  // Order Retrieval (IDOR Vulnerability A01)
  public getOrderById(orderId: string, currentSessionUser: User | null, config: VulnerabilityConfig): {
    order?: Order;
    status: number;
    message: string;
    isIdorVulnerability: boolean;
  } {
    const target = this.orders.find(o => o.id.toLowerCase() === orderId.toLowerCase());
    if (!target) {
      return { status: 404, message: 'Order not found', isIdorVulnerability: false };
    }

    if (config.a01_broken_access) {
      // VULNERABLE: Direct object reference without verifying ownership
      const isIdor = currentSessionUser?.id !== target.userId && currentSessionUser?.role !== 'admin';
      if (isIdor) {
        this.addLog(
          'WARN',
          'ORDER_API',
          `[IDOR EXPLOIT] Session user ${currentSessionUser?.email || 'Guest'} retrieved Order ${orderId} belonging to ${target.customerEmail}.`
        );
      }
      return {
        order: target,
        status: 200,
        message: isIdor ? 'IDOR Succeeded: Accessible without ownership verification' : 'Order fetched',
        isIdorVulnerability: isIdor
      };
    } else {
      // SECURE
      if (!currentSessionUser) {
        return { status: 401, message: '401 Unauthorized: Login required', isIdorVulnerability: false };
      }
      if (currentSessionUser.id !== target.userId && currentSessionUser.role !== 'admin') {
        return {
          status: 403,
          message: '403 Forbidden: You are not authorized to view this order transaction.',
          isIdorVulnerability: false
        };
      }
      return {
        order: target,
        status: 200,
        message: 'Order retrieved',
        isIdorVulnerability: false
      };
    }
  }

  // Outdated Component - Prototype Pollution Simulation (A06 lodash 4.17.15)
  public simulatePrototypePollution(payloadJson: string, config: VulnerabilityConfig): {
    success: boolean;
    outputMessage: string;
    pollutedProperties: Record<string, any>;
    rawDump: string;
  } {
    try {
      const parsed = JSON.parse(payloadJson);
      if (config.a06_outdated_component) {
        // VULNERABLE lodash 4.17.15 behavior:
        // Allows keys '__proto__', 'constructor.prototype'
        if (parsed.__proto__) {
          Object.assign(this.pollutedPrototypeProps, parsed.__proto__);
          this.addLog(
            'SECURITY',
            'LODASH_ZIPOBJECTDEEP',
            `[CVE-2020-8203 TRIGGERED] Prototype polluted with keys: ${Object.keys(parsed.__proto__).join(', ')}`
          );
          return {
            success: true,
            outputMessage: 'Prototype Pollution Successful! `Object.prototype` now contains injected malicious properties. Global authorization logic can now be subverted.',
            pollutedProperties: { ...this.pollutedPrototypeProps },
            rawDump: JSON.stringify(this.pollutedPrototypeProps, null, 2)
          };
        }
        return {
          success: false,
          outputMessage: 'Payload did not contain __proto__ property. Try: {"__proto__": {"isAdmin": true, "bypassMFA": true}}',
          pollutedProperties: { ...this.pollutedPrototypeProps },
          rawDump: '{}'
        };
      } else {
        // SECURED: lodash 4.17.21 / Sanitizer
        if (payloadJson.includes('__proto__') || payloadJson.includes('constructor') || payloadJson.includes('prototype')) {
          this.addLog(
            'SECURITY',
            'INPUT_VALIDATOR',
            'Blocked prototype pollution attempt. Dangerous key rejected.'
          );
          return {
            success: false,
            outputMessage: 'REMEDIATED (lodash 4.17.21): Dangerous property key (__proto__ / constructor) filtered and discarded safely.',
            pollutedProperties: {},
            rawDump: 'Clean: No prototype alteration.'
          };
        }
        return {
          success: true,
          outputMessage: 'Safe JSON payload parsed without modification.',
          pollutedProperties: {},
          rawDump: JSON.stringify(parsed, null, 2)
        };
      }
    } catch (e: any) {
      return {
        success: false,
        outputMessage: `JSON Parse error: ${e.message}`,
        pollutedProperties: {},
        rawDump: ''
      };
    }
  }

  // Security Misconfiguration Endpoint (/api/debug/env)
  public getDebugEndpoint(config: VulnerabilityConfig): {
    status: number;
    data: any;
    headers: Record<string, string>;
  } {
    if (config.a05_security_misconfig) {
      return {
        status: 200,
        headers: {
          'X-Powered-By': 'Express 4.21.2',
          'Server': 'Apache/2.4.41 (Ubuntu)'
          // Missing: Content-Security-Policy, X-Content-Type-Options, Strict-Transport-Security, X-Frame-Options
        },
        data: {
          status: 'DEBUG_MODE_ENABLED',
          timestamp: new Date().toISOString(),
          environment: 'production',
          internalConfig: {
            DB_HOST: '10.0.4.12:5432',
            DB_USER: 'secureshop_db_admin',
            DB_PASSWORD: 'SuperSecretDatabasePass2026!',
            JWT_SECRET_KEY: 'secureshop-legacy-jwt-secret-key-do-not-share',
            PAYMENT_API_KEY: 'sk_live_9942a8b38df920aa1123ce',
            INTERNAL_MASTER_KEY: 'MASTER_DEV_OVERRIDE_ENABLED'
          },
          stackDump: 'Trace: Debug info leaked at ExpressController.handleDebug (/app/src/controllers/debug.js:42:11)'
        }
      };
    } else {
      return {
        status: 403,
        headers: {
          'Content-Security-Policy': "default-src 'self'; script-src 'self'; object-src 'none';",
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
          'X-XSS-Protection': '1; mode=block'
        },
        data: {
          error: '403 Forbidden',
          message: 'Endpoint disabled in production environment.'
        }
      };
    }
  }

  // Admin Access Verification
  public checkAdminAccess(user: User | null, config: VulnerabilityConfig): {
    hasAccess: boolean;
    reason: string;
  } {
    // If Prototype was polluted with isAdmin
    if (this.pollutedPrototypeProps.isAdmin || this.pollutedPrototypeProps.role === 'admin') {
      return {
        hasAccess: true,
        reason: 'Privilege Escalation: Granted via Prototype Pollution (Object.prototype.isAdmin = true)!'
      };
    }

    if (config.a01_broken_access) {
      // In vulnerable mode, anyone can access admin or unauthenticated requests are permitted if path /admin is hit
      return {
        hasAccess: true,
        reason: 'Broken Access Control: Admin dashboard accessed without role authorization check!'
      };
    }

    // In secure mode, must be an authenticated user with role === 'admin'
    if (user && user.role === 'admin') {
      return {
        hasAccess: true,
        reason: 'Authorized administrator credentials verified.'
      };
    }

    return {
      hasAccess: false,
      reason: 'Access Denied: Requires Administrator role.'
    };
  }

  // Add Product (Admin)
  public addProduct(product: Omit<Product, 'id' | 'rating' | 'reviewsCount'>): Product {
    const newProduct: Product = {
      ...product,
      id: `prod-${Date.now().toString().slice(-4)}`,
      rating: 5.0,
      reviewsCount: 1
    };
    this.products.unshift(newProduct);
    this.addLog('INFO', 'INVENTORY', `Admin added new product: ${newProduct.name} (${newProduct.sku})`);
    return newProduct;
  }

  // Delete Product (Admin)
  public deleteProduct(id: string): boolean {
    const initialLen = this.products.length;
    this.products = this.products.filter(p => p.id !== id);
    const deleted = this.products.length < initialLen;
    if (deleted) {
      this.addLog('INFO', 'INVENTORY', `Admin removed product ID: ${id}`);
    }
    return deleted;
  }

  // Register New User
  public registerUser(name: string, email: string, password: string, config: VulnerabilityConfig): User {
    const newUser: User = {
      id: `usr-${Date.now().toString().slice(-4)}`,
      name,
      email,
      role: 'customer',
      phone: '+1 (555) 000-0000',
      address: 'Customer Address Pending',
      creditCardMasked: '•••• •••• •••• 9999',
      creditCardRaw: config.a07_auth_session_weakness ? '4929-1122-3344-9999 (CVV 123)' : undefined,
      passwordHash: config.a07_auth_session_weakness ? password : `$2b$12$secureBcryptHash_${Date.now()}`,
      sessionToken: config.a07_auth_session_weakness ? `SEC_SESSION_${this.nextSessionId++}` : `sec_token_${crypto.randomUUID()}`,
      createdAt: new Date().toISOString().split('T')[0]
    };
    this.users.push(newUser);

    this.addLog(
      'INFO',
      'USER_REGISTRATION',
      config.a09_logging_failure
        ? `New user registered: ${email} with plaintext password: "${password}"`
        : `New user account registered securely: ${email}`
    );

    return newUser;
  }

  // Create Order
  public createOrder(user: User, items: { product: Product; quantity: number }[], address: string, ccNumber: string, config: VulnerabilityConfig): Order {
    const total = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const newOrder: Order = {
      id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      userId: user.id,
      customerName: user.name,
      customerEmail: user.email,
      items: items.map(i => ({
        productId: i.product.id,
        productName: i.product.name,
        price: i.product.price,
        quantity: i.quantity,
        image: i.product.image
      })),
      total: Math.round(total * 100) / 100,
      status: 'Processing',
      shippingAddress: address,
      paymentMethod: `Credit Card ending ${ccNumber.slice(-4) || '4242'}`,
      createdAt: new Date().toISOString().split('T')[0]
    };

    this.orders.unshift(newOrder);

    this.addLog(
      'INFO',
      'ORDER_CHECKOUT',
      config.a09_logging_failure
        ? `Order ${newOrder.id} generated for ${user.email}. Raw payment details: "${ccNumber}"`
        : `Order ${newOrder.id} placed successfully for user ${user.id}. Total: $${newOrder.total}`
    );

    return newOrder;
  }

  // Add Log Entry
  public addLog(level: 'INFO' | 'WARN' | 'ERROR' | 'SECURITY', source: string, message: string, sensitive = false): LogEntry {
    const entry: LogEntry = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      level,
      source,
      message,
      containsSensitiveData: sensitive
    };
    this.logs.unshift(entry);
    return entry;
  }

  // Getters
  public getProducts(): Product[] { return this.products; }
  public getUsers(): User[] { return this.users; }
  public getOrders(): Order[] { return this.orders; }
  public getLogs(): LogEntry[] { return this.logs; }
  public getPollutedProps(): Record<string, any> { return this.pollutedPrototypeProps; }
  public resetPrototype(): void { this.pollutedPrototypeProps = {}; }
  public getOutdatedDoc(): typeof OUTDATED_DEPENDENCY_DOC { return OUTDATED_DEPENDENCY_DOC; }

  // Reset Data to Default
  public resetToDefault(): void {
    this.products = [...INITIAL_PRODUCTS];
    this.users = [...INITIAL_USERS];
    this.orders = [...INITIAL_ORDERS];
    this.logs = [...INITIAL_LOGS];
    this.pollutedPrototypeProps = {};
  }
}

export const storeService = new StoreService();
