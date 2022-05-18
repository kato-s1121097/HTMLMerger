/**************************************************
 * File: main.js
 * Description: HTMLMergerのメイン部分
 * Create: 2022/05/17(Tue)
 * Update: 2022/05/18(Wed)
 * 			・タグ管理のクラス化
 **************************************************/

/*******************************************************************
 * Class: TagManager
 * Description: タグの配列(tags)を管理するクラス
 ******************************************************************/
class TagManager
{
	// Tagオブジェクトの配列 (Tag { data:str, type:int })
	tags;

	constructor( src )
	{
		this.initTags( src );
	}

	/*******************************************************************
	 * Method: initTags
	 * Description: tagsフィールドをsrcから取得したタグで初期化する
	 * Params: src = link,scriptタグを取得する文字列
	 ******************************************************************/
	initTags( src )
	{
		this.tags = [];

		// srcが空文字列やundefinedだったらtagsを空配列にして終了
		if ( src === '' || typeof src === 'undefined' ) return;
	
		// linkタグを取得
		let link_tags = src.match( /<link[^>]*>/gi );
	
		// linkタグが存在していたら結果にタグオブジェクトを追加
		if ( link_tags )
		{
			link_tags.forEach( ( link_tag ) => {
				this.tags.push( { data: link_tag, type: TAG_LINK } );
			});
		}
	
		// scriptタグを取得
		let script_tags = src.match( /<script[^>]*>([^<]*<\/script>)?/gi );
	
		// scriptタグが存在していたら結果にタグオブジェクトを追加
		if ( script_tags )
		{
			script_tags.forEach( ( script_tag ) => {
				this.tags.push( { data: script_tag, type: TAG_SCRIPT } );
			});
		}
	}

	getTags()
	{
		return this.tags;
	}

	getTag( index )
	{
		return this.tags[index];
	}

	getTagData( index )
	{
		return this.tags[index].data;
	}

	getTagType( index )
	{
		return this.tags[index].type;
	}

	setTag( index, tag )
	{
		if ( index <= 0 || typeof tag === 'undefined' ) return;

		this.tags[index] = tag;
	}

	pushTag( tag )
	{
		this.tags.push( tag );
	}

	/*************************************************************************
	 * Method: removeTagByAttr
	 * Description: attrに指定した属性にstrが含まているタグをtagsから除外する
	 * params: attr = strを探す属性, str = attrに指定した属性値に含まれている場合にタグを除外する文字列
	 ************************************************************************/
	removeTagByAttr( attr, str )
	{
		// マッチングに使用する正規表現
		let attr_search = RegExp( attr + ' *=[^\"]*\"[^\"]*\"', 'i' );
		let str_search = RegExp( '(?<=\").*' + str + '.*(?=\")' );

		// 除外するタグのインデックス
		let remove_indexes = [];
		for ( let i = 0; i < this.tags.length; i++ )
		{
			// 属性マッチング
			let attr_match = this.tags[i].data.match( attr_search );

			// タグが指定された属性を持っていなければスキップ
			if ( attr_match === null ) continue;

			console.log( attr_match );

			// strマッチング
			let str_match = attr_match[0].match( str_search );

			// マッチングしたらタグを除外配列に追加(ここで除外するとループが壊れるため)
			if ( str_match !== null ) remove_indexes.push( i );
		}

		// 除外処理
		remove_indexes.forEach( ( remove_index ) => {
			console.log( `${this.tags[remove_index].data}が除外されました` );
			this.tags.splice( remove_index, 1 );
		});
	}

	/***************************************************************
	 * Method: createFileNames
	 * Description: tagsからファイル名の配列を生成して返す
	 * Return: file名の文字列配列またはnull
	 **************************************************************/
	createFileNames()
	{
		// tagsに要素が入っていなければnullを返す
		if ( this.tags === null || this.tags.length <= 0 ) return null;

		// ファイル名
		let filenames = [];

		// 全てのタグに対して処理
		this.tags.forEach( ( tag ) => {
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
}

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
var g_tag_manager;
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
			let pattern = new RegExp( g_tag_manager.getTagData( i ), 'g' );
			const tag_type = g_tag_manager.getTagType( i );
			g_src = g_src.replace( pattern, `${TAG_START[tag_type]}${reader.result}${TAG_END[tag_type]}` );

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
		g_tag_manager = new TagManager( reader.result );
		// 参照ファイルが無ければ参照ファイルが無い事を出力して終了
		if ( g_tag_manager.getTags().length <= 0 )
		{
			printOutputArea( '参照しているファイルはありません', PRINT_MODE_NEW );
			return;
		}

		g_tag_manager.removeTagByAttr( 'src', 'https?:' );
		g_tag_manager.removeTagByAttr( 'href', 'https?:' );

		let filenames = g_tag_manager.createFileNames();
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

		// 元ソースのテキストをグローバル変数に格納
		g_src = reader.result;

		// 参照ファイルエリアを表示
		ref_area.style.display = 'block';
		const ref_files_text = document.querySelector( '#ref-files-text' );
		ref_files_text.select();
		document.execCommand( 'copy' );
	}
}
