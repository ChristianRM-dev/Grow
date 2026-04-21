import { describe, expect, it } from "vitest";
import {
  descriptionFromSnapshotForRegisteredLine,
  getSnapshotDisplayParts,
  inferCustomerModeFromSystemKey,
  splitSnapshot,
} from "./documentSnapshot";

describe("documentSnapshot", () => {
  it("splits snapshot into name and description", () => {
    expect(splitSnapshot("Rosal — Maceta grande")).toEqual({
      name: "Rosal",
      description: "Maceta grande",
    });
  });

  it("returns raw snapshot when there is no separator", () => {
    expect(getSnapshotDisplayParts("Rosal")).toEqual({
      name: "Rosal",
      description: "",
      displayName: "Rosal",
      displayDescription: "—",
    });
  });

  it("strips product name prefix for registered lines", () => {
    expect(
      descriptionFromSnapshotForRegisteredLine(
        "Rosal · Roja — Maceta grande",
        "Rosal · Roja",
      ),
    ).toBe("Maceta grande");
  });

  it("infers public mode from system keys", () => {
    expect(inferCustomerModeFromSystemKey("walk_in_public")).toBe("PUBLIC");
    expect(inferCustomerModeFromSystemKey("customer")).toBe("PARTY");
  });
});
