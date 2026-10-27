import type { Settings } from "./types";

export const DEFAULT_SETTINGS: Settings = {
  habits: [
    { id: "h_wake", name: "Wake up by 7" },
    { id: "h_exercise", name: "Exercise 20 min" },
    { id: "h_read", name: "Read 15 min" },
    { id: "h_plan", name: "Plan tomorrow" },
    { id: "h_nophone", name: "No phone in bed" },
  ],
  categories: [
    { id: "c_office", name: "Office" },
    { id: "c_writing", name: "Writing" },
    { id: "c_learning", name: "Learning" },
    { id: "c_personal", name: "Personal" },
    { id: "c_admin", name: "Admin" },
  ],
  areas: [
    { id: "a_career", name: "Career" },
    { id: "a_health", name: "Health" },
    { id: "a_learning", name: "Learning" },
    { id: "a_money", name: "Money" },
    { id: "a_personal", name: "Personal" },
  ],
};
