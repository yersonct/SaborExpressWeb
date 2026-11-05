"use client";

import { useConfigModel } from "./config-model";
import { ConfigHeader } from "./config-header";
import { ConfigNavigation } from "./config-navigation";
import { ConfigProfile } from "./config-profile";
import { ConfigBranch } from "./config-branch";
import { ConfigMenuQr } from "./config-menu-qr";
import { ConfigSuccess } from "./config-success";

export function ConfigView() {
  const model = useConfigModel();
  return (<>
    <div className="flex flex-col h-full space-y-6 pb-10">
      <ConfigHeader model={model} />
      <div className="flex flex-col md:flex-row gap-8 pt-2">
        <ConfigNavigation model={model} />
        <div className="min-w-0 flex-1">
          <ConfigProfile model={model} />
          <ConfigBranch model={model} />
          <ConfigMenuQr model={model} />
        </div>
      </div>
    </div>
    <ConfigSuccess model={model} />
  </>);
}
