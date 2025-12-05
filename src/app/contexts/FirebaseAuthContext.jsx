import { createContext, useEffect, useReducer } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "firebase/auth";
// FIREBASE CONFIGURATION
import { firebaseConfig } from "app/config";
// GLOBAL CUSTOM COMPONENT
import Loading from "app/components/MatxLoading";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const initialAuthState = {
  user: null,
  isInitialized: false,
  isAuthenticated: false
};

const reducer = (state, action) => {
  switch (action.type) {
    case "FB_AUTH_STATE_CHANGED": {
        const { isAuthenticated, user } = action.payload;
        return { ...state, isAuthenticated, isInitialized: true, user };
    }

    default: {
      return state;
    }
  }
};

const AuthContext = createContext({
  ...initialAuthState,
  method: "FIREBASE"
});

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialAuthState);

  const signInWithEmail = async (email, password) => {
    // Development-only shortcut: allow a local seeded admin account without contacting Firebase.
    // WARNING: This is for local development/testing only. Do NOT use in production.
    try {
      if (email === 'sales@astadata.com' && password === 'Astadata@123') {
        const role = 'ADMIN';
        try { localStorage.setItem('userRole', role); } catch (e) {}
        dispatch({
          type: 'FB_AUTH_STATE_CHANGED',
          payload: {
            isAuthenticated: true,
            user: { id: 'dev-admin', email, avatar: null, name: 'Sales Admin', role }
          }
        });
        return Promise.resolve();
      }
    } catch (e) {
      // ignore and fallback to real auth
    }

    // Allow customers stored in database to authenticate
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3030';
      const res = await fetch(`${apiUrl}/api/customers?email=${encodeURIComponent(email)}&includeVendorServices=true`);
      if (res.ok) {
        const list = await res.json();
        
        // Check if customer record matches the password
        const match = (list || []).find((c) => c.password && c.password === password);
        if (match) {
          const role = match.role || 'CUSTOMER';
          try { localStorage.setItem('userRole', role); } catch (e) {}
          
          // Transform vendorServices to allMappings format for backward compatibility
          const allMappings = (match.vendorServices || []).map(vs => ({
            id: match.id,
            email: match.email,
            customerName: match.customerName,
            role: match.role,
            vendorId: vs.vendor_id || vs.vendors?.id,
            service: vs.services?.name || vs.serviceName,
            subuserId: vs.subuser_id,
            vendor: vs.vendors?.name || vs.vendorName
          }));
          
          dispatch({
            type: 'FB_AUTH_STATE_CHANGED',
            payload: {
              isAuthenticated: true,
              user: { 
                id: match.id || `dev-${email}`, 
                email, 
                avatar: null, 
                name: email, 
                customerName: match.customerName,
                role, 
                mapping: allMappings[0] || match,
                allMappings: allMappings  // Add all mappings for dropdown
              }
            }
          });
          return Promise.resolve();
        } else if (list.length > 0) {
          // Customer exists but wrong password
          throw new Error('Incorrect email or password. Please try again.');
        } else {
          // No customer found with this email
          throw new Error('Account not found. Please check your email or contact support.');
        }
      }
    } catch (e) {
      // Re-throw user-friendly errors
      if (e.message.includes('Incorrect email') || e.message.includes('Account not found')) {
        throw e;
      }
      // For other errors, show generic message
      throw new Error('Unable to sign in. Please check your credentials and try again.');
    }

    return signInWithEmailAndPassword(auth, email, password);
  };

  const signInWithGoogle = () => {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  };

  const createUserWithEmail = (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
  };

  const logout = () => {
    try { localStorage.removeItem('userRole'); } catch (e) {}
    
    // Clear the authentication state first
    dispatch({
      type: 'FB_AUTH_STATE_CHANGED',
      payload: { isAuthenticated: false, user: null }
    });
    
    // Then attempt Firebase sign out (will fail gracefully for dev customers)
    return signOut(auth).catch(() => {
      // For dev-only customers that don't have Firebase accounts, state is already cleared above
    });
  };

  const setUserRole = (role) => {
    // save role in localStorage for demo purposes
    try { localStorage.setItem('userRole', role); } catch (e) {}
    // dispatch a local update so navs update immediately
    dispatch({ type: 'FB_AUTH_STATE_CHANGED', payload: { isAuthenticated: state.isAuthenticated, user: { ...(state.user || {}), role } } });
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const savedRole = (() => {
          try { return localStorage.getItem('userRole') || 'GUEST'; } catch (e) { return 'GUEST'; }
        })();

        dispatch({
          type: "FB_AUTH_STATE_CHANGED",
          payload: {
            isAuthenticated: true,
            user: {
              id: user.uid,
              email: user.email,
              avatar: user.photoURL,
              name: user.displayName || user.email,
              role: savedRole
            }
          }
        });
      } else {
        dispatch({
          type: "FB_AUTH_STATE_CHANGED",
          payload: { isAuthenticated: false, user: null }
        });
      }
    });

    return () => unsubscribe();
  }, [dispatch]);

  if (!state.isInitialized) return <Loading />;

  return (
    <AuthContext.Provider
      value={{
        ...state,
        logout,
        signInWithGoogle,
        method: "FIREBASE",
        signInWithEmail,
        createUserWithEmail,
        setUserRole
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
