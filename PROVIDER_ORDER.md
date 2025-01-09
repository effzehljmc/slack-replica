# Provider Order and Authentication Guide

## Critical Provider Order
The order of providers in `src/app/layout.tsx` is critical and should NEVER be changed:

```tsx
<ConvexClientProvider>      // MUST be outermost
  <AuthProvider>           // MUST be after Convex, before others
    <ThemeProvider>       // Can be here or after other providers
      {children}
    </ThemeProvider>
  </AuthProvider>
</ConvexClientProvider>
```

## Why This Order Matters
1. `ConvexClientProvider`
   - Must be the outermost provider
   - Initializes the Convex client
   - Required by authentication and all Convex operations
   - Breaking this order will cause authentication errors

2. `AuthProvider`
   - Must be immediately inside ConvexClientProvider
   - Handles user authentication
   - Requires Convex to be initialized
   - Moving this will break authentication

3. `ThemeProvider` (and other providers)
   - Can be placed inside AuthProvider
   - Order with other non-auth providers is flexible
   - Does not affect authentication

## Common Issues When Order Is Wrong
1. "Invalid email or password" errors even with correct credentials
2. Authentication context undefined errors
3. Convex operation errors
4. Unexpected logouts

## When Adding New Providers
1. Always keep ConvexClientProvider outermost
2. Always keep AuthProvider second
3. Add new providers inside AuthProvider
4. Test authentication after any provider changes

## Testing Provider Order
After any changes to providers or their order:
1. Test user registration
2. Test user login
3. Test persistent sessions
4. Test protected routes

## DO NOT
- Move ConvexClientProvider inside any other provider
- Place AuthProvider before ConvexClientProvider
- Remove or modify the provider chain when adding features

## Safe to Do
- Add new providers inside AuthProvider
- Modify provider props
- Add context providers for new features

Remember: When in doubt, check this guide before modifying the provider structure. 