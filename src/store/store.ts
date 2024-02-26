import { create } from "zustand";
import {
    AuthSlice,
    createAuthSlice,
    ScrapingSlice,
    createScrapingSlice
} from "./slices";

type StoreState = AuthSlice & ScrapingSlice;

export const useStore = create<StoreState>()((...a) => ({
    ...createAuthSlice(...a),
    ...createScrapingSlice(...a),
}))