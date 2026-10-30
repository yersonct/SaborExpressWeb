import type { useSchedulesData } from "./schedules-data";
import type { useSchedulesActions } from "./schedules-actions";
export type SchedulesModel = ReturnType<typeof useSchedulesData> & ReturnType<typeof useSchedulesActions>;
