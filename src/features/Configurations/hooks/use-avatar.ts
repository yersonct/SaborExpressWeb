"use client";

import { useCallback, useEffect, useState } from "react";

const MAX_BYTES = 1024 * 1024; // 1 MB, igual que dice la pantalla
const ALLOWED = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const SIZE = 256;

const storageKey = (owner: string) => `sabor-express-avatar:${owner}`;

// "Yerson Rubiano" -> "YR" | "yersonrubiano64@gmail.com" -> "Y" | "juan.perez@x.com" -> "JP"
export function getInitials(fullName?: string | null, email?: string | null) {
  const fromName = (fullName ?? "").trim().split(/\s+/).filter(Boolean);
  if (fromName.length > 0) {
    const first = fromName[0][0];
    const last = fromName.length > 1 ? fromName[fromName.length - 1][0] : "";
    return (first + last).toUpperCase();
  }

  const local = (email ?? "").split("@")[0].replace(/[0-9]/g, "");
  const parts = local.split(/[._-]+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0];
  const second = parts.length > 1 ? parts[1][0] : "";
  return (first + second).toUpperCase();
}

function resizeToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      // Recorte cuadrado centrado ("cover")
      const side = Math.min(img.width, img.height);
      const sx = (img.width - side) / 2;
      const sy = (img.height - side) / 2;
      const canvas = document.createElement("canvas");
      canvas.width = SIZE;
      canvas.height = SIZE;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("No se pudo procesar la imagen"));
        return;
      }
      ctx.drawImage(img, sx, sy, side, side, 0, 0, SIZE, SIZE);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("El archivo no es una imagen válida"));
    };
    img.src = url;
  });
}

export function useAvatar(ownerKey: string) {
  const [avatar, setAvatar] = useState<string | null>(null);

  useEffect(() => {
    if (!ownerKey) {
      setAvatar(null);
      return;
    }
    try {
      setAvatar(localStorage.getItem(storageKey(ownerKey)));
    } catch {
      setAvatar(null);
    }
  }, [ownerKey]);

  const upload = useCallback(
    async (file: File) => {
      if (!ALLOWED.includes(file.type))
        throw new Error("Formato no permitido. Usa JPG, PNG, GIF o WEBP.");
      if (file.size > MAX_BYTES) throw new Error("La imagen supera 1 MB.");

      const dataUrl = await resizeToDataUrl(file);
      localStorage.setItem(storageKey(ownerKey), dataUrl);
      setAvatar(dataUrl);
    },
    [ownerKey],
  );

  const remove = useCallback(() => {
    try {
      localStorage.removeItem(storageKey(ownerKey));
    } catch {}
    setAvatar(null);
  }, [ownerKey]);

  return { avatar, upload, remove };
}
