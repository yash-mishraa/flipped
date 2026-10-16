import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import AboutPage from "@/app/about/page";
import ContactPage from "@/app/contact/page";
import PrivacyPage from "@/app/privacy/page";
import TermsPage from "@/app/terms/page";
import { ContactMailbox } from "@/components/ContactMailbox";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";

// Mock Clerk auth
vi.mock("@clerk/nextjs", () => ({
  useUser: () => ({ isSignedIn: false, user: null }),
  Show: ({ when, children }: { when: string; children: React.ReactNode }) =>
    when === "signed-out" ? <>{children}</> : null,
  UserButton: () => null,
}));

describe("Static Pages, SEO & Contact Mailbox", () => {
  it("renders AboutPage with explicit Times of India attribution and digital improvements", () => {
    render(<AboutPage />);

    expect(screen.getByRole("heading", { name: "About FLIPPED", level: 1 })).toBeInTheDocument();
    expect(
      screen.getByText(/Inspired by Times of India.*Flipped It/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/physical newspaper subscriptions/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Classic Practice Mode/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/flipped\.website/i)
    ).toBeInTheDocument();
  });

  it("renders ContactPage with BorderGlow feedback card and FAQ items", () => {
    render(<ContactPage />);

    expect(
      screen.getByRole("heading", { name: "Contact & Feedback", level: 1 })
    ).toBeInTheDocument();
    expect(screen.getByTestId("contact-mailbox")).toBeInTheDocument();
    expect(
      screen.getByText("Got any feedback or reviews or need anything then click here")
    ).toBeInTheDocument();
    expect(screen.getByText("flippedbyyash@gmail.com")).toBeInTheDocument();
    expect(screen.getByText("Open in Mail App")).toBeInTheDocument();
  });

  it("interacts with ContactMailbox and provides mailto redirect to flippedbyyash@gmail.com", () => {
    render(<ContactMailbox recipientEmail="flippedbyyash@gmail.com" />);

    expect(
      screen.getByText("Got any feedback or reviews or need anything then click here")
    ).toBeInTheDocument();
    expect(screen.getByText("flippedbyyash@gmail.com")).toBeInTheDocument();

    // Verify Mail App link has mailto href
    const mailLink = screen.getByRole("link", { name: /Open in Mail App/i });
    expect(mailLink).toHaveAttribute(
      "href",
      expect.stringContaining("mailto:flippedbyyash@gmail.com")
    );

    // Verify Gmail Web link
    const gmailLink = screen.getByRole("link", { name: /Gmail Web/i });
    expect(gmailLink).toHaveAttribute(
      "href",
      expect.stringContaining("mail.google.com")
    );

    // Copy button
    const copyBtn = screen.getByRole("button", { name: /Copy email address/i });
    expect(copyBtn).toBeInTheDocument();
    fireEvent.click(copyBtn);
  });

  it("renders PrivacyPage with GDPR/CCPA storage disclosures and contact info", () => {
    render(<PrivacyPage />);

    expect(screen.getByRole("heading", { name: "Privacy Policy", level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/Information We Collect & Store/i)).toBeInTheDocument();
    expect(screen.getByText(/Guest Mode \(No Account\)/i)).toBeInTheDocument();
    expect(screen.getAllByText(/flippedbyyash@gmail.com/i)[0]).toBeInTheDocument();
  });

  it("renders TermsPage with fair play rules and Times of India attribution notice", () => {
    render(<TermsPage />);

    expect(screen.getByRole("heading", { name: "Terms of Service", level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/Fair Play & Permitted Use/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Attribution & Source of Inspiration/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Times of India.*Bennett, Coleman & Co\. Ltd\./i)
    ).toBeInTheDocument();
    expect(screen.getAllByText(/flippedbyyash@gmail.com/i)[0]).toBeInTheDocument();
  });

  it("generates robots.txt rules pointing to flipped.website sitemap", () => {
    const robotRules = robots();
    expect(robotRules.sitemap).toBe("https://flipped.website/sitemap.xml");
    expect(robotRules.host).toBe("https://flipped.website");
    expect(Array.isArray(robotRules.rules)).toBe(true);
  });

  it("generates sitemap.xml with canonical flipped.website routes", () => {
    const map = sitemap();
    const urls = map.map((entry) => entry.url);

    expect(urls).toContain("https://flipped.website");
    expect(urls).toContain("https://flipped.website/daily");
    expect(urls).toContain("https://flipped.website/classic");
    expect(urls).toContain("https://flipped.website/archive");
    expect(urls).toContain("https://flipped.website/stats");
    expect(urls).toContain("https://flipped.website/about");
    expect(urls).toContain("https://flipped.website/contact");
    expect(urls).toContain("https://flipped.website/privacy");
    expect(urls).toContain("https://flipped.website/terms");
  });
});
