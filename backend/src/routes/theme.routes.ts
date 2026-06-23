import { Router } from "express";

export const themeRouter = Router();

themeRouter.get("/", (_req, res) => {
  res.json({
    themes: [
      {
        key: "NORTH_POLE",
        name: "North Pole",
        description:
          "A warm holiday command-center theme with festive reds, greens, and gold accents."
      },
      {
        key: "REBEL_ALLIANCE",
        name: "Rebel Alliance",
        description:
          "A tactical command-console theme with deep space tones and rebel-orange accents."
      },
      {
        key: "SWIFTIE_ERA",
        name: "Swiftie Era",
        description:
          "A bright pop-inspired theme with pastel gradients, soft glow, and bracelet-style energy."
      },
      {
        key: "WINTER_FROST",
        name: "Winter Frost",
        description:
          "A clean icy theme with glassy surfaces, snow tones, and crisp blue accents."
      }
    ]
  });
});