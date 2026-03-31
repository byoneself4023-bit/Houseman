import React, { Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '@/layouts/AppLayout';
import { RoleGuard } from '@/layouts/RoleGuard';

// SettlementPage eager import (preserved from App.jsx)
import { SettlementWrapper } from '@/pages/wrappers/SettlementWrapper';

// Lazy page wrappers
const CalendarWrapper = React.lazy(() =>
  import('@/pages/wrappers/CalendarWrapper').then((m) => ({ default: m.CalendarWrapper })),
);
const BuildingsWrapper = React.lazy(() =>
  import('@/pages/wrappers/BuildingsWrapper').then((m) => ({ default: m.BuildingsWrapper })),
);
const BuildingDetailWrapper = React.lazy(() =>
  import('@/pages/wrappers/BuildingDetailWrapper').then((m) => ({
    default: m.BuildingDetailWrapper,
  })),
);
const TenantsWrapper = React.lazy(() =>
  import('@/pages/wrappers/TenantsWrapper').then((m) => ({ default: m.TenantsWrapper })),
);
const PastTenantsWrapper = React.lazy(() =>
  import('@/pages/wrappers/PastTenantsWrapper').then((m) => ({ default: m.PastTenantsWrapper })),
);
const RenewalWrapper = React.lazy(() =>
  import('@/pages/wrappers/RenewalWrapper').then((m) => ({ default: m.RenewalWrapper })),
);
const VacancyWrapper = React.lazy(() =>
  import('@/pages/wrappers/VacancyWrapper').then((m) => ({ default: m.VacancyWrapper })),
);
const CollectionWrapper = React.lazy(() =>
  import('@/pages/wrappers/CollectionWrapper').then((m) => ({ default: m.CollectionWrapper })),
);
const BillingUnifiedWrapper = React.lazy(() =>
  import('@/pages/wrappers/BillingUnifiedWrapper').then((m) => ({
    default: m.BillingUnifiedWrapper,
  })),
);
const BillingFixedWrapper = React.lazy(() =>
  import('@/pages/wrappers/BillingFixedWrapper').then((m) => ({
    default: m.BillingFixedWrapper,
  })),
);
const BillingVariableWrapper = React.lazy(() =>
  import('@/pages/wrappers/BillingVariableWrapper').then((m) => ({
    default: m.BillingVariableWrapper,
  })),
);
const TransactionWrapper = React.lazy(() =>
  import('@/pages/wrappers/TransactionWrapper').then((m) => ({ default: m.TransactionWrapper })),
);
const ParkingWrapper = React.lazy(() =>
  import('@/pages/wrappers/ParkingWrapper').then((m) => ({ default: m.ParkingWrapper })),
);
const ASWrapper = React.lazy(() =>
  import('@/pages/wrappers/ASWrapper').then((m) => ({ default: m.ASWrapper })),
);
const PatrolWrapper = React.lazy(() =>
  import('@/pages/wrappers/PatrolWrapper').then((m) => ({ default: m.PatrolWrapper })),
);
const CashBookWrapper = React.lazy(() =>
  import('@/pages/wrappers/CashBookWrapper').then((m) => ({ default: m.CashBookWrapper })),
);
const TaskDriverWrapper = React.lazy(() =>
  import('@/pages/wrappers/TaskDriverWrapper').then((m) => ({ default: m.TaskDriverWrapper })),
);
const ProfitDashboardWrapper = React.lazy(() =>
  import('@/pages/wrappers/ProfitDashboardWrapper').then((m) => ({
    default: m.ProfitDashboardWrapper,
  })),
);
const RouteScheduleWrapper = React.lazy(() =>
  import('@/pages/wrappers/RouteScheduleWrapper').then((m) => ({
    default: m.RouteScheduleWrapper,
  })),
);
const DataUploadWrapper = React.lazy(() =>
  import('@/pages/wrappers/DataUploadWrapper').then((m) => ({ default: m.DataUploadWrapper })),
);
const HomepageEditWrapper = React.lazy(() =>
  import('@/pages/wrappers/HomepageEditWrapper').then((m) => ({
    default: m.HomepageEditWrapper,
  })),
);
const HomepageWrapper = React.lazy(() =>
  import('@/pages/wrappers/HomepageWrapper').then((m) => ({ default: m.HomepageWrapper })),
);
const StaffWrapper = React.lazy(() =>
  import('@/pages/wrappers/StaffWrapper').then((m) => ({ default: m.StaffWrapper })),
);
const BrokerWrapper = React.lazy(() =>
  import('@/pages/wrappers/BrokerWrapper').then((m) => ({ default: m.BrokerWrapper })),
);
const PayrollWrapper = React.lazy(() =>
  import('@/pages/wrappers/PayrollWrapper').then((m) => ({ default: m.PayrollWrapper })),
);
const CompanySettingsWrapper = React.lazy(() =>
  import('@/pages/wrappers/CompanySettingsWrapper').then((m) => ({
    default: m.CompanySettingsWrapper,
  })),
);
const OwnerWrapper = React.lazy(() =>
  import('@/pages/wrappers/OwnerWrapper').then((m) => ({ default: m.OwnerWrapper })),
);

// Standalone homepage (no auth, no layout)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const HomepagePublic = React.lazy(() =>
  import('./pages/HomepagePage').then((m) => ({ default: m.HomepagePage as React.ComponentType<any> })),
);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MoveOutLinkPublic = React.lazy(() =>
  import('./pages/MoveOutLinkPage').then((m) => ({ default: m.MoveOutLinkPage as React.ComponentType<any> })),
);

