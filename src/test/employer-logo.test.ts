import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useEmployerLogo } from "@/hooks/use-employer-logo";
import { DEFAULT_EMPLOYER_LOGO } from "@/lib/job-branding";

describe("useEmployerLogo", () => {
  it("uses the shared placeholder when the job has no company photo", () => {
    const { result } = renderHook(() => useEmployerLogo(null));
    expect(result.current.src).toBe(DEFAULT_EMPLOYER_LOGO);
  });

  it("keeps the company photo when the job has one", () => {
    const { result } = renderHook(() => useEmployerLogo("https://cdn.example/logo.png"));
    expect(result.current.src).toBe("https://cdn.example/logo.png");
  });

  it("switches to the placeholder when the company photo fails", () => {
    const { result } = renderHook(() => useEmployerLogo("https://cdn.example/logo.png"));
    act(() => result.current.onError());
    expect(result.current.src).toBe(DEFAULT_EMPLOYER_LOGO);
  });

  it("shows no image when even the placeholder fails", () => {
    const { result } = renderHook(() => useEmployerLogo(null));
    act(() => result.current.onError());
    expect(result.current.src).toBeNull();
  });
});
