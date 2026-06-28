export type OrderSummary = {
  items_total: number;
  delivery_fee: number;
  addons_total: number;
  grand_total: number;
  currency: string;
};

export type OrderResult = {
  checkout_url: string;
  order_ref: string;
  summary: OrderSummary;
  expires_at: string;
};

export type OrderFormData = {
  quantity: number;
  icingText: string;
  giftMessage: string;
  recipientName: string;
  recipientPhone: string;
  address: string;
  city: string;
  locationType: "house" | "apartment" | "office" | "other";
  deliveryDate: string;
  instructions: string;
  senderName: string;
  anonymous: boolean;
};

export function tomorrowLK(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Colombo" });
}

export function todayLK(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Colombo" });
}

export function validateOrderForm(
  data: OrderFormData,
): string | null {
  if (!data.recipientName.trim()) return "Recipient name is required.";
  if (!data.recipientPhone.trim()) return "Recipient phone number is required.";
  if (!data.address.trim()) return "Delivery address is required.";
  if (!data.city.trim()) return "Delivery city is required.";
  if (!data.deliveryDate) return "Delivery date is required.";
  if (data.deliveryDate < todayLK()) return "Delivery date cannot be in the past.";
  if (!data.senderName.trim()) return "Sender name is required.";
  return null;
}

export async function submitOrder(
  productId: string,
  data: OrderFormData,
  isCake: boolean,
): Promise<OrderResult> {
  const res = await fetch("/api/mcp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "call-tool",
      toolName: "kapruka_create_order",
      args: {
        params: {
          cart: [
            {
              product_id: productId,
              quantity: data.quantity,
              ...(isCake && data.icingText.trim()
                ? { icing_text: data.icingText.trim() }
                : {}),
            },
          ],
          recipient: {
            name: data.recipientName.trim(),
            phone: data.recipientPhone.trim(),
          },
          delivery: {
            address: data.address.trim(),
            city: data.city.trim(),
            location_type: data.locationType,
            date: data.deliveryDate,
            instructions: data.instructions.trim() || null,
          },
          sender: { name: data.senderName.trim(), anonymous: data.anonymous },
          gift_message: data.giftMessage.trim() || null,
          response_format: "json",
        },
      },
    }),
  });

  const outer = (await res.json()) as {
    success: boolean;
    error?: string;
    result?: { content?: { type: string; text?: string }[] };
  };

  if (!outer.success) throw new Error(outer.error ?? "Order failed");

  const text =
    outer.result?.content?.find((c) => c.type === "text")?.text ?? "{}";
  const data2 = JSON.parse(text) as OrderResult & { error?: string };

  if (data2.error) throw new Error(data2.error);
  if (!data2.checkout_url) throw new Error("No checkout URL in response");

  return data2;
}
