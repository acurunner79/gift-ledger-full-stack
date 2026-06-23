import { northPoleTheme } from "./northPole";
import { rebelAllianceTheme } from "./rebelAlliance";
import { swiftieEraTheme } from "./swiftieEra";
import { winterFrostTheme } from "./winterFrost";

export type ThemePreference =
  | "NORTH_POLE"
  | "REBEL_ALLIANCE"
  | "SWIFTIE_ERA"
  | "WINTER_FROST";

export type AppTheme = {
  key: ThemePreference;
  name: string;
  description: string;
  tokens: {
    background: string;
    surface: string;
    surfaceAlt: string;
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    mutedText: string;
    border: string;
    success: string;
    warning: string;
    danger: string;
  };
};

export const appThemes: AppTheme[] = [
  northPoleTheme,
  rebelAllianceTheme,
  swiftieEraTheme,
  winterFrostTheme
];

export const themes = appThemes;

export const themeOptions = appThemes;

export function getThemeByPreference(themePreference?: ThemePreference | null) {
  return (
    appThemes.find((theme) => theme.key === themePreference) ?? northPoleTheme
  );
}

export {
  northPoleTheme,
  rebelAllianceTheme,
  swiftieEraTheme,
  winterFrostTheme
};