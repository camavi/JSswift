export interface RuntimeConfig {
  ui?: {
    all?: boolean;
    auto?: boolean | string[];
    responsive?: boolean;
    components?: string[];
    services?: Array<'Dialog' | 'Notify' | 'Loading' | 'Form'>;
  };
  /** Automatically include Material Symbols CSS when Icon is in the runtime. */
  icons?: boolean;
  report?: 'compact' | 'full';
  extras?: Array<'material-symbols-outlined' | 'nunito-font' | 'tabler'>;
}
export interface NormalizedRuntimeConfig {
  ui: { all: boolean; auto: boolean | string[]; responsive: boolean; components: string[]; services: string[] };
  icons: boolean;
  report: 'compact' | 'full';
  extras: string[];
}
export interface RuntimeBuildReport {
  config: NormalizedRuntimeConfig;
  discovery: { files?: string[]; roots?: string[]; fileCount?: number; rootCount?: number; components: string[]; services: string[] };
  javascript: string[];
  css: string[];
  extras: string[];
  selectiveComponents: boolean;
  components: string[] | 'all';
  services: string[] | 'all';
  reasons?: Record<string, string>;
  cssAnalysis: null | { inputBytes: number; outputBytes: number; removedSelectors: number;
    retainedRules: Record<'owned' | 'sharedOrUnknown' | 'complex' | 'keyframes', number>;
    retainedRuleBytes: Record<'owned' | 'sharedOrUnknown' | 'complex' | 'keyframes', number> };
  removedSelectors: number;
  runtimeBytes: number;
  cssBytes: number;
}
export declare const extras: Record<string, string | null>;
export declare function validateConfig(config: RuntimeConfig): NormalizedRuntimeConfig;
export declare function resolveIconAssets(config: NormalizedRuntimeConfig, selection: { components: string[] } | null): void;
export declare function buildConfiguredRuntime(config: RuntimeConfig, output: string, sourceRoot?: string, projectRoot?: string): Promise<RuntimeBuildReport>;
