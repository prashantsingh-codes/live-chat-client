import { createSlice } from "@reduxjs/toolkit";

// ✅ Read saved theme from localStorage on app start (true = light, false = dark)
const savedTheme = localStorage.getItem("theme");
const initialState = savedTheme !== null ? savedTheme === "light" : true;

export const themeSlice = createSlice({
    name: "themeSlice",
    initialState,
    reducers: {
        toggleTheme: (state) => {
            const next = !state;
            // ✅ Persist to localStorage so refresh remembers the theme
            localStorage.setItem("theme", next ? "light" : "dark");
            return next;
        }
    }
});

export const { toggleTheme } = themeSlice.actions;
export default themeSlice.reducer;