import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { POSRegister } from './components/POSRegister';
import { ActiveOrdersView } from './components/ActiveOrdersView';
import { InvoicesView } from './components/InvoicesView';
import { ExpensesView } from './components/ExpensesView';
import { PnLView } from './components/PnLView';
import { MenuManagementView } from './components/MenuManagementView';
import { PMSView } from './components/PMS/PMSView';
import { PayrollView } from './components/payroll/PayrollView';
import { AccountsView } from './components/accounts/AccountsView';
import { MastersView } from './components/masters/MastersView';
import { UserProfilePortal } from './components/users/UserProfilePortal';
import { SwitchUserModal } from './components/users/SwitchUserModal';
import { LoginScreen } from './components/auth/LoginScreen';
import { StationLockScreen } from './components/auth/StationLockScreen';
import { AccessRestrictedGuard } from './components/auth/AccessRestrictedGuard';
import { BiometricImportModal } from './components/payroll/BiometricImportModal';
import { EditPayrollRecordModal } from './components/payroll/EditPayrollRecordModal';
import { PayslipModal } from './components/payroll/PayslipModal';
import { NewEmployeeModal } from './components/payroll/NewEmployeeModal';
import { Sidebar } from './components/Sidebar';
import { ModifierModal } from './components/ModifierModal';
import { PaymentModal } from './components/PaymentModal';
import { ReceiptModal } from './components/ReceiptModal';
import { KOTModal } from './components/KOTModal';
import { AddExpenseModal } from './components/AddExpenseModal';
import { SettingsModal } from './components/SettingsModal';
import { DeleteOrderModal } from './components/DeleteOrderModal';

const MainAppContent: React.FC = () => {
  const { 
    activeTab, 
    isAuthenticated,
    isLocked,
    isUserAllowedModule,
    isSwitchUserModalOpen,
    setIsSwitchUserModalOpen,
    selectedItemForModifier, 
    setSelectedItemForModifier, 
    addToCart,
    isPaymentModalOpen,
    setIsPaymentModalOpen,
    selectedOrderForReceipt,
    setSelectedOrderForReceipt,
    selectedOrderForKOT,
    setSelectedOrderForKOT,
    isAddExpenseModalOpen,
    setIsAddExpenseModalOpen,
    isSettingsModalOpen,
    setIsSettingsModalOpen,
    orderToDelete,
    isDeleteOrderModalOpen,
    setIsDeleteOrderModalOpen
  } = useApp();

  // If user is not logged in, render the login screen
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  // Check if current active tab is permitted for this user
  const isAllowed = isUserAllowedModule(activeTab);
  const isPosFullMode = activeTab === 'pos' && isAllowed;

  if (isPosFullMode) {
    return (
      <div className="h-screen w-screen overflow-hidden bg-background text-text flex flex-col font-sans selection:bg-primary selection:text-white relative">
        <main className="w-full h-full flex flex-col overflow-hidden">
          <POSRegister />
        </main>
        {/* Modals */}
        {selectedItemForModifier && (
          <ModifierModal
            item={selectedItemForModifier}
            onClose={() => setSelectedItemForModifier(null)}
            onConfirm={(item, selectedSides, notes, quantity) => {
              addToCart(item, selectedSides, notes, quantity);
            }}
          />
        )}
        {isPaymentModalOpen && (
          <PaymentModal
            onClose={() => setIsPaymentModalOpen(false)}
            onSuccess={(finalizedOrder) => {
              setIsPaymentModalOpen(false);
              setSelectedOrderForReceipt(finalizedOrder);
            }}
          />
        )}
        {selectedOrderForReceipt && (
          <ReceiptModal
            order={selectedOrderForReceipt}
            onClose={() => setSelectedOrderForReceipt(null)}
          />
        )}
        {selectedOrderForKOT && (
          <KOTModal
            order={selectedOrderForKOT}
            onClose={() => setSelectedOrderForKOT(null)}
          />
        )}
        {isAddExpenseModalOpen && (
          <AddExpenseModal onClose={() => setIsAddExpenseModalOpen(false)} />
        )}
        {isSettingsModalOpen && (
          <SettingsModal onClose={() => setIsSettingsModalOpen(false)} />
        )}
        {isDeleteOrderModalOpen && (
          <DeleteOrderModal
            order={orderToDelete}
            onClose={() => setIsDeleteOrderModalOpen(false)}
          />
        )}
        {isLocked && <StationLockScreen />}
        {isSwitchUserModalOpen && (
          <SwitchUserModal onClose={() => setIsSwitchUserModalOpen(false)} />
        )}
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-background text-text flex font-sans selection:bg-primary selection:text-white relative">
      {/* Left-Hand Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header />

        <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-5 sm:py-6 overflow-y-auto">
          {!isAllowed ? (
            <AccessRestrictedGuard moduleId={activeTab} />
          ) : (
            <>
              {activeTab === 'pms' && <PMSView />}
              {activeTab === 'pos' && <POSRegister />}
              {activeTab === 'orders' && <ActiveOrdersView />}
              {activeTab === 'invoices' && <InvoicesView />}
              {activeTab === 'expenses' && <ExpensesView />}
              {activeTab === 'pnl' && <PnLView />}
              {activeTab === 'menu' && <MenuManagementView />}
              {activeTab === 'payroll' && <PayrollView />}
              {activeTab === 'accounts' && <AccountsView />}
              {activeTab === 'masters' && <MastersView />}
              {activeTab === 'users' && <UserProfilePortal />}
            </>
          )}
        </main>
      </div>

      {/* Station Lock Overlay */}
      {isLocked && <StationLockScreen />}

      {/* Switch User / Profile Modal */}
      {isSwitchUserModalOpen && (
        <SwitchUserModal onClose={() => setIsSwitchUserModalOpen(false)} />
      )}

      {/* Global Modals */}
      <BiometricImportModal />
      <EditPayrollRecordModal />
      <PayslipModal />
      <NewEmployeeModal />

      {selectedItemForModifier && (
        <ModifierModal
          item={selectedItemForModifier}
          onClose={() => setSelectedItemForModifier(null)}
          onConfirm={(item, selectedSides, notes, quantity) => {
            addToCart(item, selectedSides, notes, quantity);
          }}
        />
      )}

      {isPaymentModalOpen && (
        <PaymentModal
          onClose={() => setIsPaymentModalOpen(false)}
          onSuccess={(finalizedOrder) => {
            setIsPaymentModalOpen(false);
            setSelectedOrderForReceipt(finalizedOrder);
          }}
        />
      )}

      {selectedOrderForReceipt && (
        <ReceiptModal
          order={selectedOrderForReceipt}
          onClose={() => setSelectedOrderForReceipt(null)}
        />
      )}

      {selectedOrderForKOT && (
        <KOTModal
          order={selectedOrderForKOT}
          onClose={() => setSelectedOrderForKOT(null)}
        />
      )}

      {isAddExpenseModalOpen && (
        <AddExpenseModal
          onClose={() => setIsAddExpenseModalOpen(false)}
        />
      )}

      {isSettingsModalOpen && (
        <SettingsModal
          onClose={() => setIsSettingsModalOpen(false)}
        />
      )}

      {isDeleteOrderModalOpen && (
        <DeleteOrderModal
          order={orderToDelete}
          isOpen={isDeleteOrderModalOpen}
          onClose={() => setIsDeleteOrderModalOpen(false)}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
