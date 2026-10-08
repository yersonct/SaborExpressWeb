import { http } from "@/config/api";
import type {
  Delivery,
  DeliveryPerson,
  CreateDeliveryPayload,
  UpdateDeliveryStatusPayload,
} from "../types/delivery.types";

export const deliveryService = {
  // GET /api/Deliveries/branch/{branchId} — Gerente (cualquiera) o Administrador (solo la suya)
  getByBranch: async (branchId: number): Promise<Delivery[]> => {
    const { data } = await http.get<Delivery[]>(
      `/Deliveries/branch/${branchId}`,
    );
    return data;
  },

  // GET /api/Deliveries/branch/{branchId}/delivery-persons
  getDeliveryPersons: async (branchId: number): Promise<DeliveryPerson[]> => {
    const { data } = await http.get<DeliveryPerson[]>(
      `/Deliveries/branch/${branchId}/delivery-persons`,
    );
    return data;
  },

  // POST /api/Deliveries — Gerente o Administrador
  create: async (payload: CreateDeliveryPayload): Promise<Delivery> => {
    const { data } = await http.post<Delivery>("/Deliveries", payload);
    return data;
  },

  // PATCH /api/Deliveries/{id}/status
  updateStatus: async (
    id: number,
    payload: UpdateDeliveryStatusPayload,
  ): Promise<Delivery> => {
    const { data } = await http.patch<Delivery>(
      `/Deliveries/${id}/status`,
      payload,
    );
    return data;
  },
};
