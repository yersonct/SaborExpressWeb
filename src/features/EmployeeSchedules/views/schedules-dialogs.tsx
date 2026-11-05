"use client";

import { translateCopy } from "@/config/copy-translations";
import { Dialog } from "@/components/ui/dialog";
import { formatDayHeader } from "./schedules-utils";
import type { SchedulesModel } from "./schedules-model";
export function SchedulesDialogs({ model }: { model: SchedulesModel }) {
  const { router, allBranches, transferTarget, setTransferTarget, transferBranchId, setTransferBranchId, transferring, transferError, transferBranchError, setTransferBranchError, transferSuccessMsg, mailConfirmOpen, setMailConfirmOpen, mailSending, sendWeekSchedulesByEmail, branchId, noHoursAlert, setNoHoursAlert, weekStart, weekEnd, weekSchedules, confirmDeleteId, setConfirmDeleteId, deleting, handleConfirmDelete, handleConfirmTransfer } = model;
  return (<>
      <Dialog
        isOpen={!!transferTarget}
        title={translateCopy("Trasladar a otra sede")}
        subtitle={
          transferTarget
            ? `${transferTarget.name} ${transferTarget.lastName ?? ""}`.trim()
            : undefined
        }
        onClose={() => setTransferTarget(null)}
      >
        {transferError && (
          <div className="bg-red-100 text-[#EF4444] px-4 py-3 rounded-xl mb-4 text-sm font-medium">
            {translateCopy(transferError)}
          </div>
        )}
        {transferSuccessMsg ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-100 text-green-700 px-4 py-3 rounded-xl text-sm font-medium">
              {translateCopy(transferSuccessMsg)}
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setTransferTarget(null)}
                className="px-6 py-2.5 rounded-xl text-sm font-bold bg-[#111827] text-white hover:bg-gray-800 transition-colors"
              >
                 {translateCopy("Cerrar")} </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
               {translateCopy("Todos los turnos futuros (de hoy en adelante) de este empleado se moverán a la nueva sede. Los turnos pasados quedan intactos, como historial de la sede donde realmente ocurrieron.")} </p>
            <div>
              <label className="text-xs font-semibold text-gray-500">
                 {translateCopy("Sede destino")} </label>
              <select
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 mt-1 text-gray-900 bg-white"
                value={transferBranchId}
                onChange={(e) =>
                  { setTransferBranchId(e.target.value ? Number(e.target.value) : ""); setTransferBranchError(""); }
                }
                aria-invalid={!!transferBranchError}
              >
                <option value="">{translateCopy("Selecciona...")}</option>
                {allBranches
                  .filter((b) => b.id !== transferTarget?.branchId)
                  .map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
              </select>
              {transferBranchError && <p role="alert" className="mt-1 text-xs text-red-600">{translateCopy(transferBranchError)}</p>}
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setTransferTarget(null)}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors"
              >
                 {translateCopy("Cancelar")} </button>
              <button
                onClick={handleConfirmTransfer}
                disabled={transferring}
                className="bg-[#EA1D2C] hover:bg-[#D91B29] text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-colors shadow-sm disabled:opacity-50"
              >
                {transferring ? translateCopy("Trasladando...") : translateCopy("Confirmar traslado")}
              </button>
            </div>
          </div>
        )}
      </Dialog>
      <Dialog
        isOpen={mailConfirmOpen}
        title={translateCopy("Enviar horarios de la semana")}
        onClose={() => { if (!mailSending) setMailConfirmOpen(false); }}
      >
        <p className="text-sm leading-6 text-slate-600">
          {translateCopy(`Vas a enviar por correo los turnos de ${formatDayHeader(weekStart)} a ${formatDayHeader(weekEnd)} de la sede seleccionada. Cada empleado recibirá solamente su propio horario. El sistema omitirá a quienes no tengan correo registrado.`)}
        </p>
        <p className="mt-3 text-sm font-medium text-slate-700">
          {translateCopy(`Empleados con turnos: ${new Set(weekSchedules.map((shift) => shift.employeeId)).size}`)}
        </p>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button type="button" disabled={mailSending}
            onClick={() => setMailConfirmOpen(false)}
            className="rounded-lg border border-slate-200 px-5 py-2.5 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            {translateCopy("Cancelar")}
          </button>
          <button type="button" disabled={mailSending || !branchId || weekSchedules.length === 0}
            onClick={() => void sendWeekSchedulesByEmail()}
            className="rounded-lg bg-[#EA1D2C] px-5 py-2.5 font-semibold text-white hover:bg-red-700 disabled:opacity-50">
            {mailSending ? translateCopy("Enviando correos...") : translateCopy("Confirmar envío")}
          </button>
        </div>
      </Dialog>
      <Dialog
        isOpen={noHoursAlert}
        title={translateCopy("Falta configurar el horario de la sede")}
        onClose={() => setNoHoursAlert(false)}
      >
        <div className="flex items-start gap-4 mb-6">
          <div className="w-11 h-11 rounded-full bg-amber-100 flex items-center justify-center text-xl flex-shrink-0">
            ⏰
          </div>
          <p className="text-sm text-gray-600 pt-1.5">
             {translateCopy("Esta sede aún no tiene hora de apertura y de cierre. Configúralas en")}{" "}
            <strong>
               {translateCopy("Configuración → Ajustes del Restaurante → Ajustes Operativos")} </strong>{" "}
             {translateCopy("antes de crear turnos. Los turnos usan ese horario como límite.")} </p>
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setNoHoursAlert(false)}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors"
          >
             {translateCopy("Cerrar")} </button>
          <button
            onClick={() => {
              setNoHoursAlert(false);
              router.push("/config");
            }}
            className="bg-[#EA1D2C] hover:bg-[#D91B29] text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-colors shadow-sm"
          >
             {translateCopy("Ir a Configuración")} </button>
        </div>
      </Dialog>

      <Dialog
        isOpen={confirmDeleteId !== null}
        title={translateCopy("Eliminar turno")}
        onClose={() => setConfirmDeleteId(null)}
      >
        <div className="flex items-start gap-4 mb-6">
          <div className="w-11 h-11 rounded-full bg-red-100 flex items-center justify-center text-xl flex-shrink-0">
            ⚠️
          </div>
          <p className="text-sm text-gray-600 pt-1.5">
             {translateCopy("¿Seguro que deseas eliminar este turno? Esta acción no se puede deshacer.")} </p>
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setConfirmDeleteId(null)}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors"
          >
             {translateCopy("Cancelar")} </button>
          <button
            onClick={handleConfirmDelete}
            disabled={deleting}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-colors shadow-sm disabled:opacity-50"
          >
            {deleting ? translateCopy("Eliminando...") : translateCopy("Eliminar")}
          </button>
        </div>
      </Dialog>
  </>);
}
