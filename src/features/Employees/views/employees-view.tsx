"use client";

import { useEmployeesModel } from "./employees-model";
import { EmployeesHeader } from "./employees-header";
import { EmployeesDirectory } from "./employees-directory";
import { EmployeesForm } from "./employees-form";
import { EmployeeDetail } from "./employees-detail";
import { EmployeesDialogs } from "./employees-dialogs";

export function EmployeesView() {
  const model = useEmployeesModel();
  return (<div className="space-y-8 pb-8">
    <EmployeesHeader model={model} />
    <EmployeesDirectory model={model} />
    <EmployeesForm model={model} />
    <EmployeeDetail model={model} />
    <EmployeesDialogs model={model} />
  </div>);
}
