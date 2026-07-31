import { describe, expect, it } from "vitest";
import { POST } from "./route";

describe("POST /api/webhooks/payment", () => {
  it("responds with a 200 status and { received: true }", async () => {
    const request = new Request("http://localhost/api/webhooks/payment", {
      method: "POST",
      body: JSON.stringify({ event: "payment.captured" }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ received: true });
  });

  it("responds the same way regardless of the request body", async () => {
    const request = new Request("http://localhost/api/webhooks/payment", {
      method: "POST",
      body: "not json at all",
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ received: true });
  });
});