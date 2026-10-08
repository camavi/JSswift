export interface RuntimeConfig {
  ui?: {
    all?: boolean;
    responsive?: boolean;
    components?: string[];
    services?: Array<'Dialog' | 'Notify' | 'Loading' | 'Form'>;
  };
  extras?: Array<'material-symbols-outlined' | 'nunito-font' | 'tabler'>;
}
export interface NormalizedRuntimeConfig {
  ui: { all: boolean; responsive: boolean; components: string[]; services: string[] };
  extras: string[];
}
export interface RuntimeBuildReport {
  config: NormalizedRuntimeConfig;
  javascript: string[];
  css: string[];
  extras: string[];
  selectiveComponents: boolean;
  components: string[] | 'all';
  services: string[] | 'all';
  reasons: Record<string, string>;
  removedSelectors: number;
  runtimeBytes: number;
  cssBytes: number;
}
export declare const extras: Record<string, string | null>;
export declare function validateConfig(config: RuntimeConfig): NormalizedRuntimeConfig;
export declare function buildConfiguredRuntime(config: RuntimeConfig, output: string, sourceRoot?: string): Promise<RuntimeBuildReport>;
