"use client";

import { useCallback, useEffect, useState } from "react";
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
  const [assigning, setAssigning] = useState(false);

  const load = useCallback(async () => {
    if (branchId == null) {
      setDeliveries([]);
      setDeliveryPersons([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [deliveriesData, personsData] = await Promise.all([
        deliveryService.getByBranch(branchId),
        deliveryService.getDeliveryPersons(branchId),
      ]);
      setDeliveries(deliveriesData);
      setDeliveryPersons(personsData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar los domicilios",
      );
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    load();
  }, [load]);

  const assignDelivery = useCallback(
    async (orderId: number, deliveryPersonId: number) => {
      setAssigning(true);
      try {
        await deliveryService.create({ orderId, deliveryPersonId });
        await load();
      } finally {
        setAssigning(false);
      }
    },
    [load],
  );

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
    assigning,
    assignDelivery,
    updateStatus,
    reload: load,
  };
}
