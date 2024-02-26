import { FlightType } from "../types/flight";
import { HotelType } from "../types/hotel";
import { StateCreator } from "zustand";

export interface ScrapingSlice {
    isScraping: boolean;
    setScraping: (isScraping: boolean) => void;
    scrapingType: "hotel" | "flight" | undefined;
    setScrapingType: (scrapingType: "hotel" | "flight" | undefined) => void;
    scrapingFlights: FlightType[];
    setScrapingScraped: (scrapingScraped: FlightType[]) => void;
    scrapedHotels: HotelType[];
    setScrapedHotels: (scrappedHotels: HotelType[]) => void;
}

export const createScrapingSlice: StateCreator<ScrapingSlice> = (set) => ({
    isScraping: false,
    setScraping: (isScraping: boolean) => set({ isScraping }),
    scrapingType: undefined,
    setScrapingType: (scrapingType: "hotel" | "flight" | undefined) => set({ scrapingType }),
    scrapingFlights: [],
    setScrapingScraped: (scrapingFlights: FlightType[]) => set({ scrapingFlights }),
    scrapedHotels: [],
    setScrapedHotels: (scrapedHotels: HotelType[]) => set({ scrapedHotels }),
})