"use client";

import { translateCopy } from "@/config/copy-translations";
import { formatDayHeader } from "./schedules-utils";
import type { SchedulesModel } from "./schedules-model";
export function SchedulesHeader({ model }: { model: SchedulesModel }) {
  const { t, isGerente, allBranches, selectedBranchId, setSelectedBranchId, setMailConfirmOpen, mailSending, mailMessage, setMailMessage, branchId, PAGE_SIZE, search, setSearch, setPage, error, setNoHoursAlert, loadBranchHours, emptyBulkForm, setIsBulkModalOpen, setBulkForm, setBulkError, setBulkFieldErrors, weekStart, weekEnd, goToPrevWeek, goToNextWeek, goToThisWeek, weekSchedules, branchEmployees } = model;
  return (<>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#081A38]">
            {t("pageTitles.schedules")}
          </h1>
          <p className="text-base text-gray-500">
             {translateCopy("Asigna a cada empleado un turno con rol activo, sede y horario.")} </p>

          {isGerente && (
            <div className="mt-3">
              <label className="text-xs font-semibold text-gray-500 mr-2">
                 {translateCopy("Sede:")} </label>
              <select
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 bg-white"
                value={selectedBranchId ?? ""}
                onChange={(e) => setSelectedBranchId(Number(e.target.value))}
              >
                {allBranches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 mt-3">
            <button
              onClick={goToPrevWeek}
              className="schedule-week-nav w-8 h-8 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
              aria-label={translateCopy("Semana anterior")}
            >
              ←
            </button>
            <span className="text-sm font-semibold text-[#081A38]">
              {formatDayHeader(weekStart)} – {formatDayHeader(weekEnd)}
            </span>
            <button
              onClick={goToNextWeek}
              className="schedule-week-nav w-8 h-8 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
              aria-label={translateCopy("Semana siguiente")}
            >
              →
            </button>
            <button
              onClick={goToThisWeek}
              className="text-xs font-semibold text-[#EA1D2C] hover:underline ml-1"
            >
               {translateCopy("Hoy")} </button>
          </div>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => {
              setMailMessage(null);
              setMailConfirmOpen(true);
            }}
            disabled={!branchId || mailSending || weekSchedules.length === 0}
            className="w-full rounded-lg border border-[#EA1D2C] bg-white px-5 py-2.5 font-semibold text-[#EA1D2C] transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
            title={translateCopy("Enviar a cada empleado los turnos de la semana visible")}
          >
            {translateCopy("Enviar horarios por correo")}
          </button>
          <button
            onClick={async () => {
              if (!branchId) return;
              const hours = await loadBranchHours(branchId);
              if (!hours) {
                setNoHoursAlert(true);
                return;
              }
              setBulkForm({
                ...emptyBulkForm,
                startTime: hours.open,
                endTime: hours.close,
              });
              setBulkError([]);
              setBulkFieldErrors({});
              setIsBulkModalOpen(true);
            }}
            disabled={!branchId}
            className="w-full lg:w-auto bg-[#EA1D2C] text-white px-5 py-2.5 rounded-lg font-semibold hover:opacity-90 disabled:opacity-40"
          >
             {translateCopy("+ Asignar semana completa")} </button>
        </div>
      </div>

      {mailMessage && (
        <div role="status" className={`mb-3 rounded-xl px-4 py-3 text-sm ${mailMessage.error ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-800"}`}>
          {translateCopy(mailMessage.text)}
        </div>
      )}
      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
          {translateCopy(error)}
        </div>
      )}

      {branchEmployees.length > PAGE_SIZE && (
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder={translateCopy("Buscar empleado...")}
          className="w-full sm:w-72 border border-gray-300 rounded-lg px-3 py-2 mb-3 text-sm text-gray-900 bg-white"
        />
      )}

  </>);
}
