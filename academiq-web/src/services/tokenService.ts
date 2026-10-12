import { supabase } from "./supabase";

export interface RedeemResult {
  success: boolean;
  message: string;
  expires_at?: string;
}

export async function redeemToken(code: string): Promise<RedeemResult> {
  const trimmed = code.trim().toUpperCase();
  const { data, error } = await supabase.rpc("redeem_token", { p_code: trimmed });
  if (error) throw new Error(error.message);
  return data as RedeemResult;
}