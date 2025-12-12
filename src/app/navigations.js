const navigations = [
  { name: "Dashboard", path: "/dashboard/default", icon: "dashboard" },

  { label: "ACCOUNT", type: "label" },

  {
    name: "Payment/Invoice Details",
    icon: "receipt",
    path: "/admin/customer-payments",
    auth: ["CUSTOMER"]
  },

  {
    name: "Logout",
    icon: "exit_to_app",
    path: "/session/signin" // will later be replaced with real logout logic
  },

  { label: "ASTADATA", type: "label" },

  {
    name: "Vendors",
    icon: "groups",
    path: "/vendors",
    auth: ["SA", "ADMIN", "EDITOR", "GUEST"]
  },
  {
    name: "Services",
    icon: "widgets",
    path: "/services"
  },
  {
    name: "Chat Support",
    icon: "support_agent",
    path: "/support/chat"
  },

  { label: "ASTADATA ADMIN", type: "label", auth: ["SA", "ADMIN"] },

  {
    name: "Vendor Admin",
    icon: "store",
    path: "/admin/vendors",
    auth: ["SA", "ADMIN"]
  },
  {
    name: "Customer",
    icon: "people",
    auth: ["SA", "ADMIN"],
    children: [
      {
        name: "Add/Edit Customer",
        path: "/admin/customers",
        iconText: "AC"
      },
      {
        name: "Customer Rates",
        path: "/admin/rates",
        iconText: "CR"
      },
      {
        name: "Customer Billing Details",
        path: "/admin/customer-billing",
        iconText: "CB"
      }
    ]
  },
  {
    name: "Payment/Invoice Details",
    icon: "receipt",
    path: "/admin/customer-payments",
    auth: ["SA", "ADMIN", "EDITOR", "GUEST"]
  },
];



export default navigations;

