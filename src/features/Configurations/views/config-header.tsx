"use client";



import type { ConfigModel } from "./config-model";
export function ConfigHeader({ model }: { model: ConfigModel }) {
  const { t } = model;
  return (<>
        <div className="border-b border-gray-200 pb-6">
          <h1 className="text-3xl font-bold text-[#111827] tracking-tight">
            {t("configuration.title")}
          </h1>
          <p className="text-gray-500 mt-1">{t("configuration.description")}</p>
        </div>
  </>);
}
