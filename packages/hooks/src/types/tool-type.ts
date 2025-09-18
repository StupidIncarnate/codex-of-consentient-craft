export type WriteToolInput = {
  file_path: string;
  content: string;
};

export type EditToolInput = {
  file_path: string;
  old_string: string;
  new_string: string;
  replace_all?: boolean;
};

export type MultiEditToolInput = {
  file_path: string;
  edits: Array<{
    old_string: string;
    new_string: string;
    replace_all?: boolean;
  }>;
};

export type ToolInput = WriteToolInput | EditToolInput | MultiEditToolInput;

export type ToolResponse = {
  filePath?: string;
  success?: boolean;
  // Additional fields depend on the specific tool
};
