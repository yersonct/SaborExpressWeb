"use client";

import { useCallback, useEffect, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { deferEffect } from "@/lib/defer-effect";

/**
 * Recuerda SOLO preferencias primitivas de la interfaz (pestañas, filtros,
 * páginas y sedes). No usar para tokens, formularios, datos personales,
 * notificaciones, objetos de negocio ni confirmaciones sensibles.
 *
 * Cada valor está aislado por el ID del usuario autenticado y por la vista.
 * La lectura ocurre después de hidratar React para evitar errores de SSR.
 */
type Primitive = string | number | boolean | null | undefined;

type Snapshot<T> = { key: string | null; value: T };

function canRestore<T extends Primitive>(
  candidate: unknown,
  defaultValue: T,
): candidate is T {
  if (candidate === null) return defaultValue === null;
  if (typeof candidate === "boolean") return typeof defaultValue === "boolean";
  if (typeof candidate === "string") {
    return typeof defaultValue === "string" && candidate.length <= 200;
  }
  if (typeof candidate === "number") {
    return (
      Number.isSafeInteger(candidate) &&
      candidate >= 0 &&
      (typeof defaultValue === "number" ||
        defaultValue === null ||
        defaultValue === undefined ||
        defaultValue === "")
    );
  }
  return false;
}

export function useRememberedUiState<T extends Primitive>(
  section: string,
  field: string,
  defaultValue: T,
): readonly [T, Dispatch<SetStateAction<T>>, boolean] {
  const { session, isHydrated } = useAuth();
  const owner =
    isHydrated && session?.userId != null ? String(session.userId) : null;
  const storageKey =
    owner === null ? null : `sabor-express:ui:v1:${owner}:${section}:${field}`;

  const [snapshot, setSnapshot] = useState<Snapshot<T>>({
    key: null,
    value: defaultValue,
  });

  useEffect(() => deferEffect(() => {
    if (storageKey === null) {
      setSnapshot({ key: null, value: defaultValue });
      return;
    }
    let restored = defaultValue;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw !== null) {
        const candidate: unknown = JSON.parse(raw);
        if (canRestore(candidate, defaultValue)) restored = candidate;
      }
    } catch {
      // Almacenamiento bloqueado o valor corrupto: seguimos con el predeterminado.
    }
    setSnapshot({ key: storageKey, value: restored });
  }), [storageKey, defaultValue]);

  const ready = storageKey !== null && snapshot.key === storageKey;
  const value = ready ? snapshot.value : defaultValue;

  const setValue: Dispatch<SetStateAction<T>> = useCallback(
    (update) => {
      setSnapshot((previous) => {
        const current =
          previous.key === storageKey ? previous.value : defaultValue;
        const nextValue =
          typeof update === "function"
            ? (update as (prev: T) => T)(current)
            : update;
        return { key: storageKey, value: nextValue };
      });
    },
    [storageKey, defaultValue],
  );

  useEffect(() => {
    if (!ready || storageKey === null) return;
    try {
      if (snapshot.value === undefined) {
        window.localStorage.removeItem(storageKey);
      } else {
        window.localStorage.setItem(storageKey, JSON.stringify(snapshot.value));
      }
    } catch {
      // Preferencia opcional: no interrumpimos la navegación si localStorage falla.
    }
  }, [ready, storageKey, snapshot.value]);

  return [value, setValue, ready] as const;
}
