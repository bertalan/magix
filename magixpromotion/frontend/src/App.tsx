import React from "react";
import { ViewState, Artist } from "@/types";
import Layout from "./components/Layout";
import HomePage from "./components/HomePage";
import ArtistGrid from "./components/ArtistGrid";
import ArtistDetail from "./components/ArtistDetail";
import EventsPage from "./components/EventsPage";
import BookingPage from "./components/BookingPage";
import BandFinder from "./components/BandFinder";

const App: React.FC = () => {
  const [activeView, setActiveView] = React.useState<ViewState>("HOME");
  const [selectedArtist, setSelectedArtist] = React.useState<Artist | null>(
    null,
  );
  const [currentTheme, setCurrentTheme] = React.useState<
    "electric-night" | "pastel-dream"
  >(() => {
    const saved = localStorage.getItem("magix-theme");
    return saved === "pastel-dream" ? "pastel-dream" : "electric-night";
  });

  const [bookingArtistName, setBookingArtistName] = React.useState<
    string | undefined
  >(undefined);

  // Applica il tema al document
  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme", currentTheme);
    localStorage.setItem("magix-theme", currentTheme);
  }, [currentTheme]);

  const toggleTheme = () => {
    setCurrentTheme((prev) =>
      prev === "electric-night" ? "pastel-dream" : "electric-night",
    );
  };

  const setView = (view: ViewState) => {
    setActiveView(view);
    if (view !== "DETAIL") {
      setSelectedArtist(null);
    }
    if (view !== "BOOKING") {
      setBookingArtistName(undefined);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleArtistClick = (artist: Artist) => {
    setSelectedArtist(artist);
    setActiveView("DETAIL");
  };

  const handleCloseDetail = () => {
    setSelectedArtist(null);
    setActiveView("TALENT");
  };

  /** Naviga a Booking con artista preselezionato (da ArtistDetail) */
  const handleBookArtist = (artistName: string) => {
    setBookingArtistName(artistName);
    setSelectedArtist(null);
    setActiveView("BOOKING");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderView = () => {
    switch (activeView) {
      case "HOME":
        return (
          <HomePage setView={setView} onArtistClick={handleArtistClick} />
        );

      case "TALENT":
        return <ArtistGrid onArtistClick={handleArtistClick} />;

      case "EVENTS":
        return <EventsPage setView={setView} />;

      case "SCOUT":
        return <BandFinder onArtistSelect={handleArtistClick} />;

      case "BOOKING":
        return (
          <BookingPage
            preselectedArtist={bookingArtistName}
          />
        );

      default:
        return (
          <HomePage setView={setView} onArtistClick={handleArtistClick} />
        );
    }
  };

  return (
    <Layout
      activeView={activeView}
      setView={setView}
      currentTheme={currentTheme}
      toggleTheme={toggleTheme}
    >
      {renderView()}

      {/* ArtistDetail overlay (renders on top when DETAIL view is active) */}
      {activeView === "DETAIL" && selectedArtist && (
        <ArtistDetail
          artist={selectedArtist}
          onClose={handleCloseDetail}
          setView={setView}
          onBookArtist={handleBookArtist}
        />
      )}
    </Layout>
  );
};

export default App;
