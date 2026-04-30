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
  | 'noTaskSelectedDesc'
  | 'toastSaveSuccess'
  | 'toastSaveError'
  | 'toastImportSuccess'
  | 'toastImportError'
  | 'toastExportSuccess'
  | 'toastExportError'
  | 'toastDeleteSuccess'
  | 'toastAddSuccess'
  | 'toastUndoSuccess'
  | 'toastRedoSuccess'
  | 'commandPalettePlaceholder'
  | 'commandNoResults'
  | 'cmdNavigate'
  | 'cmdExecute'
  | 'cmdClose'
  | 'quickAddPlaceholder'
  | 'quickAddHint'
  | 'themeAuto'
  | 'themeLight'
  | 'themeDark'
  | 'advancedFilter'
  | 'filterEnabled'
  | 'filterDisabled'
  | 'filterAddCondition'
  | 'filterClearAll'
  | 'filterNoConditions'
  | 'filterOperatorContains'
  | 'filterOperatorEquals'
  | 'filterOperatorGt'
  | 'filterOperatorLt'
  | 'filterOperatorIsEmpty'
  | 'filterOperatorIsNotEmpty'
  | 'kanban'
  | 'addDependency'
  | 'removeDependency'
  | 'dependencyBlocked'
  | 'dependencyBlocking'
  | 'calendar'
  | 'gantt'
  | 'manageTags'
  | 'addTag'
  | 'editTag'
  | 'deleteTag'
  | 'tagColor'
  | 'noTags'
  | 'dragHint'
  | 'multiSelectDrag'
  | 'calendar'
  | 'gantt'
  | 'manageTags'
  | 'addTag'
  | 'editTag'
  | 'deleteTag'
  | 'tagColor'
  | 'reminderPermission'
  | 'reminderEnabled'
  | 'reminderDisabled'
  | 'recurringDaily'
  | 'recurringWeekly'
  | 'recurringMonthly'
  | 'recurringYearly'
  | 'cloudSyncDisabled'
  | 'cloudSyncEnabled'
  | 'syncing';

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
    toastSaveSuccess: '保存成功',
    toastSaveError: '保存失败',
    toastImportSuccess: '导入成功',
    toastImportError: '导入失败：无效的文件格式',
    toastExportSuccess: '导出成功',
    toastExportError: '导出失败',
    toastDeleteSuccess: '删除成功',
    toastAddSuccess: '添加成功',
    toastUndoSuccess: '撤销',
    toastRedoSuccess: '重做',
    commandPalettePlaceholder: '输入命令或搜索...',
    commandNoResults: '没有找到匹配的命令',
    cmdNavigate: '导航',
    cmdExecute: '执行',
    cmdClose: '关闭',
    quickAddPlaceholder: '输入任务名称...',
    quickAddHint: '支持 #标签 @项目 语法',
    themeAuto: '自动',
    themeLight: '浅色',
    themeDark: '深色',
    advancedFilter: '高级筛选',
    filterEnabled: '已启用',
    filterDisabled: '启用',
    filterAddCondition: '添加条件',
    filterClearAll: '清除所有条件',
    filterNoConditions: '暂无筛选条件',
    filterOperatorContains: '包含',
    filterOperatorEquals: '等于',
    filterOperatorGt: '大于',
    filterOperatorLt: '小于',
    filterOperatorIsEmpty: '为空',
    filterOperatorIsNotEmpty: '不为空',
    kanban: '看板',
    addDependency: '添加依赖',
    removeDependency: '移除依赖',
    dependencyBlocked: '被阻塞',
    dependencyBlocking: '阻塞',
    manageTags: '管理标签',
    addTag: '添加标签',
    editTag: '编辑标签',
    deleteTag: '删除标签',
    tagColor: '标签颜色',
    noTags: '暂无标签',
    dragHint: '拖拽提示',
    multiSelectDrag: '多选拖拽',
    calendar: '日历',
    gantt: '甘特图',
    reminderPermission: '通知权限',
    reminderEnabled: '提醒已启用',
    reminderDisabled: '提醒已禁用',
    recurringDaily: '每日',
    recurringWeekly: '每周',
    recurringMonthly: '每月',
    recurringYearly: '每年',
    cloudSyncDisabled: '云同步未启用',
    cloudSyncEnabled: '云同步已启用',
    syncing: '同步中...',
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
    toastSaveSuccess: 'Saved successfully',
    toastSaveError: 'Save failed',
    toastImportSuccess: 'Imported successfully',
    toastImportError: 'Import failed: invalid file format',
    toastExportSuccess: 'Exported successfully',
    toastExportError: 'Export failed',
    toastDeleteSuccess: 'Deleted successfully',
    toastAddSuccess: 'Added successfully',
    toastUndoSuccess: 'Undone',
    toastRedoSuccess: 'Redone',
    commandPalettePlaceholder: 'Type a command or search...',
    commandNoResults: 'No matching commands',
    cmdNavigate: 'Navigate',
    cmdExecute: 'Execute',
    cmdClose: 'Close',
    quickAddPlaceholder: 'Type task name...',
    quickAddHint: 'Supports #tag @project syntax',
    themeAuto: 'Auto',
    themeLight: 'Light',
    themeDark: 'Dark',
    advancedFilter: 'Advanced Filter',
    filterEnabled: 'Enabled',
    filterDisabled: 'Enable',
    filterAddCondition: 'Add condition',
    filterClearAll: 'Clear all',
    filterNoConditions: 'No filter conditions',
    filterOperatorContains: 'Contains',
    filterOperatorEquals: 'Equals',
    filterOperatorGt: 'Greater than',
    filterOperatorLt: 'Less than',
    filterOperatorIsEmpty: 'Is empty',
    filterOperatorIsNotEmpty: 'Is not empty',
    kanban: 'Kanban',
    addDependency: 'Add Dependency',
    removeDependency: 'Remove Dependency',
    dependencyBlocked: 'Blocked',
    dependencyBlocking: 'Blocking',
    manageTags: 'Manage Tags',
    addTag: 'Add Tag',
    editTag: 'Edit Tag',
    deleteTag: 'Delete Tag',
    tagColor: 'Tag Color',
    noTags: 'No tags',
    dragHint: 'Drag hint',
    multiSelectDrag: 'Multi-select drag',
    calendar: 'Calendar',
    gantt: 'Gantt',
    reminderPermission: 'Notification Permission',
    reminderEnabled: 'Reminders enabled',
    reminderDisabled: 'Reminders disabled',
    recurringDaily: 'Daily',
    recurringWeekly: 'Weekly',
    recurringMonthly: 'Monthly',
    recurringYearly: 'Yearly',
    cloudSyncDisabled: 'Cloud sync disabled',
    cloudSyncEnabled: 'Cloud sync enabled',
    syncing: 'Syncing...',
  },
};

export function t(locale: Locale, key: TranslationKey): string {
  return translations[locale][key];
}
