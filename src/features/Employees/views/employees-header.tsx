"use client";

import { translateCopy } from "@/config/copy-translations";

import type { EmployeesModel } from "./employees-model";
export function EmployeesHeader({ model }: { model: EmployeesModel }) {
  const { t, staffRoles, savingCvRequirement, allRequireCv, handleToggleCvRequirement, openCreate } = model;
  return (<>
        {/* CABECERA */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div>
            <h1 className="text-3xl font-bold text-[#111827] tracking-tight">
              {t("pageTitles.employees")}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
               {translateCopy("Administración de personal, roles y accesos al sistema.")} </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 lg:gap-6">
            <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-2.5">
              <div>
                <p className="text-xs font-bold text-[#111827]">
                   {translateCopy("Exigir hoja de vida")} </p>
                <p className="text-[10px] text-gray-500">
                   {translateCopy("Aplica a Mesero, Cajero, Cocinero, Auxiliar de cocina y Repartidor")} </p>
              </div>
              <button
                onClick={handleToggleCvRequirement}
                disabled={savingCvRequirement || staffRoles.length === 0}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 flex-shrink-0 ${
                  allRequireCv ? "bg-[#EA1D2C]" : "bg-gray-200"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    allRequireCv ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
            <button
              onClick={openCreate}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#111827] px-6 py-3 font-bold text-white shadow-sm transition-all hover:scale-[1.02] hover:bg-gray-800 sm:w-auto"
            >
              <span className="text-xl">+</span>  {translateCopy("Registrar Empleado")} </button>
          </div>
        </div>
  </>);
}
