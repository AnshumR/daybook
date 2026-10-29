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
    { id: "c_exercise", name: "Exercise" },
    { id: "c_creative", name: "Painting & video" },
    { id: "c_coding", name: "Coding" },
    { id: "c_personal", name: "Personal" },
  ],
  areas: [
    { id: "a_career", name: "Career" },
    { id: "a_health", name: "Health" },
    { id: "a_learning", name: "Learning" },
    { id: "a_money", name: "Money" },
    { id: "a_personal", name: "Personal" },
  ],
  prefs: {},
  recurring: [
    { id: "r_dsm", text: "DSM", category_id: "c_office", priority: "high" },
    { id: "r_silk", text: "Aerial silk", category_id: "c_exercise", priority: "medium" },
    { id: "r_yoga", text: "Yoga", category_id: "c_exercise", priority: "medium" },
    { id: "r_aerial_video", text: "Learn from aerial videos", category_id: "c_exercise", priority: "low" },
    { id: "r_dance", text: "Dance practice", category_id: "c_exercise", priority: "medium" },
    { id: "r_python", text: "Python practice", category_id: "c_coding", priority: "medium" },
    { id: "r_learning", text: "Learning (course or reading)", category_id: "c_coding", priority: "low" },
  ],
  donts: [
    { id: "d_movies", name: "Watching movies" },
    { id: "d_bed", name: "Sitting on the bed in the day" },
    { id: "d_food", name: "Ordering food" },
  ],
};
