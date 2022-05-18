/********************************************************************
 * File: Define.js
 * Description: HTMLMergerの定数群
 * Create: 2022/05/17(Tue)
 * Update: 2022/05/17(Tue)
 *******************************************************************/
// 定数
// タグ種類
const TAG_LINK = 0;
const TAG_SCRIPT = 1;

// 開始タグと終了タグ
const TAG_START = [ '<style>', '<script>'];
const TAG_END = [ '</style>', '<' + '/script>'];

// 属性検索に使う正規表現パターン
const ATTR_PATTERN = [ /href=\"[^\"]*\"/g, /src=\"[^\"]*\"/g ];

// printOutputArea()のmode
const PRINT_MODE_NEW = 0;
const PRINT_MODE_APPEND = 1;