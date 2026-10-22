  "use client";

  import { useCallback, useEffect, useState } from "react";
  import { deferEffect } from "@/lib/defer-effect";
  import { deliveryService } from "../services/delivery.service";
  import type {
    Delivery,
    DeliveryPerson,
    DeliveryStatus,
  } from "../types/delivery.types";

  export function useBranchDeliveries(branchId: number | null) {
    const [deliveries, setDeliveries] = useState<Delivery[]>([]);
    const [deliveryPersons, setDeliveryPersons] = useState<DeliveryPerson[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [savingId, setSavingId] = useState<number | null>(null);

    const load = useCallback(async (silent = false) => {
      if (branchId == null) {
        setDeliveries([]);
        setDeliveryPersons([]);
        setLoading(false);
        return;
      }
      if (!silent) {
        setLoading(true);
        setError(null);
      }
      try {
        const [deliveriesData, personsData] = await Promise.all([
          deliveryService.getByBranch(branchId),
          deliveryService.getDeliveryPersons(branchId),
        ]);
        setDeliveries(deliveriesData);
        setDeliveryPersons(personsData);
      } catch (err) {
        if (!silent) {
          setError(
            err instanceof Error
              ? err.message
              : "No se pudieron cargar los domicilios",
          );
        }
      } finally {
        setLoading(false);
      }
    }, [branchId]);

    useEffect(() => deferEffect(() => void load()), [load]);



    const updateStatus = useCallback(
      async (deliveryId: number, status: DeliveryStatus) => {
        setSavingId(deliveryId);
        try {
          const updated = await deliveryService.updateStatus(deliveryId, {
            status,
          });
          setDeliveries((prev) =>
            prev.map((d) => (d.id === deliveryId ? updated : d)),
          );
        } finally {
          setSavingId(null);
        }
      },
      [],
    );

    return {
      deliveries,
      deliveryPersons,
      loading,
      error,
      savingId,
      updateStatus,
      reload: load,
    };
  }
