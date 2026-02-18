/* ===================================================================
 * Tests for src/components/EventCard.tsx
 * =================================================================== */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import EventCard from "@/components/EventCard";
import { mockEvent, mockEventSoldOut } from "../mocks/fixtures";

describe("EventCard", () => {
  it("renders event title", () => {
    render(<EventCard event={mockEvent} />);
    expect(screen.getByText("Concerto in Piazza Duomo")).toBeInTheDocument();
  });

  it("renders the date box (day number)", () => {
    render(<EventCard event={mockEvent} />);
    // July 20 => day 20
    expect(screen.getByText("20")).toBeInTheDocument();
  });

  it("renders start time", () => {
    render(<EventCard event={mockEvent} />);
    expect(screen.getByText(/Ore 21:00/)).toBeInTheDocument();
  });

  it("renders doors time when available", () => {
    render(<EventCard event={mockEvent} />);
    expect(screen.getByText(/Porte 20:00/)).toBeInTheDocument();
  });

  it("renders confirmed status badge as DISPONIBILE", () => {
    render(<EventCard event={mockEvent} />);
    expect(screen.getByText("DISPONIBILE")).toBeInTheDocument();
  });

  it("renders sold_out status badge as SOLD OUT", () => {
    render(<EventCard event={mockEventSoldOut} />);
    expect(screen.getByText("SOLD OUT")).toBeInTheDocument();
  });

  it("renders ticket link when ticket_url is present", () => {
    render(<EventCard event={mockEvent} />);
    const ticketLink = screen.getByRole("link", {
      name: /Biglietti per Concerto in Piazza Duomo/,
    });
    expect(ticketLink).toBeInTheDocument();
    expect(ticketLink).toHaveAttribute(
      "href",
      "https://tickets.example.com/event/10",
    );
    expect(ticketLink).toHaveAttribute("target", "_blank");
  });

  it("does not render ticket link when ticket_url is empty", () => {
    render(<EventCard event={mockEventSoldOut} />);
    const noTickets = screen.getByLabelText("Biglietti non disponibili");
    expect(noTickets).toBeInTheDocument();
  });

  it("renders venue name and city via AddressLink", () => {
    render(<EventCard event={mockEvent} />);
    // AddressLink renders venue and city text
    expect(screen.getByText(/Piazza Duomo/)).toBeInTheDocument();
    expect(screen.getByText(/Milano/)).toBeInTheDocument();
  });

  it("does not crash with no venue", () => {
    const eventNoVenue = { ...mockEvent, venue: undefined };
    render(<EventCard event={eventNoVenue} />);
    expect(screen.getByText("Concerto in Piazza Duomo")).toBeInTheDocument();
  });

  it("does not render time section if start_time is null", () => {
    const eventNoTime = { ...mockEvent, start_time: null, doors_time: null };
    render(<EventCard event={eventNoTime} />);
    expect(screen.queryByText(/Ore/)).not.toBeInTheDocument();
  });
});
