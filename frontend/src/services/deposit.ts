import api from "@/lib/api";

export interface DepositPayload {
    amount: string;
    bankAccountId: string;
};

export const createDeposit = async (payload: DepositPayload, idempotencyKey: string) => {
    const { data } = await api.post("/deposit", payload, {
        headers: {
            "Idempotency-Key": idempotencyKey,
        }
    });

    return data;
};

export const getAllDeposits = async () => {
    const { data } = await api.get("/deposit");
    return data;
};

export const getDeposit = async (id: string) => {
    const { data } = await api.get(`/deposit/${id}`);
    return data;
};