import { AffDashboardVisibilitySettingEnum, ISettingsState, POINTS_SETTING } from "@ultrade/ultrade-js-sdk";

interface ExtendedThemeObj {
  logo: string;
  name: string;
  active: boolean;
  value: Record<string, string>;
  chartValue: Record<string, string>;
}

interface ExtendedSettingsState extends Omit<ISettingsState, 'theme1' | 'theme2' | 'theme3'> {
  theme1: ExtendedThemeObj;
  theme2: ExtendedThemeObj;
  theme3: ExtendedThemeObj;
}

// export const initialSettingsState: IGetSettingsTransformedResult = {
//   currentTheme: 'theme1',
// }

export const initialSettingsState: ExtendedSettingsState = {
  isUltrade: false,
  companyId: null,
  currentCountry: "",
  feeShare: 0,
  ammFee: 0,
  makerFee: 0,
  minFee: 0,
  takerFee: 0,
  appTitle: "",
  domain: "",
  enabled: "1",
  kycTradeRequirementEnabled: false,
  obdex: true,
  pointSystem: POINTS_SETTING.OFF,
  affiliateDashboardThreshold: "",
  affiliateDefaultFeeShare: "",
  affiliateDashboardVisibility: AffDashboardVisibilitySettingEnum.DISABLED,
  currentTheme: "theme1",
  geoblock: [],
  pinnedPairs: [],
  customMenuItems: [],
  target: "",
  newTab: true,
  reportButtons: true,
  theme1: {
    logo: "https://temp-assets-dev4.s3.amazonaws.com/public/Theme%3DDark.svg",
    name: "Dark",
    active: true,
    value: {
      "main-background": "rgba(1, 1, 1, 1)",
      "primary-text": "rgba(255, 255, 255, 1)",
      "module-background": "rgba(19, 23, 34, 1)",
      "buy-text": "rgba(82, 164, 154, 1)",
      "buy-background": "rgba(2, 199, 122, 0.25)",
      "sell-text": "rgba(221, 94, 86, 1)",
      "sell-background": "rgba(255, 59, 105, 0.25)",
      "secondary-text": "rgba(127, 127, 127, 1)",
      "active-element-default": "rgba(230, 136, 150, 1)",
      "hover-element-default": "rgba(185, 163, 238, 1)",
      "button-disabled": "rgba(111, 113, 118, 1)",
      "input-background-default": "rgba(13, 15, 21, 1)",
      "input-background-hover": "rgba(28, 33, 45, 1)",
      "input-background-disabled": "rgba(25, 29, 41, 1)",
      "input-border-default": "rgba(28, 33, 45, 1)",
      "module-border": "rgba(28, 33, 45, 1)",
      "button-border": "rgba(255, 255, 255, 1)",
      "input-border-active": "rgba(185, 163, 238, 1)",
      "primary-1": "rgba(118, 63, 229, 1)",
      "primary-2": "rgba(249, 132, 146, 1)",
      "pair-active-row": "rgba(28, 33, 45, 1)",
      "dropdown-shadow": "rgb(154, 92, 253, 0.45)",
      "button-text": "rgba(255, 255, 255, 1)"
    },
    chartValue: {
      "bullish_candle_color": "rgba(2, 199, 122, 0.25)",
      "bearish_candle_color": "rgba(221, 94, 86, 1)",
      "bullish_wick_color": "rgba(2, 199, 122, 0.25)",
      "bearish_wick_color": "rgba(221, 94, 86, 1)",
      "bullish_outline_color": "rgba(2, 199, 122, 0.25)",
      "bearish_outline_color": "rgba(221, 94, 86, 1)",
      "line_color": "rgba(41, 98, 255, 1)",
      "chart_background": "rgba(19, 23, 34, 1)",
      "chart_text": "rgba(127, 127, 127, 1)"
    }
  },
  theme2: {
    logo: "https://temp-assets-dev4.s3.amazonaws.com/public/Theme%3DLight.svg",
    name: "Light",
    active: true,
    value: {
      "main-background": "rgba(249, 248, 248, 1)",
      "primary-text": "rgba(0, 0, 0, 1)",
      "module-background":  "rgba(255, 255, 255, 1)",
      "buy-text": "rgba(0, 112, 98, 1)",
      "buy-background": "rgba(0, 112, 98, 0.25)",
      "sell-text": "rgba(195, 12, 1, 1)",
      "sell-background": "rgba(255, 59, 105, 0.25)",
      "secondary-text": "rgba(127, 127, 127, 1)",
      "active-element-default": "rgba(113, 67, 220, 1)",
      "hover-element-default": "rgba(0, 0, 0, 1)",
      "button-disabled": "rgba(203, 199, 199, 1)",
      "input-background-default": "rgba(255, 255, 255, 1)",
      "input-background-hover": "rgba(249, 248, 248, 1)",
      "input-background-disabled": "rgba(249, 248, 248, 1)",
      "input-border-default": "rgba(228, 225, 225, 1)",
      "module-border": "rgba(0, 0, 0, 0)",
      "button-border": "rgba(170, 167, 167, 1)",
      "input-border-active": "rgba(0, 0, 0, 1)",
      "primary-1": "rgba(118, 63, 229, 1)",
      "primary-2": "rgba(249, 132, 146, 1)",
      "pair-active-row": "rgb(249, 248, 248)",
      "dropdown-shadow": "rgb(154, 92, 253, 0.45)",
      "button-text": "rgba(255, 255, 255, 1)"
    },
    chartValue: {
      "bullish_candle_color": "rgba(0, 112, 98, 1)",
      "bearish_candle_color": "rgba(195, 12, 1, 1)",
      "bullish_wick_color": "rgba(0, 112, 98, 1)",
      "bearish_wick_color": "rgba(195, 12, 1, 1)",
      "bullish_outline_color": "rgba(0, 112, 98, 1)",
      "bearish_outline_color": "rgba(195, 12, 1, 1)",
      "line_color": "rgba(41, 98, 255, 1)",
      "chart_background": "rgba(255, 255, 255, 1)",
      "chart_text": "rgba(127, 127, 127, 1)"
    }
  },
  theme3: {
    logo: "https://temp-assets-dev4.s3.amazonaws.com/public/Theme%3DLight.svg",
    name: "Purple",
    active: true,
    value: {
      "main-background": "rgba(254, 250, 255, 1)",
      "primary-text": "rgba(0, 0, 0, 1)",
      "module-background":  "rgba(254, 250, 255, 1)",
      "buy-text": "rgba(0, 112, 98, 1)",
      "buy-background": "rgba(0, 112, 98, 0.25)",
      "sell-text": "rgba(195, 12, 1, 1)",
      "sell-background": "rgba(255, 59, 105, 0.25)",
      "secondary-text": "rgba(127, 127, 127, 1)",
      "active-element-default": "rgba(113, 67, 220, 1)",
      "hover-element-default": "rgba(0, 0, 0, 1)",
      "button-disabled": "rgba(203, 199, 199, 1)",
      "input-background-default": "rgba(255, 255, 255, 1)",
      "input-background-hover": "rgba(249, 248, 248, 1)",
      "input-background-disabled": "rgba(254, 250, 255, 1)",
      "input-border-default": "rgba(228, 225, 225, 1)",
      "module-border": "rgba(0, 0, 0, 0)",
      "button-border": "rgba(170, 167, 167, 1)",
      "input-border-active": "rgba(0, 0, 0, 1)",
      "primary-1": "rgba(118, 63, 229, 1)",
      "primary-2": "rgba(249, 132, 146, 1)",
      "pair-active-row": "rgb(249, 248, 248)",
      "dropdown-shadow": "rgb(154, 92, 253, 0.45)",
      "button-text": "rgba(255, 255, 255, 1)"
    },
    chartValue: {
      "bullish_candle_color": "rgba(0, 112, 98, 1)",
      "bearish_candle_color": "rgba(195, 12, 1, 1)",
      "bullish_wick_color": "rgba(0, 112, 98, 1)",
      "bearish_wick_color": "rgba(195, 12, 1, 1)",
      "bullish_outline_color": "rgba(0, 112, 98, 1)",
      "bearish_outline_color": "rgba(195, 12, 1, 1)",
      "line_color": "rgba(41, 98, 255, 1)",
      "chart_background": "rgba(254, 250, 255, 1)",
      "chart_text": "rgba(127, 127, 127, 1)"
    }
  },
  chartInt: [ "1m", "3m", "5m", "15m", "30m", "1h", "2h", "3h", "1D", "1W", "1M" ],
  chartType: "1"
};