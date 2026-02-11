export interface PredefinedStep {
  name: string;
  description: string;
  icon?: string;
  category?: string;
}

export const PREDEFINED_STEPS: PredefinedStep[] = [
  {
    name: "Clean Text",
    description: "Remove special characters and extra whitespace",
    icon: "🧹",
    category: "Text Cleaning",
  },
  {
    name: "Summarize",
    description: "Create a concise summary of the text",
    icon: "📝",
    category: "Analysis",
  },
  {
    name: "Extract Key Points",
    description: "Pull out the main points as a bullet list",
    icon: "💎",
    category: "Analysis",
  },
  {
    name: "Tag Category",
    description: "Classify text into categories (e.g., business, tech, lifestyle)",
    icon: "🏷️",
    category: "Classification",
  },
];