export const router = createBrowserRouter([
  // Standalone homepage — accessed via ?mode=homepage redirect
  {
    path: '/homepage-public',
    element: (
      <Suspense fallback={null}>
        <HomepagePublic />
      </Suspense>
    ),
  },
  // Public move-out link — tenants access without auth
  {
    path: '/move-out/:eventId',
    element: (
      <Suspense fallback={null}>
        <MoveOutLinkPublic />
      </Suspense>
    ),
  },
  // Main app with layout
  {
    element: <AppLayout />,
    children: [
      {
        element: <RoleGuard />,
        children: [
          { index: true, element: <Navigate to="/calendar" replace /> },
          { path: 'calendar', element: <CalendarWrapper /> },
          { path: 'buildings', element: <BuildingsWrapper /> },
          { path: 'buildings/:name', element: <BuildingDetailWrapper /> },
          { path: 'tenants', element: <TenantsWrapper /> },
          { path: 'past-tenants', element: <PastTenantsWrapper /> },
          { path: 'renewal', element: <RenewalWrapper /> },
          { path: 'vacancies', element: <VacancyWrapper /> },
          { path: 'collection', element: <CollectionWrapper /> },
          { path: 'billing', element: <BillingUnifiedWrapper /> },
          { path: 'billing/fixed', element: <BillingFixedWrapper /> },
          { path: 'billing/variable', element: <BillingVariableWrapper /> },
          { path: 'transactions', element: <TransactionWrapper /> },
          { path: 'parking', element: <ParkingWrapper /> },
          { path: 'as', element: <ASWrapper /> },
          { path: 'patrol', element: <PatrolWrapper /> },
          { path: 'settlement', element: <SettlementWrapper /> },
          { path: 'cashbook', element: <CashBookWrapper /> },
          { path: 'payroll', element: <PayrollWrapper /> },
          { path: 'task-driver', element: <TaskDriverWrapper /> },
          { path: 'profit-dashboard', element: <ProfitDashboardWrapper /> },
          { path: 'route-schedule', element: <RouteScheduleWrapper /> },
          { path: 'company-settings', element: <CompanySettingsWrapper /> },
          { path: 'data-upload', element: <DataUploadWrapper /> },
          { path: 'homepage-edit', element: <HomepageEditWrapper /> },
          { path: 'homepage', element: <HomepageWrapper /> },
          { path: 'staff', element: <StaffWrapper /> },
          { path: 'broker', element: <BrokerWrapper /> },
          { path: 'owner', element: <OwnerWrapper /> },
          { path: '*', element: <Navigate to="/calendar" replace /> },
        ],
      },
    ],
  },
]);
