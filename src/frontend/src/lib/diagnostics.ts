/**
 * Advanced runtime diagnostics and health check system
 * Detects and logs component initialization failures throughout the frontend
 */

interface DiagnosticResult {
  component: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  timestamp: string;
  details?: any;
}

const diagnosticResults: DiagnosticResult[] = [];

/**
 * Log a diagnostic result
 */
function logDiagnostic(result: DiagnosticResult) {
  diagnosticResults.push(result);
  
  const emoji = result.status === 'success' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
  const logFn = result.status === 'error' ? console.error : result.status === 'warning' ? console.warn : console.log;
  
  logFn(`${emoji} [${result.component}] ${result.message}`, result.details || '');
}

/**
 * Check if a DOM element exists
 */
function checkDOMElement(selector: string, name: string): boolean {
  try {
    const element = document.querySelector(selector);
    if (element) {
      logDiagnostic({
        component: 'DOM',
        status: 'success',
        message: `${name} element found`,
        timestamp: new Date().toISOString(),
        details: { selector, tagName: element.tagName },
      });
      return true;
    } else {
      logDiagnostic({
        component: 'DOM',
        status: 'error',
        message: `${name} element not found (selector: ${selector})`,
        timestamp: new Date().toISOString(),
      });
      return false;
    }
  } catch (error) {
    logDiagnostic({
      component: 'DOM',
      status: 'error',
      message: `Error checking ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      timestamp: new Date().toISOString(),
      details: { error },
    });
    return false;
  }
}

/**
 * Check if React has rendered
 */
function checkReactRendering(): boolean {
  try {
    const root = document.getElementById('root');
    if (!root) {
      logDiagnostic({
        component: 'React',
        status: 'error',
        message: 'Root element not found',
        timestamp: new Date().toISOString(),
      });
      return false;
    }

    const hasChildren = root.children.length > 0;
    const hasContent = root.innerHTML.length > 0;
    
    if (hasChildren && hasContent) {
      logDiagnostic({
        component: 'React',
        status: 'success',
        message: `React rendered successfully`,
        timestamp: new Date().toISOString(),
        details: { 
          childCount: root.children.length,
          contentLength: root.innerHTML.length,
        },
      });
      return true;
    } else {
      logDiagnostic({
        component: 'React',
        status: 'error',
        message: 'React root is empty - rendering may have failed',
        timestamp: new Date().toISOString(),
        details: { 
          hasChildren,
          hasContent,
          innerHTML: root.innerHTML.substring(0, 100),
        },
      });
      return false;
    }
  } catch (error) {
    logDiagnostic({
      component: 'React',
      status: 'error',
      message: `Error checking React rendering: ${error instanceof Error ? error.message : 'Unknown error'}`,
      timestamp: new Date().toISOString(),
      details: { error },
    });
    return false;
  }
}

/**
 * Check critical components
 */
function checkCriticalComponents(): void {
  const components = [
    { selector: 'header', name: 'Header' },
    { selector: 'main', name: 'Main content' },
    { selector: 'footer', name: 'Footer' },
  ];

  components.forEach(({ selector, name }) => {
    checkDOMElement(selector, name);
  });
}

/**
 * Check for JavaScript errors in console
 */
function checkConsoleErrors(): void {
  logDiagnostic({
    component: 'Console',
    status: 'success',
    message: 'Error logging system active',
    timestamp: new Date().toISOString(),
  });
}

/**
 * Check browser compatibility
 */
function checkBrowserCompatibility(): void {
  const features = [
    { name: 'localStorage', check: () => typeof localStorage !== 'undefined' && localStorage !== null },
    { name: 'sessionStorage', check: () => typeof sessionStorage !== 'undefined' && sessionStorage !== null },
    { name: 'fetch', check: () => typeof fetch !== 'undefined' },
    { name: 'Promise', check: () => typeof Promise !== 'undefined' },
    { name: 'WebAssembly', check: () => typeof WebAssembly !== 'undefined' },
    { name: 'BigInt', check: () => typeof BigInt !== 'undefined' },
    { name: 'Proxy', check: () => typeof Proxy !== 'undefined' },
  ];

  features.forEach(({ name, check }) => {
    try {
      if (check()) {
        logDiagnostic({
          component: 'Browser',
          status: 'success',
          message: `${name} supported`,
          timestamp: new Date().toISOString(),
        });
      } else {
        logDiagnostic({
          component: 'Browser',
          status: 'error',
          message: `${name} not supported`,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      logDiagnostic({
        component: 'Browser',
        status: 'error',
        message: `Error checking ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString(),
        details: { error },
      });
    }
  });
}

/**
 * Check network connectivity
 */
