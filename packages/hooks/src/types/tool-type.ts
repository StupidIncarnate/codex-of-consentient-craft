export interface WriteToolInput {
  file_path: string;
  content: string;
}

export interface EditToolInput {
  file_path: string;
  old_string: string;
  new_string: string;
  replace_all?: boolean;
}

export interface MultiEditToolInput {
  file_path: string;
  edits: {
    old_string: string;
    new_string: string;
    replace_all?: boolean;
  }[];
}

export type ToolInput = WriteToolInput | EditToolInput | MultiEditToolInput;

export interface ToolResponse {
  filePath?: string;
  success?: boolean;
  // Additional fields depend on the specific tool
}
