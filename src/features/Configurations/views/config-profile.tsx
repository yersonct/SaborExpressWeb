"use client";

import { translateCopy } from "@/config/copy-translations";
import { inputClass } from "./config-utils";
import type { ConfigModel } from "./config-model";
export function ConfigProfile({ model }: { model: ConfigModel }) {
  const { activeTab, t, userEmail, profile, savingProfile, profileError, fullName, initials, userRole, pName, setPName, pLastName, setPLastName, pPhone, setPPhone, profileFieldErrors, setProfileFieldErrors, profileSavedMsg, isEditingProfile, handleStartEdit, handleCancelEdit, handleSaveProfile } = model;
  return (<>
            {activeTab === "perfil" && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 animate-fade-in sm:p-6 lg:p-8">
                <h2 className="text-xl font-bold text-[#111827] mb-6">
                  {t("configuration.personalInfo")}
                </h2>

                <div className="flex items-center gap-6 mb-8 pb-8 border-b border-gray-100">
                  <div className="w-20 h-20 rounded-2xl bg-[#111827] flex items-center justify-center shadow-inner flex-shrink-0">
                    <span className="text-2xl font-bold text-white tracking-wide select-none">
                      {initials}
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-[#111827]">
                      {fullName || userEmail}
                    </p>
                    <p className="text-xs text-gray-500">{userRole}</p>
                  </div>
                </div>

                <form className="space-y-5" onSubmit={handleSaveProfile}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="profile-name" className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                        {t("configuration.name")}
                      </label>
                      <input
                        id="profile-name"
                        type="text"
                        value={pName}
                        maxLength={120}
                        aria-invalid={!!profileFieldErrors.name}
                        onChange={(e) => { setPName(e.target.value); setProfileFieldErrors((current) => ({ ...current, name: undefined })); }}
                        disabled={!profile || !isEditingProfile}
                        placeholder={
                          profile ? "" : translateCopy("Sin perfil de empleado")
                        }
                        className={`${inputClass} ${!profile || !isEditingProfile ? "bg-gray-50 text-gray-500" : ""}`}
                      />
                      {profileFieldErrors.name && <p role="alert" className="mt-1 text-xs text-red-600">{translateCopy(profileFieldErrors.name)}</p>}
                    </div>
                    <div>
                      <label htmlFor="profile-last-name" className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                        {t("configuration.lastName")}
                      </label>
                      <input
                        id="profile-last-name"
                        type="text"
                        value={pLastName}
                        maxLength={80}
                        aria-invalid={!!profileFieldErrors.lastName}
                        onChange={(e) => { setPLastName(e.target.value); setProfileFieldErrors((current) => ({ ...current, lastName: undefined })); }}
                        disabled={!profile || !isEditingProfile}
                        className={`${inputClass} ${!profile || !isEditingProfile ? "bg-gray-50 text-gray-500" : ""}`}
                      />
                      {profileFieldErrors.lastName && <p role="alert" className="mt-1 text-xs text-red-600">{translateCopy(profileFieldErrors.lastName)}</p>}
                    </div>
                    <div>
                      <label htmlFor="profile-email" className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                        {t("configuration.email")}
                      </label>
                      <input
                        id="profile-email"
                        type="email"
                        value={userEmail}
                        disabled
                        className={`${inputClass} bg-gray-50`}
                      />
                    </div>
                    <div>
                      <label htmlFor="profile-phone" className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                        {t("configuration.phone")}
                      </label>
                      <input
                        id="profile-phone"
                        type="tel"
                        value={pPhone}
                        maxLength={10}
                        inputMode="numeric"
                        aria-invalid={!!profileFieldErrors.phone}
                        onChange={(e) => { setPPhone(e.target.value.replace(/\D/g, "")); setProfileFieldErrors((current) => ({ ...current, phone: undefined })); }}
                        disabled={!profile || !isEditingProfile}
                        className={`${inputClass} ${!profile || !isEditingProfile ? "bg-gray-50 text-gray-500" : ""}`}
                      />
                      {profileFieldErrors.phone && <p role="alert" className="mt-1 text-xs text-red-600">{translateCopy(profileFieldErrors.phone)}</p>}
                    </div>
                    <div className="md:col-span-2">
                      <label htmlFor="profile-role" className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                        {t("configuration.role")}
                      </label>
                      <input
                        id="profile-role"
                        type="text"
                        value={userRole}
                        disabled
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-100 text-sm bg-gray-100 text-gray-500 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {profileError && (
                    <p className="text-sm text-red-600">
                      {translateCopy(profileError)}
                    </p>
                  )}
                  {profileSavedMsg && (
                    <p className="text-sm text-green-600 font-medium">
                      {translateCopy(profileSavedMsg)}
                    </p>
                  )}

                  {profile && (
                    <div className="flex justify-end gap-3">
                      {!isEditingProfile ? (
                        <button
                          type="button"
                          onClick={handleStartEdit}
                          className="bg-[#111827] hover:bg-gray-800 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-colors shadow-sm"
                        >
                          {t("configuration.edit")}
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            disabled={savingProfile}
                            className="bg-white border border-gray-200 hover:bg-gray-50 text-[#111827] font-bold py-2.5 px-6 rounded-xl text-sm transition-colors shadow-sm disabled:opacity-50"
                          >
                            {t("configuration.cancel")}
                          </button>
                          <button
                            type="submit"
                            disabled={savingProfile}
                            className="bg-[#111827] hover:bg-gray-800 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-colors shadow-sm disabled:opacity-50"
                          >
                            {savingProfile
                              ? t("configuration.saving")
                              : t("configuration.save")}
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </form>
              </div>
            )}
  </>);
}
