export const PR_REVIEW_DATA = {
  label: 'GitHub PR Review',
  gestureChip: 'Triggered by Gojo crossed fingers gesture',
  diff: `@@ -12,8 +12,14 @@ function DataLoader({ userId }: Props) {
   useEffect(() => {
-    fetchUserData(userId)
-      .then(setData)
+    let cancelled = false
+    fetchUserData(userId)
+      .then(res => {
+        if (!cancelled) setData(res)
+      })
+      .catch(err => {
+        if (!cancelled) setError(err)
+      })
+    return () => { cancelled = true }
-  }, [])  // BUG: missing userId dependency
+  }, [userId])
   }`,
  findings: [
    {
      severity: 'high',
      file: 'src/components/DataLoader.tsx',
      line: 14,
      message: 'Missing `userId` in useEffect dependency array — stale closure risk.',
      suggestion: 'Add `userId` to the deps array: `}, [userId])`',
    },
    {
      severity: 'high',
      file: 'src/api/client.ts',
      line: 8,
      message: 'Parameter typed as `any` bypasses type safety.',
      suggestion: 'Replace `payload: any` with a specific interface type.',
    },
    {
      severity: 'medium',
      file: 'src/hooks/useAuth.ts',
      line: 22,
      message: 'No null check before accessing `user.profile.name` — can throw.',
      suggestion: 'Use optional chaining: `user?.profile?.name`',
    },
    {
      severity: 'medium',
      file: 'src/components/DataLoader.tsx',
      line: 19,
      message: 'Async effect has no error state — errors are silently swallowed.',
      suggestion: 'Add an `error` state and render an error boundary or message.',
    },
    {
      severity: 'medium',
      file: 'src/components/DataLoader.tsx',
      line: 12,
      message: 'No cleanup on unmount — async update may run on unmounted component.',
      suggestion: 'Return a cleanup function that cancels the in-flight request.',
    },
    {
      severity: 'low',
      file: 'src/utils/storage.ts',
      line: 4,
      message: 'Weak null check with `==` instead of `===`.',
      suggestion: 'Use strict equality `=== null || === undefined`.',
    },
  ],
  comments: [
    '**Line 14:** `useEffect` dep array is empty but closes over `userId`. Add it to deps.',
    '**Line 8 (client.ts):** Avoid `any`. Define `RequestPayload` interface.',
    '**Line 22 (useAuth):** Optional chaining prevents runtime crash on unauthenticated users.',
  ],
}

export const THREAT_MODEL_DATA = {
  label: 'Security Threat Model',
  gestureChip: 'Triggered by Sukuna two-hand seal gesture',
  summary: 'Single-page React application with a REST API backend. Users authenticate via JWT tokens. Data is fetched client-side and stored in component state. The app embeds user-supplied content and query parameters into the DOM.',
  assets: [
    'User session tokens (JWT)',
    'User profile and PII',
    'API endpoints and data responses',
    'Rendered HTML content',
  ],
  trustBoundaries: [
    'Browser ↔ CDN (static assets)',
    'Browser ↔ REST API (authenticated requests)',
    'Browser ↔ Third-party scripts (analytics)',
    'User input ↔ DOM rendering',
  ],
  entryPoints: [
    'Login form (credential submission)',
    'URL query parameters (untrusted)',
    'API response bodies (untrusted)',
    'User-generated content rendering',
    'LocalStorage read on startup',
  ],
  attackerGoals: [
    'Steal session token from localStorage',
    'Perform XSS to exfiltrate data',
    'Bypass client-side auth checks',
    'Inject malicious content via query params',
    'Enumerate API endpoints without auth',
  ],
  vulnerabilities: [
    {
      id: 'T-01',
      name: 'Session token in localStorage',
      risk: 'High',
      detail: 'JWT stored in localStorage is accessible to any XSS script on the page.',
    },
    {
      id: 'T-02',
      name: 'Missing server-side validation',
      risk: 'High',
      detail: 'Client validates fields before submission but API does not re-validate, enabling direct API abuse.',
    },
    {
      id: 'T-03',
      name: 'No rate limiting',
      risk: 'Medium',
      detail: 'Login endpoint has no rate limiting; susceptible to credential stuffing.',
    },
    {
      id: 'T-04',
      name: 'Unsafe query parameter injection',
      risk: 'High',
      detail: 'URL query params are read and rendered into the DOM without sanitisation (potential reflected XSS).',
    },
    {
      id: 'T-05',
      name: 'Untrusted content ingestion',
      risk: 'Medium',
      detail: 'User-supplied text rendered with `dangerouslySetInnerHTML` without sanitisation.',
    },
    {
      id: 'T-06',
      name: 'Insufficient auth checks',
      risk: 'High',
      detail: 'Protected routes only checked client-side; direct API calls bypass the guard.',
    },
    {
      id: 'T-07',
      name: 'Prompt injection path',
      risk: 'Medium',
      detail: 'If user content is forwarded to an LLM feature, attacker can inject instructions via crafted input.',
    },
  ],
  mitigations: [
    'Move session tokens to httpOnly cookies to prevent XSS token theft.',
    'Add server-side validation on all API inputs using a schema validator.',
    'Implement rate limiting and account lockout on auth endpoints.',
    'Sanitise all query parameters before rendering; use DOMPurify for HTML.',
    'Replace `dangerouslySetInnerHTML` with a safe rendering library.',
    'Validate JWT on every API request server-side regardless of client state.',
    'Apply prompt injection defences: system prompt separation, output filtering.',
  ],
}
