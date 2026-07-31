import { describe, expect, it } from "vitest";
import { formSchema, LoginSchema } from "./auth_zod";

describe("formSchema (signup)", () => {
  const validData = {
    name: "John Doe",
    email: "john@example.com",
    password: "password123",
    confirmPassword: "password123",
  };

  it("accepts valid signup data", () => {
    const result = formSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("rejects a name shorter than 2 characters", () => {
    const result = formSchema.safeParse({ ...validData, name: "J" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "Name must be at least 2 characters long"
      );
    }
  });

  it("rejects an invalid email address", () => {
    const result = formSchema.safeParse({ ...validData, email: "not-an-email" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Invalid email address");
    }
  });

  it("rejects a password shorter than 8 characters", () => {
    const result = formSchema.safeParse({
      ...validData,
      password: "short",
      confirmPassword: "short",
    });
    expect(result.success).toBe(false);
  });

  it("rejects when password and confirmPassword do not match", () => {
    const result = formSchema.safeParse({
      ...validData,
      confirmPassword: "different123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) =>
        i.path.includes("confirmPassword")
      );
      expect(issue?.message).toBe("Passwords do not match");
    }
  });
});

describe("LoginSchema", () => {
  it("accepts a valid email and non-empty password", () => {
    const result = LoginSchema.safeParse({
      email: "john@example.com",
      password: "anything",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid email with the updated error message", () => {
    const result = LoginSchema.safeParse({
      email: "not-an-email",
      password: "anything",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "Please enter a valid email address"
      );
    }
  });

  it("rejects an empty password", () => {
    const result = LoginSchema.safeParse({
      email: "john@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Password is Required");
    }
  });

  it("rejects a missing email field", () => {
    const result = LoginSchema.safeParse({ password: "anything" });
    expect(result.success).toBe(false);
  });
});