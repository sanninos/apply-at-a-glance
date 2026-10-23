import { createElement } from "react";
import { render, screen } from "@testing-library/react";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useEmployerLogo } from "@/hooks/use-employer-logo";
import { DEFAULT_EMPLOYER_LOGO } from "@/lib/job-branding";

function LogoTest({ photo }: { photo: string | null }) {
  const { src, ref, onError } = useEmployerLogo(photo);
  return src
    ? createElement("img", { ref, src, alt: "logo", "data-testid": "logo", onError })
    : createElement("span", { "data-testid": "logo" });
}

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

  it("replaces a company photo whose load fails with the placeholder", () => {
    render(createElement(LogoTest, { photo: "https://cdn.example/logo.png" }));
    act(() => screen.getByTestId("logo").dispatchEvent(new Event("error")));
    expect(screen.getByTestId("logo").getAttribute("src")).toBe(DEFAULT_EMPLOYER_LOGO);
  });

  it("shows no image when the placeholder itself reports an error", () => {
    render(createElement(LogoTest, { photo: null }));
    act(() => screen.getByTestId("logo").dispatchEvent(new Event("error")));
    expect(screen.getByTestId("logo").tagName).toBe("SPAN");
  });
});
