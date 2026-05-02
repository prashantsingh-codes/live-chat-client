import { configureStore } from "@reduxjs/toolkit";
import themeReducer from "./themeSlice.js";

export const store = configureStore({
    reducer: {
        themeKey: themeReducer
    }
});
