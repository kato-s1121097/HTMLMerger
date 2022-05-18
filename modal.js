/*********************************************************************
 * File: modal.js
 * Description: モーダル表示に関わるモジュール
 * Create: 2022/05/17(Tue)
 * Update: 2022/05/17(Tue)
 ********************************************************************/
const tutorial_wrapper = document.querySelector( '#tutorial-wrapper' );

const help_btn = document.querySelector( '.help-btn' );
help_btn.onclick = () => {
	tutorial_wrapper.style.display = 'block';
};

tutorial_wrapper.onclick = () => {
	tutorial_wrapper.style.display = 'none';
};