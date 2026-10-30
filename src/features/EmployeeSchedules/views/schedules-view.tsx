"use client";

import { useSchedulesData } from "./schedules-data";
import { useSchedulesActions } from "./schedules-actions";
import { SchedulesHeader } from "./schedules-header";
import { SchedulesWeekGrid } from "./schedules-week-grid";
import { SchedulesForm } from "./schedules-form";
import { SchedulesBulkForm } from "./schedules-bulk-form";
import { SchedulesDialogs } from "./schedules-dialogs";

export function SchedulesView() {
  const data = useSchedulesData();
  const actions = useSchedulesActions(data);
  const model = { ...data, ...actions };
  return (<div className="p-4 sm:p-6 lg:p-8">
    <SchedulesHeader model={model} />
    <SchedulesWeekGrid model={model} />
    <SchedulesForm model={model} />
    <SchedulesBulkForm model={model} />
    <SchedulesDialogs model={model} />
  </div>);
}
