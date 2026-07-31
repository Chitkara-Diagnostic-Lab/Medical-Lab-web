import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const schemaPath = path.resolve(__dirname, "schema.prisma");
const schema = fs.readFileSync(schemaPath, "utf-8");

function extractModel(name: string): string {
  const match = schema.match(new RegExp(`model ${name} \\{([\\s\\S]*?)\\n\\}`));
  if (!match) {
    throw new Error(`Model ${name} not found in schema.prisma`);
  }
  return match[1];
}

describe("User model", () => {
  const userModel = extractModel("User");

  it("renamed PhoneNumber to phone_number", () => {
    expect(userModel).toMatch(/\bphone_number\s+String\?/);
  });

  it("no longer has the old PascalCase PhoneNumber field", () => {
    expect(userModel).not.toMatch(/\bPhoneNumber\s+String\?/);
  });
});

describe("Test model", () => {
  const testModel = extractModel("Test");

  it("no longer has a direct relation to Timeslot (slots field removed)", () => {
    expect(testModel).not.toMatch(/\bslots\s+Timeslot\[\]/);
  });

  it("still keeps its relation to AppointmentItem", () => {
    expect(testModel).toMatch(/\bappointmentItems\s+AppointmentItem\[\]/);
  });
});

describe("Timeslot model", () => {
  const timeslotModel = extractModel("Timeslot");

  it("no longer has a relation back to Test (test/testId fields removed)", () => {
    expect(timeslotModel).not.toMatch(/\btest\s+Test\?/);
    expect(timeslotModel).not.toMatch(/\btestId\s+String\?/);
  });

  it("still has its appointments relation and capacity fields", () => {
    expect(timeslotModel).toMatch(/\bappointments\s+Appointment\[\]/);
    expect(timeslotModel).toMatch(/\bmaxPatients\s+Int/);
  });
});

describe("Payment model", () => {
  it("has an explicit @@map(\"payment\") directive", () => {
    const paymentModel = extractModel("Payment");
    expect(paymentModel).toMatch(/@@map\("payment"\)/);
  });
});

describe("Role enum", () => {
  it("no longer defines a LAB_STAFF role", () => {
    const roleEnumMatch = schema.match(/enum Role \{([\s\S]*?)\n\}/);
    expect(roleEnumMatch).not.toBeNull();
    const roleEnum = roleEnumMatch![1];
    expect(roleEnum).not.toMatch(/LAB_STAFF/);
    expect(roleEnum).toMatch(/USER/);
    expect(roleEnum).toMatch(/ADMIN/);
  });
});