async function checkNetworkConnectivity(): Promise<void> {
  try {
    if (!navigator.onLine) {
      logDiagnostic({
        component: 'Network',
        status: 'warning',
        message: 'Browser reports offline status',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    logDiagnostic({
      component: 'Network',
      status: 'success',
      message: 'Browser reports online status',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logDiagnostic({
      component: 'Network',
      status: 'error',
      message: `Error checking network: ${error instanceof Error ? error.message : 'Unknown error'}`,
      timestamp: new Date().toISOString(),
      details: { error },
    });
  }
}

/**
 * Check memory usage (if available)
 */
function checkMemoryUsage(): void {
  try {
    if ('memory' in performance && (performance as any).memory) {
      const memory = (performance as any).memory;
      const usedMB = Math.round(memory.usedJSHeapSize / 1048576);
      const totalMB = Math.round(memory.totalJSHeapSize / 1048576);
      const limitMB = Math.round(memory.jsHeapSizeLimit / 1048576);
      
      logDiagnostic({
        component: 'Memory',
        status: usedMB > limitMB * 0.9 ? 'warning' : 'success',
        message: `Memory usage: ${usedMB}MB / ${limitMB}MB`,
        timestamp: new Date().toISOString(),
        details: { usedMB, totalMB, limitMB },
      });
    } else {
      logDiagnostic({
        component: 'Memory',
        status: 'warning',
        message: 'Memory API not available',
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    logDiagnostic({
      component: 'Memory',
      status: 'warning',
      message: 'Could not check memory usage',
      timestamp: new Date().toISOString(),
      details: { error },
    });
  }
}

/**
 * Generate diagnostic summary
 */
function generateDiagnosticSummary(): void {
  const successCount = diagnosticResults.filter(r => r.status === 'success').length;
  const warningCount = diagnosticResults.filter(r => r.status === 'warning').length;
  const errorCount = diagnosticResults.filter(r => r.status === 'error').length;
  const total = diagnosticResults.length;

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 DIAGNOSTIC SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`   Total checks: ${total}`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ⚠️  Warnings: ${warningCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  
  if (errorCount > 0) {
    console.log('\n❌ CRITICAL ISSUES DETECTED:');
    diagnosticResults
      .filter(r => r.status === 'error')
      .forEach(r => console.log(`   - [${r.component}] ${r.message}`));
  }

  if (warningCount > 0) {
    console.log('\n⚠️  WARNINGS:');
    diagnosticResults
      .filter(r => r.status === 'warning')
      .forEach(r => console.log(`   - [${r.component}] ${r.message}`));
  }

  if (errorCount === 0 && warningCount === 0) {
    console.log('\n🎉 ALL SYSTEMS OPERATIONAL!');
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

/**
 * Main startup health check function
 */
export async function startupHealthCheck(): Promise<void> {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🏥 STARTUP HEALTH CHECK');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // Check React rendering
    checkReactRendering();

    // Check critical components
    checkCriticalComponents();

    // Check browser compatibility
    checkBrowserCompatibility();

    // Check console error logging
    checkConsoleErrors();

    // Check network connectivity
    await checkNetworkConnectivity();

    // Check memory usage
    checkMemoryUsage();

    // Generate summary
    generateDiagnosticSummary();

  } catch (error) {
    console.error('❌ Health check failed:', error);
    logDiagnostic({
      component: 'HealthCheck',
      status: 'error',
      message: `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      timestamp: new Date().toISOString(),
      details: { error },
    });
  }
}

/**
 * Component initialization logger
 * Call this at the start of critical component render functions
 */
export function logComponentInit(componentName: string, details?: any): void {
  console.log(`🔧 [${componentName}] Initializing component`, details || '');
  logDiagnostic({
    component: componentName,
    status: 'success',
    message: 'Component initialization started',
    timestamp: new Date().toISOString(),
    details,
  });
}

/**
 * Component initialization success logger
 */
export function logComponentSuccess(componentName: string, details?: any): void {
  console.log(`✅ [${componentName}] Component initialized successfully`, details || '');
  logDiagnostic({
    component: componentName,
    status: 'success',
    message: 'Component initialized successfully',
    timestamp: new Date().toISOString(),
    details,
  });
}

/**
 * Component initialization error logger
 */
export function logComponentError(componentName: string, error: Error, details?: any): void {
  console.error(`❌ [${componentName}] Component initialization failed`);
  console.error('Error details:', {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    ...details,
  });
  logDiagnostic({
    component: componentName,
    status: 'error',
    message: `Component initialization failed: ${error.message}`,
    timestamp: new Date().toISOString(),
    details: { error, ...details },
  });
}

/**
 * Hook initialization logger
 */
export function logHookInit(hookName: string, details?: any): void {
  console.log(`🪝 [${hookName}] Initializing hook`, details || '');
}

/**
 * Hook error logger
 */
export function logHookError(hookName: string, error: Error, details?: any): void {
  console.error(`❌ [${hookName}] Hook error`);
  console.error('Error details:', {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    ...details,
  });
  logDiagnostic({
    component: hookName,
    status: 'error',
    message: `Hook error: ${error.message}`,
    timestamp: new Date().toISOString(),
    details: { error, ...details },
  });
}

/**
 * Get all diagnostic results
 */
export function getDiagnosticResults(): DiagnosticResult[] {
  return [...diagnosticResults];
}

/**
 * Clear diagnostic results
 */
export function clearDiagnosticResults(): void {
  diagnosticResults.length = 0;
  console.log('🧹 Diagnostic results cleared');
}
