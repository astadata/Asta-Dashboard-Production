import { lazy } from "react";
import { Navigate } from "react-router-dom";

import AuthGuard from "./auth/AuthGuard";
import { authRoles } from "./auth/authRoles";

import Loadable from "./components/Loadable";
import MatxLayout from "./components/MatxLayout/MatxLayout";
import sessionRoutes from "./views/sessions/session-routes";
import materialRoutes from "app/views/material-kit/MaterialRoutes";

// E-CHART PAGE
const AppEchart = Loadable(lazy(() => import("app/views/charts/echarts/AppEchart")));
// DASHBOARD PAGE
const Analytics = Loadable(lazy(() => import("app/views/dashboard/Analytics")));
// ADMIN PAGES
const VendorAdmin = Loadable(lazy(() => import("app/views/admin/vendors/VendorAdmin")));
const CustomerAdmin = Loadable(lazy(() => import("app/views/admin/vendors/CustomerAdmin")));
const CustomerRates = Loadable(lazy(() => import("app/views/admin/rates/CustomerRates")));
const CustomerPayments = Loadable(lazy(() => import("app/views/admin/payments/CustomerPayments")));
const CustomerBillingDetails = Loadable(lazy(() => import("app/views/admin/billing/CustomerBillingDetails")));
// PUBLIC/CUSTOMER VENDORS
const VendorsList = Loadable(lazy(() => import("app/views/vendors/VendorsList")));
const ServicesList = Loadable(lazy(() => import("app/views/vendors/ServicesList")));
// SUPPORT
const ChatSupport = Loadable(lazy(() => import("app/views/support/ChatSupport")));

const routes = [
  { path: "/", element: <Navigate to="dashboard/default" /> },
  {
    element: (
      <AuthGuard>
        <MatxLayout />
      </AuthGuard>
    ),
    children: [
      ...materialRoutes,
      // dashboard route
      { path: "/dashboard/default", element: <Analytics />, auth: authRoles.admin },
      // admin routes
      { path: "/admin/vendors", element: <VendorAdmin />, auth: authRoles.admin },
      { path: "/admin/customers", element: <CustomerAdmin />, auth: authRoles.admin },
      { path: "/admin/rates", element: <CustomerRates />, auth: authRoles.admin },
      { path: "/admin/customer-payments", element: <CustomerPayments />, auth: authRoles.guest },
      { path: "/admin/customer-billing", element: <CustomerBillingDetails />, auth: authRoles.guest },
      // public/customer routes
      { path: "/vendors", element: <VendorsList />, auth: authRoles.guest },
      { path: "/services", element: <ServicesList />, auth: authRoles.guest },
      // support routes
      { path: "/support/chat", element: <ChatSupport />, auth: authRoles.guest },
      // e-chart route
      { path: "/charts/echarts", element: <AppEchart />, auth: authRoles.editor }
    ]
  },

  // session pages route
  ...sessionRoutes
];

export default routes;
