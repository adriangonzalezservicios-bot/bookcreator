declare module 'mammoth' {
  export interface MammothResult {
    value: string;
    messages: Array<{ type: string; message: string }>;
  }

  export function extractRawText(input: { arrayBuffer: ArrayBuffer }): Promise<MammothResult>;
  export function convertToMarkdown(input: { arrayBuffer: ArrayBuffer }): Promise<MammothResult>;
  export function convertToHtml(input: { arrayBuffer: ArrayBuffer }): Promise<MammothResult>;

  const mammoth: {
    extractRawText: typeof extractRawText;
    convertToMarkdown: typeof convertToMarkdown;
    convertToHtml: typeof convertToHtml;
  };
  export default mammoth;
}
