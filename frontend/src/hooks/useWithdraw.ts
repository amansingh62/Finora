import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createWithdrawal,
  getWithdrawal,
  getWithdrawals,
  withdrawPayload,
} from "../services/withdraw";

export const useCreateWithdraw = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      payload,
      idempotencyKey,
    }: {
      payload: withdrawPayload;
      idempotencyKey: string;
    }) =>
      createWithdrawal(
        { ...payload, amount: String(payload.amount) },
        idempotencyKey,
      ),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({ queryKey: ["withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["withdrawal"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
};

export const useGetAllWithdrawals = () => {
  return useQuery({
    queryKey: ["withdrawals"],
    queryFn: getWithdrawals,
  });
};

export const useGetWithdrawal = (id: string) => {
  return useQuery({
    queryKey: ["withdrawal", id],
    queryFn: () => getWithdrawal(id),
    enabled: Boolean(id),
  });
};
