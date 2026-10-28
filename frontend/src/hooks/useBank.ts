"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getAllBankAccounts,
  getBankAccount,
  linkBankAccount,
  makePrimaryAccount,
  unlinkAccount,
} from "../services/bank";

export const bankKeys = {
  all: ["bankAccounts"] as const,
  byId: (id: string) => [...bankKeys.all, id] as const,
};

export const useLinkBankAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: linkBankAccount,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: bankKeys.all,
      });
    },
  });
};

export const useGetAllBankAccounts = () => {
  return useQuery({
    queryKey: bankKeys.all,
    queryFn: getAllBankAccounts,
  });
};

export const useGetBankAccount = (id: string) => {
  return useQuery({
    queryKey: bankKeys.byId(id),
    queryFn: () => getBankAccount(id),
    enabled: Boolean(id),
  });
};

export const useMakePrimaryAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: makePrimaryAccount,

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: bankKeys.all,
      });
    },
  });
};

export const useUnlinkAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: unlinkAccount,

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: bankKeys.all,
      });
    },
  });
};
