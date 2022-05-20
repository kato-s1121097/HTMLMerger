/*********************************************************************
 * File: modal.js
 * Description: モーダル表示に関わるモジュール
 * Create: 2022/05/17(Tue)
 * Update: 2022/05/20(Fri)
 * 			・モーダルのクラス化
 ********************************************************************/
/********************************************************************
 * 
 */
class Modal
{
	wrapper;

	show()
	{
		this.wrapper.style.display = 'block';
	}

	hide()
	{
		this.wrapper.style.display = 'none';
	}

	setValue( query, value )
	{
		document.querySelector( query ).innerHTML = value;
	}

	clickOutside( func )
	{
		this.wrapper.addEventListener( 'click', ( event ) => {
			if ( event.target.closest( '.modal' ) === null ) func();
		});
	}
}

class TutorialModal extends Modal
{
	constructor()
	{
		super();
		this.wrapper = document.querySelector( '#tutorial-wrapper' );
	}
}

class ErrorModal extends Modal
{
	constructor()
	{
		super();
		this.wrapper = document.querySelector( '#error-modal-wrapper' );
	}
}

const tutorial_modal = new TutorialModal();

const help_btn = document.querySelector( '.help-btn' );
help_btn.onclick = () => {
	tutorial_modal.show();
};

tutorial_modal.clickOutside( () => {
	tutorial_modal.hide();
});

function showError( error_message )
{
	const error_modal = new ErrorModal();
	error_modal.setValue( '#error-message', error_message );
	error_modal.clickOutside( () => { error_modal.hide(); } );
	error_modal.show();
}