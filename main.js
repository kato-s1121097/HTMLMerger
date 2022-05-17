/**************************************************
 * File: main.js
 * Description: HTMLMergerのメイン部分
 * Create: 2022/05/17(Tue)
 * Update: 2022/05/17(Tue)
 **************************************************/
/********************************************************************
 * Function: printOutputArea
 * Description: #output-areaへstrをmodeで出力する
 * Params: str = 出力する文字列, mode = 出力モード（新規or追加）
 *******************************************************************/
function printOutputArea( str, mode )
{
	let output_area = document.querySelector( '#output-area' );

	if ( mode === PRINT_MODE_NEW ) output_area.innerHTML = '';

	output_area.innerHTML += str;
}

/*******************************************************************
 * Function: outputFileNames
 * Description: 参照ファイル名を出力エリアと参照ファイルテキストボックスへ出力
 * params: filenames = 出力するファイル名の配列
 *******************************************************************/
function outputFileNames( filenames )
{
	let ref_files_text = document.querySelector( '#ref-files-text' );

	// 参照ファイルテキストボックスの内容を初期化
	ref_files_text.value = "";
	
	// ファイルの通し番号の初期化(出力エリアへの出力用)
	let num = 1;

	// 出力
	printOutputArea( "参照されているスタイル＆スクリプトファイル<br>", PRINT_MODE_NEW );

	// 全ての参照ファイル名に対して処理
	filenames.forEach( ( filename ) => {
		// 出力エリアと参照ファイルテキストボックスへ参照ファイル名を出力
		// 参照ファイルテキストボックスは/のままだと上手く参照されないため\に置換
		printOutputArea( `${num++}: ${filename}<br>`, PRINT_MODE_APPEND );
		ref_files_text.value += `"${filename.replace( '/', '\\' )}" `;
	});
}

/******************************************************************
 * Function: getTags
 * Description: srcから正規表現マッチングによって外部ファイル参照タグを取得し、呼び出し元に戻す
 * Params: src = 参照タグを探し出す元ソースのテキスト
 ******************************************************************/
function getTags( src )
{
	let tags = [];

	// linkタグを取得
	let link_tags = src.match( /<link[^>]*>/g );

	// linkタグが存在していたら結果にタグオブジェクトを追加
	if ( link_tags )
	{
		link_tags.forEach( ( link_tag ) => {
			tags.push( { data: link_tag, type: TAG_LINK } );
		});
	}

	// scriptタグを取得
	let script_tags = src.match( /<script[^>]*>([^<]*<\/script>)?/g );

	// scriptタグが存在していたら結果にタグオブジェクトを追加
	if ( script_tags )
	{
		script_tags.forEach( ( script_tag ) => {
			tags.push( { data: script_tag, type: TAG_SCRIPT } );
		});
	}

	return tags;
}

/***************************************************************
 * Function: getFileNames
 * Description: tagsから正規表現マッチングによりファイル名を取得し、呼び出し元へ返す
 * Params: tags = タグの文字列を集めた配列
 ***************************************************************/
function getFileNames( tags )
{
	// ファイル名
	let filenames = [];

	// 全てのタグに対して処理
	tags.forEach( ( tag ) => {
		// 属性＞ダブルクォーテーション＞URLの順で抜き出し、URLをファイル名の配列に追加
		let attr = tag.data.match( ATTR_PATTERN[tag.type] );

		// 属性が無い = 埋め込みスクリプトだったら飛ばす
		if ( !attr ) return;

		let quot = attr[0].match( /\"[^\"]*\"/g );
		let url = quot[0].match( /(?<=\").*(?=\")/g );
		filenames.push( url[0] );
	});

	return filenames;
}

/**************************************************************
 * Function: downloadMergedFile
 * Description: textをデータとして持つファイル名filenameのテキストファイルをダウンロードする
 * Params: text = ダウンロードするファイルに持たせるテキスト
 * 			filename = ダウンロードするファイル名
 **************************************************************/
function downloadMergedFile( text, filename )
{
	const blob = new Blob( [text], { type: 'text/plain' } );
	const link = document.createElement( 'a' );
	link.href = URL.createObjectURL( blob );

	// 拡張子がHTMLなら拡張子の部分をMerged.htmlに置換
	if ( filename.match( /\.html/ ) !== null )
	{
		link.download = filename.replace( /\.html/, 'Merged.html' );
	}
	else
	{
		link.download = filename + 'Merged.html';
	}

	link.click();
}

// イベントハンドラ間で共有するグローバル変数
var g_tags;
var g_src;
var g_src_filename;
var g_rest_files;

/********************************************************************
 * 参照ファイルの選択がされた際のイベントハンドラ
 * 元ファイルに参照ファイルをマージしたファイルのダウンロードを行う
 ********************************************************************/
const ref_files = document.querySelector( '#ref-files' );
ref_files.onchange = ( e ) => {
	let files = e.target.files;

	// 残りファイル数を初期化
	g_rest_files = files.length;

	// 全てのファイルに対して処理
	for ( let i = 0; i < files.length; i++ )
	{
		let reader = new FileReader();
		reader.readAsText( files[i] );
		reader.onload = () => {
			// 読み込みタグの部分をファイルの内容で置換
			let pattern = new RegExp( g_tags[i].data, 'g' );
			g_src = g_src.replace( pattern, `${TAG_START[g_tags[i].type]}${reader.result}${TAG_END[g_tags[i].type]}` );

			// 全てのファイルを処理し終わったらマージ済みファイルをダウンロード
			if ( --g_rest_files <= 0 ) downloadMergedFile( g_src, g_src_filename );
		}
	}
}

/***********************************************************************
 * 元ファイルが選択された際のイベントハンドラ
 * グローバル変数に元ファイルの情報を格納したり、参照ファイルの選択ボタンを表示する
 ***********************************************************************/
const src_html = document.querySelector( '#src-html' );
src_html.onchange = ( e ) => {
	let file = e.target.files;

	// ファイルオープンに失敗orキャンセルされたら何もせず終了
	if ( file.length <= 0 ) return;

	// 元ファイルを読み込み
	let reader = new FileReader();
	reader.readAsText( file[0] );

	// 元ファイルの読み込みが完了
	reader.onload = ( e ) => 
	{
		// 参照ファイルエリアを非表示(参照ファイルが無かった時に表示しておきたくない)
		const ref_area = document.querySelector( '.ref-area' );
		ref_area.style.display = 'none';

		// 読み込みタグや参照ファイル名を取得
		let tags = getTags( reader.result );
		// 参照ファイルが無ければ参照ファイルが無い事を出力して終了
		if ( tags.length <= 0 )
		{
			printOutputArea( '参照しているファイルはありません', PRINT_MODE_NEW );
			return;
		}

		let filenames = getFileNames( tags );
		// 埋め込みタグのみだった場合
		if ( filenames.length <= 0 )
		{
			printOutputArea( '参照しているファイルはありません', PRINT_MODE_NEW );
			return;
		}

		// 元ファイル名をグローバル変数に格納
		g_src_filename = file[0].name;

		// 参照ファイル名を出力
		outputFileNames( filenames );

		// 読み込みタグや元ソースのテキストをグローバル変数に格納
		g_tags = tags;
		g_src = reader.result;

		// 参照ファイルエリアを表示
		ref_area.style.display = 'block';
		const ref_files_text = document.querySelector( '#ref-files-text' );
		ref_files_text.select();
		document.execCommand( 'copy' );
	}
}
