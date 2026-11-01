import api from "@/lib/api";

export interface withdrawPayload {
    amount: string;
    bankAccountId: string;
};

export const createWithdrawal = async (payload: withdrawPayload, idempotencyKey: string) => {
    const { data } = await api.post("/withdraw", payload, {
        headers: {
            "Idempotency-Key": idempotencyKey,
        }
    });

    return data;
};

export const getWithdrawals = async () => {
    const { data } = await api.get("/withdraw");
    return data;
};

export const getWithdrawal = async (id: string) => {
   const { data } = await api.get(`/withdraw/${id}`);
   return data;
};