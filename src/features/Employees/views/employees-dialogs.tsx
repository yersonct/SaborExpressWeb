"use client";

import { translateCopy } from "@/config/copy-translations";
import { Dialog } from "@/components/ui/dialog";
import { NotificationModal } from "@/components/ui/modal";
import { ROUTES } from "@/config/routes";
import { pendingNavigationKeys, rememberNavigationTarget } from "@/config/pending-navigation";

import type { EmployeesModel } from "./employees-model";
export function EmployeesDialogs({ model }: { model: EmployeesModel }) {
  const { router, justCreatedEmployee, setJustCreatedEmployee, confirmDeactivate, setConfirmDeactivate, confirmReactivate, setConfirmReactivate, confirmDeleteEmployee, setConfirmDeleteEmployee, setIsFormOpen, saving, notify, setNotify, handleToggleStatus, handlePermanentDelete } = model;
  return (<>
        <Dialog
          isOpen={!!confirmDeactivate}
          title={translateCopy("Suspender Empleado")}
          onClose={() => setConfirmDeactivate(null)}
        >
          <div className="flex items-start gap-4 mb-6">
            <div className="w-11 h-11 rounded-full bg-yellow-100 flex items-center justify-center text-xl flex-shrink-0">
              ⚠️
            </div>
            <p className="text-sm text-gray-600 pt-1.5">
               {translateCopy("¿Seguro que deseas suspender a")}{" "}
              <strong className="text-[#111827]">
                {confirmDeactivate?.name}
              </strong>
               {translateCopy("? No podrá acceder al sistema hasta que sea reactivado.")} </p>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setConfirmDeactivate(null)}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors"
            >
               {translateCopy("Cancelar")} </button>
            <button
              onClick={async () => {
                if (confirmDeactivate) {
                  await handleToggleStatus(confirmDeactivate);
                  setConfirmDeactivate(null);
                }
              }}
              disabled={saving}
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-colors shadow-sm disabled:opacity-50"
            >
              {saving ? translateCopy("Suspendiendo...") : translateCopy("Suspender")}
            </button>
          </div>
        </Dialog>

        <Dialog
          isOpen={!!confirmReactivate}
          title={translateCopy("Reactivar Empleado")}
          onClose={() => setConfirmReactivate(null)}
        >
          <div className="flex items-start gap-4 mb-6">
            <div className="w-11 h-11 rounded-full bg-green-100 flex items-center justify-center text-xl flex-shrink-0">
              ✅
            </div>
            <p className="text-sm text-gray-600 pt-1.5">
               {translateCopy("¿Deseas reactivar a")}{" "}
              <strong className="text-[#111827]">
                {confirmReactivate?.name}
              </strong>
               {translateCopy("? Volverá a tener acceso al sistema.")} </p>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setConfirmReactivate(null)}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors"
            >
               {translateCopy("Cancelar")} </button>
            <button
              onClick={async () => {
                if (confirmReactivate) {
                  await handleToggleStatus(confirmReactivate);
                  setConfirmReactivate(null);
                }
              }}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-colors shadow-sm disabled:opacity-50"
            >
              {saving ? translateCopy("Reactivando...") : translateCopy("Reactivar")}
            </button>
          </div>
        </Dialog>

        <Dialog
          isOpen={!!confirmDeleteEmployee}
          title={translateCopy("Eliminar empleado permanentemente")}
          subtitle={translateCopy("Esta acción no se puede deshacer")}
          onClose={() => setConfirmDeleteEmployee(null)}
        >
          <div className="mb-6 flex items-start gap-4">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-red-100 text-xl text-red-700">
              ⚠️
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <p>
                {translateCopy("¿Seguro que deseas eliminar a")} {" "}
                <strong className="text-[#111827]">
                  {confirmDeleteEmployee?.name} {confirmDeleteEmployee?.lastName ?? ""}
                </strong>
                {translateCopy("? Se borrarán su cuenta, datos personales, turnos, hoja de vida y entregas asociadas.")}
              </p>
              <p>
                {translateCopy("Los pedidos y pagos anteriores se conservarán como historial, sin asociarlos a este empleado. Si tiene pedidos o entregas activos, primero debes finalizarlos o reasignarlos.")}
              </p>
              <p>
                {translateCopy("Si la cuenta también existe como cliente, se conservará para proteger esos datos; en ese caso puedes suspender al empleado.")}
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setConfirmDeleteEmployee(null)}
              disabled={saving}
              className="rounded-xl px-6 py-2.5 text-sm font-bold text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-50"
            >
              {translateCopy("Cancelar")}
            </button>
            <button
              onClick={() => {
                if (confirmDeleteEmployee) {
                  void handlePermanentDelete(confirmDeleteEmployee);
                }
              }}
              disabled={saving}
              className="rounded-xl bg-red-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-50"
            >
              {saving
                ? translateCopy("Eliminando...")
                : translateCopy("Eliminar definitivamente")}
            </button>
          </div>
        </Dialog>

        <NotificationModal
          isOpen={!!notify}
          message={notify?.message ?? ""}
          type={notify?.type ?? "success"}
          onClose={() => setNotify(null)}
        />
        <Dialog
          isOpen={!!justCreatedEmployee}
          title={translateCopy("Empleado registrado")}
          onClose={() => setJustCreatedEmployee(null)}
        >
          <div className="flex items-start gap-4 mb-6">
            <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center text-xl flex-shrink-0">
              📅
            </div>
            <p className="text-sm text-gray-600 pt-1.5">
              <strong className="text-[#111827]">
                {justCreatedEmployee?.name}
              </strong>{" "}
               {translateCopy("todavía no puede acceder al sistema — necesita al menos un turno asignado. ¿Quieres asignarle uno ahora?")} </p>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setIsFormOpen(false);
                setJustCreatedEmployee(null);
              }}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors"
            >
               {translateCopy("Más tarde")} </button>
            <button
              onClick={() => {
                setIsFormOpen(false);
                if (justCreatedEmployee) {
                  const employeeId = justCreatedEmployee.id;
                  setJustCreatedEmployee(null);
                  rememberNavigationTarget(
                    pendingNavigationKeys.scheduleEmployee,
                    employeeId,
                  );
                  router.push(ROUTES.schedules);
                }
              }}
              className="bg-[#EA1D2C] hover:bg-[#d11a28] text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-colors shadow-sm"
            >
               {translateCopy("Asignar turno ahora")} </button>
          </div>
        </Dialog>
  </>);
}
