import api from "@/lib/api";

interface LinkBankAccountData {
    bankName: string;
    accountHolder: string;
    accountNumber: string;
    ifscCode: string;
};

export const linkBankAccount = async (body: LinkBankAccountData) => {
    const { data } = await api.post("/bank", body);
    return data;
};

export const getAllBankAccounts = async () => {
    const { data } = await api.get("/bank");
    return data;
};

export const getBankAccount = async (id: string) => {
    const { data } = await api.get(`/${id}`);
    return data;
};

export const makePrimaryAccount = async (id: string) => {
    const { data } = await api.patch(`/bank/${id}/primary`);
    return data;
};

export const unlinkAccount = async (id: string) => {
    const { data } = await api.delete(`/bank/${id}`);
    return data;
};