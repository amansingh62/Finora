
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createDeposit, getAllDeposits, getDeposit, type DepositPayload } from "../services/deposit";

export const useCreateDeposit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      payload,
      idempotencyKey,
    }: {
      payload: DepositPayload;
      idempotencyKey: string;
    }) =>
      createDeposit(
        {
          ...payload,
          amount: String(payload.amount),
        },
        idempotencyKey
      ),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({ queryKey: ["deposits"] });
      queryClient.invalidateQueries({ queryKey: ["deposit"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
};

export const useGetAllDeposits = () => {
    return useQuery({
        queryKey: ["deposits"],
        queryFn: getAllDeposits
    })
};

export const useGetDeposit = (id: string) => {
    return useQuery({
        queryKey: ["deposit", id],
        queryFn: () => getDeposit(id)
    })
};