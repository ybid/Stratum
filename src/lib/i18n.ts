import type { Locale } from './types';

type TranslationKey =
  | 'appTitle'
  | 'addRow'
  | 'addColumn'
  | 'deleteColumn'
  | 'configureColumn'
  | 'columnName'
  | 'columnType'
  | 'enumOptions'
  | 'save'
  | 'cancel'
  | 'delete'
  | 'outline'
  | 'flat'
  | 'text'
  | 'datetime'
  | 'enum'
  | 'number'
  | 'checkbox'
  | 'confirmDeleteColumn'
  | 'untitled'
  | 'addDirectory'
  | 'addTask'
  | 'directory'
  | 'task'
  | 'rename'
  | 'confirmDeleteDirectory'
  | 'confirmDeleteTask'
  | 'noTaskSelected'
  | 'noTaskSelectedDesc';

const translations: Record<Locale, Record<TranslationKey, string>> = {
  zh: {
    appTitle: 'Stratum',
    addRow: '添加行',
    addColumn: '添加列',
    deleteColumn: '删除列',
    configureColumn: '配置列',
    columnName: '列名',
    columnType: '列类型',
    enumOptions: '枚举选项',
    save: '保存',
    cancel: '取消',
    delete: '删除',
    outline: '大纲',
    flat: '平铺',
    text: '文本',
    datetime: '日期时间',
    enum: '枚举',
    number: '数字',
    checkbox: '复选框',
    confirmDeleteColumn: '确定删除此列？',
    untitled: '无标题',
    addDirectory: '添加目录',
    addTask: '添加任务',
    directory: '目录',
    task: '任务',
    rename: '重命名',
    confirmDeleteDirectory: '确定删除此目录及其所有任务？',
    confirmDeleteTask: '确定删除此任务？',
    noTaskSelected: '未选择任务',
    noTaskSelectedDesc: '从侧边栏选择或创建一个任务',
  },
  en: {
    appTitle: 'Stratum',
    addRow: 'Add Row',
    addColumn: 'Add Column',
    deleteColumn: 'Delete Column',
    configureColumn: 'Configure Column',
    columnName: 'Column Name',
    columnType: 'Column Type',
    enumOptions: 'Enum Options',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    outline: 'Outline',
    flat: 'Flat',
    text: 'Text',
    datetime: 'Datetime',
    enum: 'Enum',
    number: 'Number',
    checkbox: 'Checkbox',
    confirmDeleteColumn: 'Delete this column?',
    untitled: 'Untitled',
    addDirectory: 'Add Directory',
    addTask: 'Add Task',
    directory: 'Directory',
    task: 'Task',
    rename: 'Rename',
    confirmDeleteDirectory: 'Delete this directory and all its tasks?',
    confirmDeleteTask: 'Delete this task?',
    noTaskSelected: 'No Task Selected',
    noTaskSelectedDesc: 'Select or create a task from the sidebar',
  },
};

export function t(locale: Locale, key: TranslationKey): string {
  return translations[locale][key];
}
